import { aiEngine } from './ai';

export interface ZKProof {
  proof: string;
  publicInputs: any;
  timestamp: number;
  proofType: string;
}

export interface PerformanceProof {
  returns: string;
  winRate: string;
  sharpeRatio: string;
  proof: string;
}

export interface BalanceProof {
  balanceRange: string;
  whaleTier: string;
  proof: string;
}

export interface ReputationProof {
  claim: string;
  threshold: number;
  proof: string;
}

export class ZKProofService {
  static async generatePerformanceProof(
    strategyId: string,
    returns: number,
    winRate: number,
    sharpeRatio: number,
    trades: number
  ): Promise<PerformanceProof> {
    const data = {
      strategyId,
      returnsActual: returns,
      winRateActual: winRate,
      sharpeRatioActual: sharpeRatio,
      totalTrades: trades,
      timestamp: Date.now()
    };

    const proof = await aiEngine.generateZKProof(JSON.stringify(data));

    return {
      returns: this.obfuscateValue(returns),
      winRate: this.obfuscateValue(winRate),
      sharpeRatio: this.obfuscateValue(sharpeRatio),
      proof
    };
  }

  static async verifyPerformanceProof(proof: string): Promise<boolean> {
    return await aiEngine.verifyZKProof(proof);
  }

  static async generateBalanceProof(
    userId: string,
    totalBalance: number,
    holdings: any[]
  ): Promise<BalanceProof> {
    const whaleTier = this.calculateWhaleTier(totalBalance);
    const balanceRange = this.getBalanceRange(totalBalance);

    const data = {
      userId,
      balanceActual: totalBalance,
      holdingsCount: holdings.length,
      timestamp: Date.now()
    };

    const proof = await aiEngine.generateZKProof(JSON.stringify(data));

    return {
      balanceRange,
      whaleTier,
      proof
    };
  }

  static async generateReputationProof(
    userId: string,
    proofType: 'win_rate' | 'profitability' | 'volume' | 'consistency',
    actualValue: number,
    threshold: number
  ): Promise<ReputationProof> {
    const data = {
      userId,
      proofType,
      actualValue,
      threshold,
      meetsThreshold: actualValue >= threshold,
      timestamp: Date.now()
    };

    const proof = await aiEngine.generateZKProof(JSON.stringify(data));

    let claim = '';
    switch (proofType) {
      case 'win_rate':
        claim = `Win rate > ${threshold}%`;
        break;
      case 'profitability':
        claim = `Profit > $${threshold.toLocaleString()}`;
        break;
      case 'volume':
        claim = `Volume > $${threshold.toLocaleString()}`;
        break;
      case 'consistency':
        claim = `Consistency score > ${threshold}`;
        break;
    }

    return {
      claim,
      threshold,
      proof
    };
  }

  static async generateTimeLockProof(
    predictionData: any,
    unlockTime: Date
  ): Promise<{
    encryptedPrediction: string;
    predictionHash: string;
    timeLockProof: string;
  }> {
    const predictionString = JSON.stringify(predictionData);

    const predictionHash = await this.hashData(predictionString);

    const encryptedPrediction = this.encryptData(predictionString, Date.now().toString());

    const timeLockData = {
      predictionHash,
      unlockTime: unlockTime.getTime(),
      createdAt: Date.now(),
      commitment: 'pre-committed'
    };

    const timeLockProof = await aiEngine.generateZKProof(JSON.stringify(timeLockData));

    return {
      encryptedPrediction,
      predictionHash,
      timeLockProof
    };
  }

  static async verifyTimeLockProof(
    originalHash: string,
    revealedPrediction: any,
    timeLockProof: string
  ): Promise<boolean> {
    const revealedHash = await this.hashData(JSON.stringify(revealedPrediction));

    if (originalHash !== revealedHash) {
      return false;
    }

    return await aiEngine.verifyZKProof(timeLockProof);
  }

  static async generateStrategyEncryption(
    strategyCode: string,
    ownerId: string
  ): Promise<{
    encryptedCode: string;
    encryptionKeyHash: string;
    accessProof: string;
  }> {
    const encryptionKey = this.generateEncryptionKey();

    const encryptedCode = this.encryptData(strategyCode, encryptionKey);

    const keyHash = await this.hashData(encryptionKey);

    const accessData = {
      ownerId,
      keyHash,
      timestamp: Date.now()
    };

    const accessProof = await aiEngine.generateZKProof(JSON.stringify(accessData));

    return {
      encryptedCode,
      encryptionKeyHash: keyHash,
      accessProof
    };
  }

  static async generatePortfolioEncryption(
    holdings: any[],
    userId: string
  ): Promise<{
    encryptedHoldings: string;
    totalValueProof: string;
    riskScoreProof: string;
  }> {
    const encryptionKey = this.generateEncryptionKey();
    const encryptedHoldings = this.encryptData(JSON.stringify(holdings), encryptionKey);

    const totalValue = holdings.reduce((sum, h) => sum + (h.value || 0), 0);
    const totalValueData = {
      userId,
      totalValue,
      holdingsCount: holdings.length,
      timestamp: Date.now()
    };
    const totalValueProof = await aiEngine.generateZKProof(JSON.stringify(totalValueData));

    const riskScore = this.calculateRiskScore(holdings);
    const riskScoreData = {
      userId,
      riskScore,
      timestamp: Date.now()
    };
    const riskScoreProof = await aiEngine.generateZKProof(JSON.stringify(riskScoreData));

    return {
      encryptedHoldings,
      totalValueProof,
      riskScoreProof
    };
  }

  static async generateAccuracyProof(
    creatorId: string,
    correctPredictions: number,
    totalPredictions: number,
    accuracyRate: number
  ): Promise<string> {
    const data = {
      creatorId,
      correctPredictions,
      totalPredictions,
      accuracyRate,
      verified: accuracyRate === (correctPredictions / totalPredictions) * 100,
      timestamp: Date.now()
    };

    return await aiEngine.generateZKProof(JSON.stringify(data));
  }

  private static obfuscateValue(value: number): string {
    if (value < 0) return 'Negative';
    if (value < 10) return '< 10%';
    if (value < 25) return '10-25%';
    if (value < 50) return '25-50%';
    if (value < 75) return '50-75%';
    if (value < 100) return '75-100%';
    return '> 100%';
  }

  private static calculateWhaleTier(balance: number): string {
    if (balance >= 10000000) return 'mega_whale';
    if (balance >= 1000000) return 'whale';
    if (balance >= 100000) return 'dolphin';
    if (balance >= 10000) return 'fish';
    return 'shrimp';
  }

  private static getBalanceRange(balance: number): string {
    if (balance >= 10000000) return '$10M+';
    if (balance >= 5000000) return '$5M-$10M';
    if (balance >= 1000000) return '$1M-$5M';
    if (balance >= 500000) return '$500K-$1M';
    if (balance >= 100000) return '$100K-$500K';
    if (balance >= 50000) return '$50K-$100K';
    if (balance >= 10000) return '$10K-$50K';
    if (balance >= 1000) return '$1K-$10K';
    return '< $1K';
  }

  private static async hashData(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private static generateEncryptionKey(): string {
    return Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  private static encryptData(data: string, key: string): string {
    const encrypted = btoa(data + '::' + key.slice(0, 8));
    return encrypted;
  }

  static decryptData(encryptedData: string, key: string): string {
    try {
      const decrypted = atob(encryptedData);
      const [data] = decrypted.split('::');
      return data;
    } catch (error) {
      throw new Error('Decryption failed');
    }
  }

  private static calculateRiskScore(holdings: any[]): number {
    if (holdings.length === 0) return 0;

    const totalValue = holdings.reduce((sum, h) => sum + (h.value || 0), 0);
    const topHoldingPercent = Math.max(...holdings.map(h => (h.value || 0) / totalValue * 100));

    let riskScore = 50;

    if (holdings.length < 3) riskScore += 20;
    else if (holdings.length < 5) riskScore += 10;
    else if (holdings.length > 10) riskScore -= 10;

    if (topHoldingPercent > 50) riskScore += 20;
    else if (topHoldingPercent > 30) riskScore += 10;
    else if (topHoldingPercent < 20) riskScore -= 10;

    return Math.max(0, Math.min(100, riskScore));
  }

  static async batchVerifyProofs(proofs: string[]): Promise<boolean[]> {
    const verifications = await Promise.all(
      proofs.map(proof => aiEngine.verifyZKProof(proof))
    );
    return verifications;
  }

  static generateMockPerformanceData(strategyType: string): {
    returns: number;
    winRate: number;
    sharpeRatio: number;
    trades: number;
  } {
    const baseReturns = {
      trend_following: 45,
      mean_reversion: 35,
      arbitrage: 25,
      momentum: 55,
      breakout: 50,
      scalping: 30,
      swing: 40,
      position: 35
    };

    const baseReturn = baseReturns[strategyType as keyof typeof baseReturns] || 40;

    return {
      returns: baseReturn + (Math.random() * 30 - 15),
      winRate: 55 + Math.random() * 30,
      sharpeRatio: 1 + Math.random() * 2,
      trades: Math.floor(100 + Math.random() * 400)
    };
  }

  static calculateStrategyRisk(strategyType: string): 'low' | 'medium' | 'high' | 'extreme' {
    const riskLevels = {
      trend_following: 'medium',
      mean_reversion: 'medium',
      arbitrage: 'low',
      momentum: 'high',
      breakout: 'high',
      scalping: 'extreme',
      swing: 'medium',
      position: 'low'
    };

    return (riskLevels[strategyType as keyof typeof riskLevels] || 'medium') as any;
  }
}
