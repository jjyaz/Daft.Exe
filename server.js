const express = require('express');
const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const connection = new Connection('https://api.mainnet-beta.solana.com', {
  commitment: 'confirmed',
  confirmTransactionInitialTimeout: 60000
});

console.log('Solana RPC Proxy Server initialized with endpoint: https://api.mainnet-beta.solana.com');

app.get('/api/getBalance', async (req, res) => {
  const { address } = req.query;

  if (!address) {
    return res.status(400).json({ error: 'Address parameter is required' });
  }

  try {
    console.log('Fetching balance for address:', address);
    const publicKey = new PublicKey(address);
    const balance = await connection.getBalance(publicKey);
    const balanceInSOL = balance / LAMPORTS_PER_SOL;

    console.log('Balance fetched successfully:', balanceInSOL, 'SOL');
    res.json({ balance: balanceInSOL, lamports: balance });
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ error: 'Failed to fetch balance: ' + error.message });
  }
});

app.get('/api/getTokenAccounts', async (req, res) => {
  const { owner } = req.query;

  if (!owner) {
    return res.status(400).json({ error: 'Owner parameter is required' });
  }

  try {
    console.log('Fetching token accounts for owner:', owner);
    const publicKey = new PublicKey(owner);
    const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
      programId: TOKEN_PROGRAM_ID
    });

    console.log('Token accounts fetched successfully:', tokenAccounts.value.length, 'accounts');
    res.json({
      accounts: tokenAccounts.value.map(account => ({
        pubkey: account.pubkey.toString(),
        mint: account.account.data.parsed.info.mint,
        tokenAmount: account.account.data.parsed.info.tokenAmount
      }))
    });
  } catch (error) {
    console.error('Error fetching token accounts:', error);
    res.status(500).json({ error: 'Failed to fetch token accounts: ' + error.message });
  }
});

app.get('/api/getAccountInfo', async (req, res) => {
  const { address } = req.query;

  if (!address) {
    return res.status(400).json({ error: 'Address parameter is required' });
  }

  try {
    console.log('Fetching account info for address:', address);
    const publicKey = new PublicKey(address);
    const accountInfo = await connection.getAccountInfo(publicKey);

    if (!accountInfo) {
      return res.json({ exists: false });
    }

    console.log('Account info fetched successfully');
    res.json({
      exists: true,
      lamports: accountInfo.lamports,
      owner: accountInfo.owner.toString(),
      executable: accountInfo.executable,
      rentEpoch: accountInfo.rentEpoch
    });
  } catch (error) {
    console.error('Error fetching account info:', error);
    res.status(500).json({ error: 'Failed to fetch account info: ' + error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', endpoint: 'https://api.mainnet-beta.solana.com' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Solana RPC Proxy Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
