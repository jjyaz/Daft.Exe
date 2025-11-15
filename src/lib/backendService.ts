const API_BASE_URL = 'http://localhost:3001/api';

export class BackendService {
  private static async fetchWithRetry(url: string, maxRetries = 3): Promise<any> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log(`Fetching from backend API (attempt ${i + 1}/${maxRetries}):`, url);
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Backend API response received:', data);
        return data;
      } catch (error: any) {
        console.error(`Backend API attempt ${i + 1} failed:`, error);

        if (i === maxRetries - 1) {
          throw new Error(`Backend API unavailable after ${maxRetries} attempts: ${error.message}`);
        }

        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  static async getBalance(address: string): Promise<number> {
    try {
      const data = await this.fetchWithRetry(`${API_BASE_URL}/getBalance?address=${address}`);
      return data.balance;
    } catch (error: any) {
      console.error('Error fetching balance from backend:', error);
      throw new Error('Failed to fetch balance: ' + error.message);
    }
  }

  static async getTokenAccounts(owner: string): Promise<any[]> {
    try {
      const data = await this.fetchWithRetry(`${API_BASE_URL}/getTokenAccounts?owner=${owner}`);
      return data.accounts || [];
    } catch (error: any) {
      console.error('Error fetching token accounts from backend:', error);
      throw new Error('Failed to fetch token accounts: ' + error.message);
    }
  }

  static async getAccountInfo(address: string): Promise<any> {
    try {
      const data = await this.fetchWithRetry(`${API_BASE_URL}/getAccountInfo?address=${address}`);
      return data;
    } catch (error: any) {
      console.error('Error fetching account info from backend:', error);
      throw new Error('Failed to fetch account info: ' + error.message);
    }
  }

  static async healthCheck(): Promise<boolean> {
    try {
      const data = await this.fetchWithRetry(`${API_BASE_URL}/health`, 1);
      return data.status === 'ok';
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  }
}
