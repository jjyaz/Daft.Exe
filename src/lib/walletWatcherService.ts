import { supabase } from './supabase';
import { getMockUserId } from './mockAuth';
import { portfolioService } from './portfolioService';

export interface WatchedWallet {
  id: string;
  wallet_address: string;
  nickname: string | null;
  notes: string | null;
  is_primary: boolean;
  created_at: string;
}

export class WalletWatcherService {
  async addWallet(
    address: string,
    nickname?: string,
    notes?: string,
    isPrimary: boolean = false
  ): Promise<{ success: boolean; walletId?: string; error?: string }> {
    try {
      if (isPrimary) {
        await supabase
          .from('watched_wallets')
          .update({ is_primary: false })
          .eq('user_id', getMockUserId());
      }

      const { data, error } = await supabase
        .from('watched_wallets')
        .insert([
          {
            user_id: getMockUserId(),
            wallet_address: address,
            nickname,
            notes,
            is_primary: isPrimary,
          },
        ])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: 'Wallet already being watched' };
        }
        console.error('Error adding wallet:', error);
        return { success: false, error: error.message };
      }

      return { success: true, walletId: data.id };
    } catch (error: any) {
      console.error('Error adding wallet:', error);
      return { success: false, error: error.message };
    }
  }

  async getWatchedWallets(): Promise<WatchedWallet[]> {
    try {
      const { data, error } = await supabase
        .from('watched_wallets')
        .select('*')
        .eq('user_id', getMockUserId())
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching watched wallets:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching watched wallets:', error);
      return [];
    }
  }

  async updateWallet(
    walletId: string,
    updates: Partial<Pick<WatchedWallet, 'nickname' | 'notes' | 'is_primary'>>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (updates.is_primary) {
        await supabase
          .from('watched_wallets')
          .update({ is_primary: false })
          .eq('user_id', getMockUserId());
      }

      const { error } = await supabase
        .from('watched_wallets')
        .update(updates)
        .eq('id', walletId)
        .eq('user_id', getMockUserId());

      if (error) {
        console.error('Error updating wallet:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error updating wallet:', error);
      return { success: false, error: error.message };
    }
  }

  async removeWallet(walletId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('watched_wallets')
        .delete()
        .eq('id', walletId)
        .eq('user_id', getMockUserId());

      if (error) {
        console.error('Error removing wallet:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error removing wallet:', error);
      return { success: false, error: error.message };
    }
  }

  async getAggregatedPortfolio(): Promise<any> {
    try {
      const wallets = await this.getWatchedWallets();

      if (wallets.length === 0) {
        return {
          totalValue: 0,
          wallets: [],
        };
      }

      const portfolios = await Promise.all(
        wallets.map(async (wallet) => {
          try {
            const portfolio = await portfolioService.getPortfolio(wallet.wallet_address);
            return {
              ...wallet,
              portfolio,
            };
          } catch (error) {
            console.error(`Error fetching portfolio for ${wallet.wallet_address}:`, error);
            return {
              ...wallet,
              portfolio: null,
            };
          }
        })
      );

      const totalValue = portfolios.reduce(
        (sum, w) => sum + (w.portfolio?.totalValue || 0),
        0
      );

      return {
        totalValue,
        wallets: portfolios,
      };
    } catch (error) {
      console.error('Error fetching aggregated portfolio:', error);
      return {
        totalValue: 0,
        wallets: [],
      };
    }
  }
}

export const walletWatcherService = new WalletWatcherService();
