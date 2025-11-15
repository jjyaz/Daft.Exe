import { walletManager } from './wallet';
import { supabase } from './supabase';
import { getMockUserId } from './mockAuth';

export interface BridgeTransaction {
  id: string;
  fromChain: string;
  toChain: string;
  amount: string;
  token: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  txHash?: string;
  destinationTxHash?: string;
  estimatedTime: number;
  fee: string;
}

export class CrossChainBridge {
  private supportedChains = [
    'Solana',
    'Ethereum',
    'Polygon',
    'Avalanche',
    'Arbitrum',
    'Optimism',
    'Polkadot',
    'BSC'
  ];

  private bridgeFees: Record<string, number> = {
    'Solana': 0.001,
    'Ethereum': 0.005,
    'Polygon': 0.0001,
    'Avalanche': 0.002,
    'Arbitrum': 0.0005,
    'Optimism': 0.0005,
    'Polkadot': 0.003,
    'BSC': 0.0002
  };

  getSupportedChains(): string[] {
    return this.supportedChains;
  }

  calculateFee(fromChain: string, toChain: string, amount: number): number {
    const baseFee = this.bridgeFees[fromChain] || 0.001;
    const destFee = this.bridgeFees[toChain] || 0.001;
    const percentageFee = amount * 0.001;
    return baseFee + destFee + percentageFee;
  }

  estimateBridgeTime(fromChain: string, toChain: string): number {
    if (fromChain === 'Solana' || toChain === 'Solana') {
      return 30;
    }
    if (fromChain === 'Ethereum' || toChain === 'Ethereum') {
      return 300;
    }
    return 120;
  }

  async bridgeAssets(
    fromChain: string,
    toChain: string,
    amount: string,
    token: string
  ): Promise<BridgeTransaction> {
    if (!walletManager.publicKey) {
      throw new Error('Wallet not connected');
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      throw new Error('Invalid amount');
    }

    if (fromChain === toChain) {
      throw new Error('Cannot bridge to the same chain');
    }

    const fee = this.calculateFee(fromChain, toChain, amountNum);
    const estimatedTime = this.estimateBridgeTime(fromChain, toChain);

    const { data: dbTransaction, error } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: getMockUserId(),
          from_chain: fromChain,
          to_chain: toChain,
          amount: amount,
          token: token,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error('Failed to create transaction record');
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const sourceTxHash = await this.generateTransactionHash(fromChain);

    await supabase
      .from('transactions')
      .update({
        status: 'processing',
        tx_hash: sourceTxHash,
      })
      .eq('id', dbTransaction.id);

    await new Promise((resolve) =>
      setTimeout(resolve, estimatedTime * 1000 * 0.3)
    );

    const destinationTxHash = await this.generateTransactionHash(toChain);

    await supabase
      .from('transactions')
      .update({
        status: 'completed',
      })
      .eq('id', dbTransaction.id);

    return {
      id: dbTransaction.id,
      fromChain,
      toChain,
      amount,
      token,
      status: 'completed',
      txHash: sourceTxHash,
      destinationTxHash,
      estimatedTime,
      fee: fee.toFixed(6),
    };
  }

  async getTransactionStatus(transactionId: string): Promise<BridgeTransaction | null> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      fromChain: data.from_chain,
      toChain: data.to_chain,
      amount: data.amount,
      token: data.token,
      status: data.status,
      txHash: data.tx_hash,
      estimatedTime: this.estimateBridgeTime(data.from_chain, data.to_chain),
      fee: this.calculateFee(
        data.from_chain,
        data.to_chain,
        parseFloat(data.amount)
      ).toFixed(6),
    };
  }

  async getUserTransactions(): Promise<BridgeTransaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', getMockUserId())
      .order('created_at', { ascending: false })
      .limit(10);

    if (error || !data) {
      return [];
    }

    return data.map((tx) => ({
      id: tx.id,
      fromChain: tx.from_chain,
      toChain: tx.to_chain,
      amount: tx.amount,
      token: tx.token,
      status: tx.status,
      txHash: tx.tx_hash,
      estimatedTime: this.estimateBridgeTime(tx.from_chain, tx.to_chain),
      fee: this.calculateFee(
        tx.from_chain,
        tx.to_chain,
        parseFloat(tx.amount)
      ).toFixed(6),
    }));
  }

  private async generateTransactionHash(chain: string): Promise<string> {
    const prefix = chain === 'Solana' ? '' : '0x';
    const length = chain === 'Solana' ? 88 : 64;
    const chars =
      chain === 'Solana'
        ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        : '0123456789abcdef';

    let hash = prefix;
    for (let i = 0; i < length; i++) {
      hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return hash;
  }

  async migrateAgent(
    agentId: string,
    fromChain: string,
    toChain: string
  ): Promise<{ success: boolean; newAddress: string; txHash: string }> {
    if (!walletManager.publicKey) {
      throw new Error('Wallet not connected');
    }

    await supabase
      .from('bridge_operations')
      .insert([
        {
          user_id: getMockUserId(),
          agent_id: agentId,
          from_chain: fromChain,
          to_chain: toChain,
          status: 'processing',
        },
      ]);

    await new Promise((resolve) => setTimeout(resolve, 2500));

    const newAddress = await this.generateTransactionHash(toChain);
    const txHash = await this.generateTransactionHash(fromChain);

    await supabase
      .from('bridge_operations')
      .update({ status: 'completed' })
      .eq('agent_id', agentId)
      .eq('user_id', getMockUserId())
      .eq('status', 'processing');

    return {
      success: true,
      newAddress,
      txHash,
    };
  }
}

export const crossChainBridge = new CrossChainBridge();
