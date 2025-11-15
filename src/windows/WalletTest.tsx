import React, { useState } from 'react';
import { Wallet } from 'lucide-react';

export const WalletTest: React.FC = () => {
  const [status, setStatus] = useState<string>('Ready to test');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev]);
    console.log(message);
  };

  const testWalletDetection = () => {
    addLog('Testing wallet detection...');
    setStatus('Checking for wallets...');

    if (typeof window === 'undefined') {
      addLog('ERROR: Window object not available');
      setStatus('Error: No window object');
      return;
    }

    const solana = (window as any).solana;
    const solflare = (window as any).solflare;

    addLog(`window.solana exists: ${!!solana}`);
    addLog(`window.solflare exists: ${!!solflare}`);

    if (solana) {
      addLog(`Phantom detected: ${solana.isPhantom}`);
      addLog(`Phantom connected: ${solana.isConnected}`);
      addLog(`Phantom publicKey: ${solana.publicKey?.toString() || 'null'}`);
      setStatus('Phantom detected!');
    } else if (solflare) {
      addLog(`Solflare detected: true`);
      addLog(`Solflare connected: ${solflare.isConnected}`);
      setStatus('Solflare detected!');
    } else {
      addLog('ERROR: No wallet extension found');
      setStatus('No wallet found - Please install Phantom or Solflare');
    }
  };

  const testWalletConnection = async () => {
    addLog('Testing wallet connection...');
    setStatus('Attempting to connect...');

    try {
      const solana = (window as any).solana;

      if (!solana) {
        throw new Error('No wallet found');
      }

      addLog('Requesting wallet connection...');
      const response = await solana.connect();

      addLog(`Connected! PublicKey: ${response.publicKey.toString()}`);
      setStatus(`Connected: ${response.publicKey.toString().substring(0, 10)}...`);
    } catch (error: any) {
      addLog(`ERROR: ${error.message}`);
      setStatus(`Failed: ${error.message}`);
    }
  };

  return (
    <div className="p-4 bg-white">
      <div className="flex items-center gap-2 mb-4">
        <Wallet size={24} color="var(--solana-purple)" />
        <h2 className="text-lg font-bold">Wallet Connection Test</h2>
      </div>

      <div className="win98-inset p-3 mb-4 bg-blue-50">
        <strong>Status:</strong> {status}
      </div>

      <div className="flex gap-2 mb-4">
        <button className="win98-button" onClick={testWalletDetection}>
          Test Detection
        </button>
        <button className="win98-button" onClick={testWalletConnection}>
          Test Connection
        </button>
        <button className="win98-button" onClick={() => setLogs([])}>
          Clear Logs
        </button>
      </div>

      <div className="win98-inset p-4">
        <h3 className="font-bold mb-2">Debug Logs</h3>
        <div className="bg-black text-green-400 p-2 font-mono text-xs max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-500">No logs yet. Click a button to start testing.</div>
          ) : (
            logs.map((log, i) => <div key={i}>{log}</div>)
          )}
        </div>
      </div>
    </div>
  );
};
