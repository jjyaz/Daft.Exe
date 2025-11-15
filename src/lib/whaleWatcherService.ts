import { Connection, PublicKey } from '@solana/web3.js';
import { supabase } from './supabase';
import { getMockUserId } from './mockAuth';
import { walletManager } from './wallet';

export interface WhaleWatch {
  id: string;
  whale_address: string;
  nickname: string | null;
  min_transaction_amount: number;
  notify_on_transaction: boolean;
  last_checked: string;
  created_at: string;
}

export interface WhaleTransaction {
  id: string;
  whale_address: string;
  signature: string;
  amount: number;
  token_symbol: string | null;
  from_address: string | null;
  to_address: string | null;
  timestamp: string;
  created_at: string;
}

export class WhaleWatcherService {
  private connection: Connection;

  constructor() {
    this.connection = walletManager.connection;
  }

  async addWhaleWatch(
    address: string,
    nickname?: string,
    minAmount: number = 100
  ): Promise<{ success: boolean; watchId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('whale_watches')
        .insert([
          {
            user_id: getMockUserId(),
            whale_address: address,
            nickname,
            min_transaction_amount: minAmount,
            notify_on_transaction: true,
          },
        ])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: 'Already watching this address' };
        }
        console.error('Error adding whale watch:', error);
        return { success: false, error: error.message };
      }

      return { success: true, watchId: data.id };
    } catch (error: any) {
      console.error('Error adding whale watch:', error);
      return { success: false, error: error.message };
    }
  }

  async getWhaleWatches(): Promise<WhaleWatch[]> {
    try {
      const { data, error } = await supabase
        .from('whale_watches')
        .select('*')
        .eq('user_id', getMockUserId())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching whale watches:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching whale watches:', error);
      return [];
    }
  }

  async removeWhaleWatch(watchId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('whale_watches')
        .delete()
        .eq('id', watchId)
        .eq('user_id', getMockUserId());

      if (error) {
        console.error('Error removing whale watch:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error removing whale watch:', error);
      return { success: false, error: error.message };
    }
  }

  async getWhaleTransactions(whaleAddress?: string, limit: number = 20): Promise<WhaleTransaction[]> {
    try {
      let query = supabase
        .from('whale_transactions')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (whaleAddress) {
        query = query.eq('whale_address', whaleAddress);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching whale transactions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching whale transactions:', error);
      return [];
    }
  }

  async checkWhaleActivity(whaleAddress: string): Promise<any[]> {
    try {
      console.log('Checking whale activity for:', whaleAddress);

      const publicKey = new PublicKey(whaleAddress);
      const signatures = await this.connection.getSignaturesForAddress(publicKey, {
        limit: 10,
      });

      console.log(`Found ${signatures.length} recent transactions`);

      const recentTransactions: any[] = [];

      for (const sig of signatures.slice(0, 5)) {
        try {
          const tx = await this.connection.getParsedTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0,
          });

          if (!tx || !tx.meta) continue;

          const preBalances = tx.meta.preBalances;
          const postBalances = tx.meta.postBalances;

          if (preBalances.length > 0 && postBalances.length > 0) {
            const balanceChange = Math.abs(postBalances[0] - preBalances[0]) / 1e9;

            if (balanceChange > 0.01) {
              recentTransactions.push({
                signature: sig.signature,
                amount: balanceChange,
                timestamp: new Date((sig.blockTime || 0) * 1000),
              });
            }
          }
        } catch (txError) {
          console.error('Error parsing transaction:', txError);
        }
      }

      return recentTransactions;
    } catch (error: any) {
      console.error('Error checking whale activity:', error);
      return [];
    }
  }

  async saveWhaleTransaction(
    whaleAddress: string,
    signature: string,
    amount: number,
    timestamp: Date
  ): Promise<void> {
    try {
      const { data: existing } = await supabase
        .from('whale_transactions')
        .select('id')
        .eq('signature', signature)
        .maybeSingle();

      if (existing) {
        return;
      }

      await supabase.from('whale_transactions').insert([
        {
          whale_address: whaleAddress,
          signature,
          amount,
          token_symbol: 'SOL',
          timestamp: timestamp.toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Error saving whale transaction:', error);
    }
  }

  async updateLastChecked(watchId: string): Promise<void> {
    try {
      await supabase
        .from('whale_watches')
        .update({ last_checked: new Date().toISOString() })
        .eq('id', watchId);
    } catch (error) {
      console.error('Error updating last checked:', error);
    }
  }
}

export const whaleWatcherService = new WhaleWatcherService();
