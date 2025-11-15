import React, { useState, useEffect } from 'react';
import { Search, AlertCircle, Shield, RefreshCw } from 'lucide-react';
import { aiEngine } from '../lib/ai';
import { supabase } from '../lib/supabase';
import { getMockUserId } from '../lib/mockAuth';
import { soundManager } from '../lib/sounds';

export const SecurityScanner: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [threats, setThreats] = useState<any[]>([]);
  const [autoScan, setAutoScan] = useState(false);

  useEffect(() => {
    if (autoScan) {
      const interval = setInterval(() => {
        performScan();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [autoScan]);

  const performScan = async () => {
    setScanning(true);
    soundManager.playClick();

    try {
      const result = await aiEngine.detectAnomalies([]);
      const newThreats = result.threats.map(t => ({
        ...t,
        timestamp: new Date().toLocaleTimeString(),
        id: Math.random().toString(36)
      }));

      setThreats(prev => [...newThreats, ...prev].slice(0, 10));

      if (newThreats.length > 0) {
        soundManager.playNotification();

        for (const threat of newThreats) {
          await supabase.from('threat_alerts').insert([{
            user_id: getMockUserId(),
            threat_type: threat.type,
            severity: threat.severity,
            description: `Detected with ${threat.confidence.toFixed(1)}% confidence`
          }]);
        }
      }
    } catch (error) {
      console.error('Scan error:', error);
      soundManager.playError();
    } finally {
      setScanning(false);
    }
  };

  const handleScan = () => {
    performScan();
  };

  const clearThreats = () => {
    soundManager.playClick();
    setThreats([]);
  };

  return (
    <div className="p-4 bg-white">
      <div className="flex items-center gap-2 mb-4">
        <Search size={24} color="var(--solana-purple)" />
        <h2 className="text-lg font-bold">Security Scanner</h2>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          className="win98-button"
          onClick={handleScan}
          disabled={scanning}
        >
          {scanning ? 'Scanning Network...' : 'Start Scan'}
        </button>
        <button
          className={`win98-button ${autoScan ? 'bg-green-200' : ''}`}
          onClick={() => {
            setAutoScan(!autoScan);
            soundManager.playClick();
          }}
        >
          <RefreshCw size={14} className="inline mr-1" />
          {autoScan ? 'Auto-Scan ON' : 'Auto-Scan OFF'}
        </button>
        {threats.length > 0 && (
          <button className="win98-button" onClick={clearThreats}>
            Clear
          </button>
        )}
      </div>

      {scanning && (
        <div className="progress-bar mb-4">
          <div className="progress-bar-fill animate-pulse" style={{ width: '100%' }} />
        </div>
      )}

      {threats.length > 0 ? (
        <div className="win98-inset p-4 mb-4">
          <h3 className="font-bold mb-2 flex items-center gap-2">
            <AlertCircle size={16} color="red" />
            Detected Threats ({threats.length})
          </h3>
          <div className="max-h-48 overflow-y-auto scrollbar">
            {threats.map((threat) => (
              <div
                key={threat.id}
                className={`p-2 mb-2 border ${
                  threat.severity === 'high'
                    ? 'bg-red-50 border-red-300'
                    : threat.severity === 'medium'
                    ? 'bg-orange-50 border-orange-300'
                    : 'bg-yellow-50 border-yellow-300'
                }`}
              >
                <div className="flex justify-between">
                  <div className="font-bold text-sm">{threat.type}</div>
                  <div className="text-xs font-bold uppercase">{threat.severity}</div>
                </div>
                <div className="text-xs text-gray-600">
                  Confidence: {threat.confidence.toFixed(1)}% | {threat.timestamp}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="win98-inset p-4 mb-4 text-center text-gray-600">
          <Shield size={32} className="mx-auto mb-2" color="green" />
          <p>No threats detected</p>
        </div>
      )}

      <div className="win98-inset p-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield size={16} />
          <h3 className="font-bold">Detection Methods</h3>
        </div>
        <div className="space-y-1 text-sm">
          <div>• ZK-ML Anomaly Detection</div>
          <div>• Multi-Agent Analysis</div>
          <div>• Pattern Recognition</div>
          <div>• Encrypted Data Scanning</div>
          <div>• Quorum Voting System</div>
          <div>• Real-Time Monitoring</div>
        </div>
      </div>
    </div>
  );
};
