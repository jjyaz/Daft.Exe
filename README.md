Daft.Exe

A Windows 98-themed DeFi application on Solana with AI-powered features.

## Running the Application

### Development Mode

To run both the backend API server and frontend development server:

```bash
npm install
npm run dev:full
```

This will start:
- Backend API server on `http://localhost:3001`
- Frontend dev server on `http://localhost:5173`

### Running Servers Separately

Backend server only:
```bash
npm run server
```

Frontend only:
```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

## Features

### Real Blockchain Features

These features interact with the REAL Solana mainnet:

#### 1. Wallet Connection
- **Status**: Fully Functional
- Connects to Phantom or Solflare wallets
- Displays real SOL balance from mainnet
- Uses backend proxy to avoid CORS issues
- Fallback to direct RPC if backend unavailable

#### 2. SPL Token Creation
- **Status**: Fully Functional
- Creates REAL SPL tokens on Solana mainnet
- **Requirements**:
  - Connected wallet with SOL
  - ~0.002 SOL for rent-exempt account
  - Additional SOL for transaction fees
- Token mint address is returned and stored

#### 3. SOL Transfers
- **Status**: Fully Functional
- Send real SOL to any Solana address
- Requires wallet signature
- Real on-chain transactions

### Limited/Simulated Features

These features require additional infrastructure or use simplified implementations:

#### 4. Staking Pools
- **Status**: Database-Only Simulation
- Tracks stakes and calculates rewards in Supabase
- **Not implemented**: On-chain staking program
- **To make real**: Deploy Solana staking program with PDAs

#### 5. Cross-Chain Bridge
- **Status**: UI Simulation
- Records bridge operations in database
- **Not implemented**: Actual cross-chain swaps
- **To make real**: Integrate Wormhole, Allbridge, or Portal Bridge SDK

#### 6. AI Memecoin Generator
- **Status**: Uses local TensorFlow.js
- Generates token concepts client-side
- **Limitation**: Basic local AI model
- **To make real**: Integrate OpenAI API or similar cloud AI service

## Architecture

### Backend (Node.js + Express)
- Proxies Solana RPC calls using Ankr endpoint
- Endpoints:
  - `GET /api/health` - Health check
  - `GET /api/getBalance?address=<publicKey>` - Get SOL balance
  - `GET /api/getTokenAccounts?owner=<publicKey>` - Get SPL token accounts
  - `GET /api/getAccountInfo?address=<publicKey>` - Get account info

### Frontend (React + TypeScript + Vite)
- Connects to Phantom/Solflare wallets
- Calls backend API for RPC operations
- Uses Supabase for data persistence
- Windows 98 aesthetic with modern features

### Database (Supabase)
- Stores user stakes, transactions, and bridge operations
- Row Level Security (RLS) enabled
- Real-time updates

## Wallet Setup

1. Install [Phantom](https://phantom.app) or Solflare browser extension
2. Create or import a wallet
3. **For testing**: Use devnet or add small amount of SOL
4. **For production**: Ensure sufficient SOL for transactions

## Important Notes

- **Mainnet Transactions**: This app uses Solana MAINNET by default
- **Real Money**: All SOL transactions use real funds
- **Transaction Fees**: Every operation requires SOL for gas
- **Token Creation**: Costs ~0.002 SOL per token mint
- **Testing**: Consider using Solana devnet for development

## Security

- Never share your wallet seed phrase
- Review all transactions before signing
- Start with small amounts for testing
- All database access protected by RLS policies

## Development Tips

- Open browser DevTools (F12) for detailed console logs
- Backend logs show in the terminal running `npm run server`
- Use `npm run dev:full` to see both frontend and backend logs
- Check Solana Explorer for transaction details
