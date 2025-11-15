import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface User {
  id: string;
  wallet_address: string;
  username?: string;
  created_at: string;
  updated_at: string;
}

export interface Memecoin {
  id: string;
  user_id: string;
  name: string;
  symbol: string;
  supply: string;
  description?: string;
  contract_address?: string;
  deployed: boolean;
  created_at: string;
}

export interface NFT {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  image_url?: string;
  price_sol?: string;
  mint_address?: string;
  listed: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  from_chain: string;
  to_chain: string;
  amount: string;
  token: string;
  status: string;
  tx_hash?: string;
  created_at: string;
}

export interface AIAgent {
  id: string;
  user_id: string;
  name: string;
  type: string;
  status: string;
  performance: string;
  config: any;
  created_at: string;
  last_active?: string;
}

export interface SecurityScan {
  id: string;
  user_id: string;
  contract_address: string;
  vulnerabilities: any[];
  risk_score: number;
  status: string;
  created_at: string;
}

export interface ZKProof {
  id: string;
  user_id: string;
  proof_type: string;
  proof_data: string;
  verified: boolean;
  created_at: string;
}

export interface TrainingSession {
  id: string;
  user_id: string;
  dataset: string;
  learning_rate: number;
  accuracy?: string;
  iterations: number;
  status: string;
  results: any;
  created_at: string;
}

export interface ThreatAlert {
  id: string;
  user_id: string;
  threat_type: string;
  severity: string;
  description?: string;
  detected_at: string;
}
