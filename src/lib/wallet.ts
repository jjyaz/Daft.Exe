import { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createMint, getMinimumBalanceForRentExemptMint, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { BackendService } from './backendService';

const SOLANA_RPC = 'https://rpc.ankr.com/solana';
const USE_BACKEND_API = true;

export class WalletManager {
  connection: Connection;
  publicKey: PublicKey | null = null;

  constructor() {
    this.connection = new Connection(SOLANA_RPC, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000
    });
    console.log('WalletManager initialized with RPC:', SOLANA_RPC);
  }

  async fetchBalanceWithRetry(publicKey: PublicKey, maxRetries = 3): Promise<number> {
    if (USE_BACKEND_API) {
      try {
        console.log('Fetching balance via backend API...');
        const balanceInSOL = await BackendService.getBalance(publicKey.toString());
        const balanceInLamports = balanceInSOL * LAMPORTS_PER_SOL;
        console.log('Balance fetched via backend:', balanceInSOL, 'SOL');
        return balanceInLamports;
      } catch (error: any) {
        console.warn('Backend API failed, falling back to direct RPC:', error);
      }
    }

    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log(`Attempting to fetch balance via RPC (attempt ${i + 1}/${maxRetries})...`);
        const balance = await this.connection.getBalance(publicKey);
        console.log('Balance fetched successfully:', balance, 'lamports');
        return balance;
      } catch (error: any) {
        console.error(`Balance fetch attempt ${i + 1} failed:`, error);
        if (i === maxRetries - 1) {
          throw new Error('Failed to fetch balance after multiple attempts: ' + error.message);
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    return 0;
  }

  async connectWallet(): Promise<{ address: string; balance: number }> {
    if (typeof window !== 'undefined') {
      const solana = (window as any).solana;
      const solflare = (window as any).solflare;

      if (solana && solana.isPhantom) {
        try {
          console.log('Connecting to Phantom wallet...');

          if (solana.isConnected) {
            console.log('Wallet already connected, using existing connection');
            this.publicKey = solana.publicKey;
          } else {
            const response = await solana.connect();
            this.publicKey = response.publicKey;
          }

          if (!this.publicKey) throw new Error('Failed to get public key');

          console.log('Fetching balance for:', this.publicKey.toString());
          const balance = await this.fetchBalanceWithRetry(this.publicKey);
          console.log('Balance in SOL:', balance / LAMPORTS_PER_SOL);

          return {
            address: this.publicKey.toString(),
            balance: balance / LAMPORTS_PER_SOL
          };
        } catch (error: any) {
          console.error('Phantom connection error:', error);

          if (error.message && error.message.includes('User rejected')) {
            throw new Error('Connection cancelled by user');
          }

          throw error;
        }
      } else if (solflare) {
        try {
          console.log('Connecting to Solflare wallet...');

          if (solflare.isConnected) {
            console.log('Wallet already connected, using existing connection');
            this.publicKey = solflare.publicKey;
          } else {
            await solflare.connect();
            this.publicKey = solflare.publicKey;
          }

          if (!this.publicKey) throw new Error('Failed to get public key');

          console.log('Fetching balance for:', this.publicKey.toString());
          const balance = await this.fetchBalanceWithRetry(this.publicKey);
          console.log('Balance in SOL:', balance / LAMPORTS_PER_SOL);

          return {
            address: this.publicKey.toString(),
            balance: balance / LAMPORTS_PER_SOL
          };
        } catch (error: any) {
          console.error('Solflare connection error:', error);

          if (error.message && error.message.includes('User rejected')) {
            throw new Error('Connection cancelled by user');
          }

          throw error;
        }
      } else {
        throw new Error('No Solana wallet detected. Please install Phantom or Solflare.');
      }
    }

    const keypair = Keypair.generate();
    this.publicKey = keypair.publicKey;
    return {
      address: this.publicKey.toString(),
      balance: Math.random() * 10
    };
  }

  async getBalance(): Promise<number> {
    if (!this.publicKey) {
      console.warn('No public key available for balance fetch');
      return 0;
    }
    try {
      const balance = await this.fetchBalanceWithRetry(this.publicKey);
      console.log('Current balance:', balance / LAMPORTS_PER_SOL, 'SOL');
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return 0;
    }
  }

  async createToken(decimals: number = 9): Promise<string> {
    if (!this.publicKey) throw new Error('Wallet not connected');

    try {
      console.log('Creating SPL token with decimals:', decimals);
      console.log('Mint authority (wallet):', this.publicKey.toString());

      if (typeof window !== 'undefined') {
        const solana = (window as any).solana;
        const solflare = (window as any).solflare;
        const wallet = solana?.isPhantom ? solana : solflare;

        if (!wallet) {
          throw new Error('No wallet found for signing transactions');
        }

        const mintKeypair = Keypair.generate();
        console.log('Generated mint keypair:', mintKeypair.publicKey.toString());

        const lamports = await getMinimumBalanceForRentExemptMint(this.connection);
        console.log('Rent-exempt balance required:', lamports, 'lamports');

        const mintPubkey = await createMint(
          this.connection,
          {
            publicKey: this.publicKey,
            signTransaction: wallet.signTransaction.bind(wallet),
            signAllTransactions: wallet.signAllTransactions.bind(wallet),
          } as any,
          this.publicKey,
          this.publicKey,
          decimals,
          mintKeypair
        );

        console.log('SPL Token created successfully:', mintPubkey.toString());
        return mintPubkey.toString();
      }

      throw new Error('Window object not available');
    } catch (error: any) {
      console.error('Error creating SPL token:', error);
      throw new Error('Failed to create token: ' + error.message);
    }
  }

  isWalletInstalled(): { phantom: boolean; solflare: boolean } {
    if (typeof window === 'undefined') {
      return { phantom: false, solflare: false };
    }

    return {
      phantom: !!(window as any).solana && (window as any).solana.isPhantom,
      solflare: !!(window as any).solflare
    };
  }

  getInstalledWallets(): string[] {
    const installed = this.isWalletInstalled();
    const wallets: string[] = [];
    if (installed.phantom) wallets.push('Phantom');
    if (installed.solflare) wallets.push('Solflare');
    return wallets;
  }

  async sendTransaction(to: string, amount: number): Promise<string> {
    if (!this.publicKey) throw new Error('Wallet not connected');

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: this.publicKey,
        toPubkey: new PublicKey(to),
        lamports: amount * LAMPORTS_PER_SOL,
      })
    );

    if (typeof window !== 'undefined') {
      const solana = (window as any).solana;
      const solflare = (window as any).solflare;

      try {
        if (solana && solana.isPhantom) {
          transaction.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
          transaction.feePayer = this.publicKey;
          const signed = await solana.signTransaction(transaction);
          const signature = await this.connection.sendRawTransaction(signed.serialize());
          await this.connection.confirmTransaction(signature);
          return signature;
        } else if (solflare) {
          transaction.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
          transaction.feePayer = this.publicKey;
          const signed = await solflare.signTransaction(transaction);
          const signature = await this.connection.sendRawTransaction(signed.serialize());
          await this.connection.confirmTransaction(signature);
          return signature;
        }
      } catch (error) {
        console.error('Transaction error:', error);
        throw error;
      }
    }

    return 'simulated_tx_' + Math.random().toString(36).substring(7);
  }
}

export const walletManager = new WalletManager();
