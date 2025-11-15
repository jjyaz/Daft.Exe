import { supabase } from './supabase';
import { getMockUserId } from './mockAuth';
import { jupiterService } from './jupiterService';

export interface PriceAlert {
  id: string;
  token_address: string;
  token_symbol: string;
  target_price: number;
  condition: 'above' | 'below';
  triggered: boolean;
  triggered_at?: string;
  active: boolean;
  created_at: string;
}

export class PriceAlertService {
  async createAlert(
    tokenAddress: string,
    tokenSymbol: string,
    targetPrice: number,
    condition: 'above' | 'below'
  ): Promise<{ success: boolean; alertId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('price_alerts')
        .insert([
          {
            user_id: getMockUserId(),
            token_address: tokenAddress,
            token_symbol: tokenSymbol,
            target_price: targetPrice,
            condition,
            active: true,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating alert:', error);
        return { success: false, error: error.message };
      }

      return { success: true, alertId: data.id };
    } catch (error: any) {
      console.error('Error creating alert:', error);
      return { success: false, error: error.message };
    }
  }

  async getActiveAlerts(): Promise<PriceAlert[]> {
    try {
      const { data, error } = await supabase
        .from('price_alerts')
        .select('*')
        .eq('user_id', getMockUserId())
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching alerts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return [];
    }
  }

  async getAllAlerts(): Promise<PriceAlert[]> {
    try {
      const { data, error } = await supabase
        .from('price_alerts')
        .select('*')
        .eq('user_id', getMockUserId())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching alerts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return [];
    }
  }

  async deleteAlert(alertId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('price_alerts')
        .delete()
        .eq('id', alertId)
        .eq('user_id', getMockUserId());

      if (error) {
        console.error('Error deleting alert:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting alert:', error);
      return { success: false, error: error.message };
    }
  }

  async checkAlerts(): Promise<PriceAlert[]> {
    try {
      const alerts = await this.getActiveAlerts();

      if (alerts.length === 0) {
        return [];
      }

      const tokenAddresses = [...new Set(alerts.map((a) => a.token_address))];
      const prices = await jupiterService.getMultipleTokenPrices(tokenAddresses);

      const triggeredAlerts: PriceAlert[] = [];

      for (const alert of alerts) {
        const currentPrice = prices[alert.token_address];

        if (!currentPrice) continue;

        const shouldTrigger =
          (alert.condition === 'above' && currentPrice >= alert.target_price) ||
          (alert.condition === 'below' && currentPrice <= alert.target_price);

        if (shouldTrigger) {
          await supabase
            .from('price_alerts')
            .update({
              triggered: true,
              triggered_at: new Date().toISOString(),
              active: false,
            })
            .eq('id', alert.id);

          triggeredAlerts.push(alert);
        }
      }

      return triggeredAlerts;
    } catch (error) {
      console.error('Error checking alerts:', error);
      return [];
    }
  }
}

export const priceAlertService = new PriceAlertService();
