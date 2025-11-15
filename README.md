Daft.Exe

## Running the Application

### Development Mode

To run both the backend API server and frontend development server:

```bash
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

### Backend API Endpoints

The backend proxy server handles Solana RPC calls to avoid CORS issues:

- `GET /api/health` - Health check
- `GET /api/getBalance?address=<publicKey>` - Get SOL balance
- `GET /api/getTokenAccounts?owner=<publicKey>` - Get SPL token accounts
- `GET /api/getAccountInfo?address=<publicKey>` - Get account information

### Architecture

The application uses a hybrid architecture:
1. **Backend (Node.js + Express)**: Proxies Solana RPC calls using Ankr endpoint
2. **Frontend (React + TypeScript)**: Connects to Phantom/Solflare wallets and calls backend API
3. **Fallback Strategy**: If backend is unavailable, frontend falls back to direct RPC calls

### Wallet Connection

The app supports Phantom and Solflare wallets. Balance fetching is handled via the backend API to avoid CORS restrictions.
