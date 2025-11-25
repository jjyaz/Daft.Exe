import React, { useState } from 'react';
import { FileText, Copy, Check, ExternalLink } from 'lucide-react';

const CONTRACT_ADDRESS = 'F4ZL8sHPXAoUaAQ6DVY4Si6uhHu9T5dvciNozdPZdoge';

export default function ContractAddress() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(CONTRACT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleViewOnExplorer = () => {
    window.open(`https://solscan.io/token/${CONTRACT_ADDRESS}`, '_blank');
  };

  return (
    <div className="h-full flex flex-col bg-gray-100">
      <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-4">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6" />
          <h2 className="text-xl font-bold">Contract Address</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Token Contract Address
            </label>
            <div className="relative">
              <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4 font-mono text-sm break-all">
                {CONTRACT_ADDRESS}
              </div>
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-semibold transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-bold mb-3">Contract Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-600">Network:</span>
                <span className="font-semibold">Solana Mainnet</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-600">Token Standard:</span>
                <span className="font-semibold">SPL Token</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-600">Decimals:</span>
                <span className="font-semibold">9</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleViewOnExplorer}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 flex items-center justify-center gap-2 font-semibold transition-all"
          >
            <ExternalLink className="w-5 h-5" />
            View on Solscan Explorer
          </button>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> Always verify the contract address before making any transactions.
              This is the official DAFT.EXE token contract on Solana.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
