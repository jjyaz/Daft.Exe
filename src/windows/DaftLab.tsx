import React, { useState } from 'react';
import { Beaker, Cpu, Brain, Download } from 'lucide-react';
import { aiEngine } from '../lib/ai';
import { supabase } from '../lib/supabase';
import { getMockUserId } from '../lib/mockAuth';
import { soundManager } from '../lib/sounds';

export const DaftLab: React.FC = () => {
  const [dataset, setDataset] = useState('Pixel Art Dataset');
  const [learningRate, setLearningRate] = useState(0.001);
  const [simulating, setSimulating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any>(null);

  const handleSimulate = async () => {
    setSimulating(true);
    setResults(null);
    setProgress(0);
    soundManager.playClick();

    try {
      const trainingResults = await aiEngine.trainModel(
        dataset,
        learningRate,
        (p) => setProgress(p * 100)
      );

      setResults(trainingResults);
      soundManager.playSuccess();

      await supabase.from('training_sessions').insert([{
        user_id: getMockUserId(),
        dataset: dataset,
        learning_rate: learningRate,
        accuracy: trainingResults.accuracy,
        iterations: trainingResults.iterations,
        status: 'completed',
        results: trainingResults
      }]);
    } catch (error) {
      console.error('Training error:', error);
      soundManager.playError();
    } finally {
      setSimulating(false);
    }
  };

  const handleExport = () => {
    soundManager.playClick();
    const modelData = JSON.stringify(results, null, 2);
    const blob = new Blob([modelData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `model_${dataset.replace(/\s/g, '_')}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    soundManager.playSuccess();
  };

  return (
    <div className="p-4 bg-white">
      <div className="flex items-center gap-2 mb-4">
        <Beaker size={24} color="var(--pink-accent)" />
        <h2 className="text-lg font-bold">AGI Simulation Engine</h2>
      </div>

      <div className="win98-inset p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Brain size={16} color="var(--solana-purple)" />
          <h3 className="font-bold">Training Parameters</h3>
        </div>
        <div className="space-y-2">
          <div>
            <label className="block text-sm font-bold">Dataset:</label>
            <select
              className="win98-inset w-full p-1"
              value={dataset}
              onChange={(e) => setDataset(e.target.value)}
            >
              <option>Pixel Art Dataset</option>
              <option>Blockchain Data</option>
              <option>Market Behavior</option>
              <option>User Interaction Patterns</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold">Learning Rate:</label>
            <input
              type="number"
              className="win98-inset w-full p-1"
              value={learningRate}
              onChange={(e) => setLearningRate(parseFloat(e.target.value))}
              step="0.001"
              min="0.0001"
              max="1"
            />
          </div>
        </div>
      </div>

      <button
        className="win98-button mb-4"
        onClick={handleSimulate}
        disabled={simulating}
      >
        {simulating ? 'Training Model...' : 'Start Simulation'}
      </button>

      {simulating && (
        <div className="mb-4">
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs mt-1 text-gray-600">Training: {progress.toFixed(0)}%</p>
        </div>
      )}

      {results && (
        <div className="win98-inset p-4">
          <div className="flex items-center gap-2 mb-2">
            <Cpu size={16} />
            <h3 className="font-bold">Results</h3>
          </div>
          <div className="space-y-1 text-sm mb-3">
            <div><strong>Accuracy:</strong> {results.accuracy}</div>
            <div><strong>Iterations:</strong> {results.iterations.toLocaleString()}</div>
            <div><strong>Status:</strong> <span className="text-green-600">{results.convergence}</span></div>
            <div><strong>Dataset:</strong> {dataset}</div>
            <div><strong>Learning Rate:</strong> {learningRate}</div>
          </div>
          <button className="win98-button" onClick={handleExport}>
            <Download size={14} className="inline mr-1" />
            Export Model
          </button>
        </div>
      )}
    </div>
  );
};
