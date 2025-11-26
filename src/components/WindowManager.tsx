import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Window } from './Window';
import { DaftGenerator } from '../windows/DaftGenerator';
import { ControlPanel } from '../windows/ControlPanel';
import { MyWallet } from '../windows/MyWallet';
import { Gallery } from '../windows/Gallery';
import { NetworkNeighborhood } from '../windows/NetworkNeighborhood';
import { PrivacyShield } from '../windows/PrivacyShield';
import { AgentHub } from '../windows/AgentHub';
import { DaftLab } from '../windows/DaftLab';
import { BridgePortal } from '../windows/BridgePortal';
import { SecurityScanner } from '../windows/SecurityScanner';
import { TokenSwap } from '../windows/TokenSwap';
import { Portfolio } from '../windows/Portfolio';
import { PriceAlerts } from '../windows/PriceAlerts';
import { WalletManager } from '../windows/WalletManager';
import { TokenReviews } from '../windows/TokenReviews';
import { Leaderboard } from '../windows/Leaderboard';
import { WhaleWatcher } from '../windows/WhaleWatcher';
import { WalletTest } from '../windows/WalletTest';
import ContractAddress from '../windows/ContractAddress';
import { SwarmDashboard } from '../windows/SwarmDashboard';
import { AgentEvolution } from '../windows/AgentEvolution';
import { SwarmBattle } from '../windows/SwarmBattle';

const windowComponents: { [key: string]: React.FC } = {
  DaftGenerator,
  ControlPanel,
  MyWallet,
  Gallery,
  NetworkNeighborhood,
  PrivacyShield,
  AgentHub,
  DaftLab,
  BridgePortal,
  SecurityScanner,
  TokenSwap,
  Portfolio,
  PriceAlerts,
  WalletManager,
  TokenReviews,
  Leaderboard,
  WhaleWatcher,
  WalletTest,
  ContractAddress,
  SwarmDashboard,
  AgentEvolution,
  SwarmBattle,
};

export const WindowManager: React.FC = () => {
  const { windows } = useAppContext();

  return (
    <>
      {windows.map((window) => {
        const Component = windowComponents[window.component];
        if (!Component) return null;

        return (
          <Window key={window.id} window={window}>
            <Component />
          </Window>
        );
      })}
    </>
  );
};
