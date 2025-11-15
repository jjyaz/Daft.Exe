import { Connection, PublicKey } from '@solana/web3.js';
import { jupiterService } from './jupiterService';
import { walletManager } from './wallet';
import { BackendService } from './backendService';

export interface TokenHolding {
  mint: string;
  symbol: string;
  amount: number;
  decimals: number;
  uiAmount: number;
  price?: number;
  value?: number;
  priceChange24h?: number;
}

export interface PortfolioData {
  totalValue: number;
  solBalance: number;
  solValue: number;
  tokens: TokenHolding[];
  priceChange24h: number;
  lastUpdated: Date;
}

export class PortfolioService {
  private connection: Connection;

  constructor() {
    this.connection = walletManager.connection;
  }

  async getPortfolio(walletAddress: string): Promise<PortfolioData> {
    try {
      console.log('Fetching portfolio for:', walletAddress);

      const solBalance = await walletManager.getBalance();
      console.log('SOL balance:', solBalance);

      let tokenAccounts: any[] = [];
      try {
        tokenAccounts = await BackendService.getTokenAccounts(walletAddress);
      } catch (error) {
        console.warn('Backend unavailable, fetching directly:', error);
        const publicKey = new PublicKey(walletAddress);
        const response = await this.connection.getParsedTokenAccountsByOwner(publicKey, {
          programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        });
        tokenAccounts = response.value.map((account) => ({
          mint: account.account.data.parsed.info.mint,
          amount: account.account.data.parsed.info.tokenAmount.amount,
          decimals: account.account.data.parsed.info.tokenAmount.decimals,
          uiAmount: account.account.data.parsed.info.tokenAmount.uiAmount,
        }));
      }

      console.log('Found', tokenAccounts.length, 'token accounts');

      const tokenMints = tokenAccounts
        .filter((t) => t.uiAmount > 0)
        .map((t) => t.mint);

      const prices = tokenMints.length > 0
        ? await jupiterService.getMultipleTokenPrices([
            'So11111111111111111111111111111111111111112',
            ...tokenMints,
          ])
        : { So11111111111111111111111111111111111111112: 0 };

      console.log('Fetched prices for', Object.keys(prices).length, 'tokens');

      const solPrice = prices['So11111111111111111111111111111111111111112'] || 0;
      const solValue = solBalance * solPrice;

      const tokens: TokenHolding[] = tokenAccounts
        .filter((t) => t.uiAmount > 0)
        .map((t) => {
          const price = prices[t.mint] || 0;
          const value = t.uiAmount * price;
          return {
            mint: t.mint,
            symbol: this.getTokenSymbol(t.mint),
            amount: parseFloat(t.amount),
            decimals: t.decimals,
            uiAmount: t.uiAmount,
            price,
            value,
          };
        })
        .sort((a, b) => (b.value || 0) - (a.value || 0));

      const totalTokenValue = tokens.reduce((sum, t) => sum + (t.value || 0), 0);
      const totalValue = solValue + totalTokenValue;

      return {
        totalValue,
        solBalance,
        solValue,
        tokens,
        priceChange24h: 0,
        lastUpdated: new Date(),
      };
    } catch (error: any) {
      console.error('Error fetching portfolio:', error);
      throw new Error('Failed to fetch portfolio: ' + error.message);
    }
  }

  private getTokenSymbol(mint: string): string {
    const knownTokens: Record<string, string> = {
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 'BONK',
      'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm': 'WIF',
      'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL': 'JTO',
      'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3': 'PYTH',
      'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': 'mSOL',
      'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn': 'JitoSOL',
      'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1': 'bSOL',
    };

    return knownTokens[mint] || mint.substring(0, 6) + '...';
  }

  async getHistoricalData(walletAddress: string, days: number = 7): Promise<any[]> {
    return [];
  }
}

export const portfolioService = new PortfolioService();
