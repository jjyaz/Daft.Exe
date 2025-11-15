import { Connection, VersionedTransaction } from '@solana/web3.js';
import { walletManager } from './wallet';
import { supabase } from './supabase';
import { getMockUserId } from './mockAuth';

const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6/quote';
const JUPITER_SWAP_API = 'https://quote-api.jup.ag/v6/swap';
const JUPITER_PRICE_API = 'https://price.jup.ag/v4/price';

export interface QuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: number;
  routePlan: any[];
}

export interface TokenPrice {
  id: string;
  mintSymbol: string;
  vsToken: string;
  vsTokenSymbol: string;
  price: number;
}

export class JupiterService {
  private connection: Connection;

  constructor() {
    this.connection = walletManager.connection;
  }

  async getQuote(
    inputMint: string,
    outputMint: string,
    amount: number,
    slippageBps: number = 50
  ): Promise<QuoteResponse> {
    try {
      const amountInSmallestUnit = Math.floor(amount * 1e9);

      const params = new URLSearchParams({
        inputMint,
        outputMint,
        amount: amountInSmallestUnit.toString(),
        slippageBps: slippageBps.toString(),
      });

      console.log('Fetching Jupiter quote:', JUPITER_QUOTE_API + '?' + params.toString());

      const response = await fetch(`${JUPITER_QUOTE_API}?${params.toString()}`);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Jupiter API error: ${error}`);
      }

      const quote = await response.json();
      console.log('Jupiter quote received:', quote);

      return quote;
    } catch (error: any) {
      console.error('Error fetching Jupiter quote:', error);
      throw new Error('Failed to get swap quote: ' + error.message);
    }
  }

  async executeSwap(
    quote: QuoteResponse,
    fromSymbol: string,
    toSymbol: string
  ): Promise<{ signature: string; outputAmount: number }> {
    if (!walletManager.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      console.log('Executing swap via Jupiter...');

      const swapResponse = await fetch(JUPITER_SWAP_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: walletManager.publicKey.toString(),
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: 'auto',
        }),
      });

      if (!swapResponse.ok) {
        const error = await swapResponse.text();
        throw new Error(`Swap API error: ${error}`);
      }

      const { swapTransaction } = await swapResponse.json();

      console.log('Deserializing transaction...');
      const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

      console.log('Requesting wallet signature...');

      if (typeof window !== 'undefined') {
        const solana = (window as any).solana;
        const solflare = (window as any).solflare;
        const wallet = solana?.isPhantom ? solana : solflare;

        if (!wallet) {
          throw new Error('No wallet found');
        }

        const signedTransaction = await wallet.signTransaction(transaction);

        console.log('Sending transaction to blockchain...');
        const rawTransaction = signedTransaction.serialize();
        const signature = await this.connection.sendRawTransaction(rawTransaction, {
          skipPreflight: false,
          maxRetries: 3,
        });

        console.log('Transaction sent:', signature);
        console.log('Confirming transaction...');

        await this.connection.confirmTransaction(signature, 'confirmed');
        console.log('Transaction confirmed!');

        const outputAmount = parseFloat(quote.outAmount) / 1e9;

        await supabase.from('swap_transactions').insert([
          {
            user_id: getMockUserId(),
            from_token: quote.inputMint,
            to_token: quote.outputMint,
            from_amount: parseFloat(quote.inAmount) / 1e9,
            to_amount: outputAmount,
            from_symbol: fromSymbol,
            to_symbol: toSymbol,
            signature,
            price_impact: quote.priceImpactPct,
            status: 'success',
          },
        ]);

        return { signature, outputAmount };
      }

      throw new Error('Window object not available');
    } catch (error: any) {
      console.error('Swap execution error:', error);

      await supabase.from('swap_transactions').insert([
        {
          user_id: getMockUserId(),
          from_token: quote.inputMint,
          to_token: quote.outputMint,
          from_amount: parseFloat(quote.inAmount) / 1e9,
          to_amount: 0,
          from_symbol: fromSymbol,
          to_symbol: toSymbol,
          status: 'failed',
        },
      ]);

      throw new Error('Swap failed: ' + error.message);
    }
  }

  async getTokenPrice(tokenIds: string[]): Promise<Record<string, TokenPrice>> {
    try {
      const params = new URLSearchParams({
        ids: tokenIds.join(','),
      });

      const response = await fetch(`${JUPITER_PRICE_API}?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch prices');
      }

      const data = await response.json();
      return data.data || {};
    } catch (error: any) {
      console.error('Error fetching token prices:', error);
      return {};
    }
  }

  async getMultipleTokenPrices(tokens: string[]): Promise<Record<string, number>> {
    try {
      const priceData = await this.getTokenPrice(tokens);
      const prices: Record<string, number> = {};

      for (const [address, data] of Object.entries(priceData)) {
        prices[address] = data.price;
      }

      return prices;
    } catch (error) {
      console.error('Error fetching multiple token prices:', error);
      return {};
    }
  }

  async getUserSwapHistory(limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('swap_transactions')
        .select('*')
        .eq('user_id', getMockUserId())
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching swap history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserSwapHistory:', error);
      return [];
    }
  }
}

export const jupiterService = new JupiterService();

export const COMMON_TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  WIF: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
  JTO: 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',
  PYTH: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3',
};
