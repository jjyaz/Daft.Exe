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

### Real Blockchain Features ✅

These features interact with the REAL Solana mainnet:

#### 1. Token Swap (Jupiter Integration)
- **Status**: Fully Functional
- Real token swaps powered by Jupiter Aggregator
- Best price routing across all Solana DEXs
- Customizable slippage tolerance
- Swap history tracking
- **Requirements**: Connected wallet with SOL for gas fees

#### 2. Portfolio Tracker
- **Status**: Fully Functional
- View total portfolio value in USD
- Display all SPL token holdings
- Real-time price data from Jupiter API
- Shows SOL and token balances
- Auto-refresh capability

#### 3. Multi-Wallet Manager
- **Status**: Fully Functional
- Watch multiple Solana wallets simultaneously
- Set nicknames and mark primary wallet
- View aggregated portfolio across all wallets
- Stored securely in Supabase with RLS

#### 4. Price Alerts
- **Status**: Fully Functional
- Set price alerts for any token
- "Above" or "Below" price conditions
- Auto-checks prices every minute
- Notifications when alerts trigger
- Manage and delete alerts

#### 5. Token Reviews & Ratings
- **Status**: Fully Functional
- Community ratings (1-5 stars) for tokens
- Written reviews and comments
- View average ratings per token
- Helps identify quality tokens and avoid scams

#### 6. Leaderboard System
- **Status**: Fully Functional
- Top token creators by deployments
- Top reviewers by review count
- Top stakers by total amount
- Real-time rankings from database

#### 7. Whale Watcher
- **Status**: Fully Functional
- Track large wallet movements on-chain
- Set minimum transaction thresholds
- View recent whale transactions
- Real-time blockchain monitoring
- Add nicknames to tracked whales

#### 8. Wallet Connection
- **Status**: Fully Functional
- Connects to Phantom or Solflare wallets
- Displays real SOL balance from mainnet
- Uses backend proxy to avoid CORS issues
- Comprehensive debugging and status indicators

#### 9. SPL Token Creation
- **Status**: Fully Functional
- Creates REAL SPL tokens on Solana mainnet
- Uses official @solana/spl-token library
- **Requirements**: ~0.002 SOL for rent + transaction fees
- Returns actual mint address on blockchain

### Limited/Simulated Features ⚠️

These features require additional infrastructure:

#### 10. Staking Pools
- **Status**: Database-Only Simulation
- Tracks stakes and calculates rewards in Supabase
- **Not implemented**: On-chain staking program
- **To make real**: Deploy Solana staking program with PDAs

#### 11. Cross-Chain Bridge
- **Status**: UI Simulation
- Records bridge operations in database
- **Not implemented**: Actual cross-chain swaps
- **To make real**: Integrate Wormhole, Allbridge, or Portal Bridge SDK

#### 12. AI Memecoin Generator
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
- Jupiter API integration for swaps and prices
- Uses Supabase for data persistence
- Windows 98 aesthetic with modern DeFi features

### Database (Supabase)
- Stores user data: stakes, swaps, alerts, reviews, watched wallets, whale watches
- Row Level Security (RLS) enabled on all tables
- Real-time updates and leaderboards
- Comprehensive indexing for performance

## API Integrations

- **Jupiter Aggregator**: Token swaps and price data
- **Solana RPC**: Blockchain interactions via Ankr
- **Supabase**: Database and authentication
- **@solana/web3.js**: Blockchain operations
- **@solana/spl-token**: Token creation and management

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
- **Jupiter Swaps**: Real token swaps with actual price impact
- **Testing**: Consider using Solana devnet for development

## Security

- Never share your wallet seed phrase
- Review all transactions before signing
- Start with small amounts for testing
- All database access protected by RLS policies
- Token reviews help identify potentially dangerous tokens

## Development Tips

- Open browser DevTools (F12) for detailed console logs
- Backend logs show in the terminal running `npm run server`
- Use `npm run dev:full` to see both frontend and backend logs
- Check Solana Explorer for transaction details
- Price alerts check every 60 seconds
- Portfolio auto-refreshes when wallet changes

## Desktop Icons

The application includes these features accessible from the desktop:

1. **Token Swap** - Jupiter-powered token swaps
2. **Portfolio** - Track your holdings and value
3. **My Wallet** - DeFi staking interface (simulated)
4. **Daft Generator** - AI memecoin creator
5. **Price Alerts** - Set and manage price alerts
6. **Wallet Manager** - Multi-wallet management
7. **Token Reviews** - Community token ratings
8. **Leaderboard** - Top users rankings
9. **Whale Watcher** - Track large wallet movements
10. **Bridge Portal** - Cross-chain UI (simulated)
11. **Gallery** - View created tokens
12. **Agent Hub** - AI agent management
13. **Daft Lab** - Experimental features
14. **Security Scanner** - Token security checks
15. **Control Panel** - App settings
16. **Network** - Network information
17. **Privacy Shield** - Privacy features

## Contributing

This is a demonstration project showcasing real Solana blockchain integration combined with modern UX. Feel free to fork and extend with additional features.

## License

MIT
