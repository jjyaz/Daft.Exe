import React, { useState } from 'react';
import { DesktopIcon as DesktopIconType } from '../types';
import { useAppContext } from '../context/AppContext';
import { soundManager } from '../lib/sounds';
import {
  Cpu, Settings, Wallet, Image, Globe,
  Shield, Bot, Beaker, GitBranch, Search,
  ArrowDownUp, PieChart, Bell, Eye, MessageSquare, Trophy, Activity, FileText, Brain, Dna, Microscope, ShoppingCart, Radio, Lock
} from 'lucide-react';

const DESKTOP_ICONS: DesktopIconType[] = [
  { id: 'contract-address', label: 'Contract Address', icon: 'FileText', component: 'ContractAddress' },
  { id: 'wallet-test', label: 'Wallet Test', icon: 'Search', component: 'WalletTest' },
  { id: 'prediction-markets', label: 'Prediction Markets', icon: 'Brain', component: 'PredictionMarkets' },
  { id: 'swarm-breeding', label: 'Swarm Breeding', icon: 'Dna', component: 'SwarmBreeding' },
  { id: 'genetics-lab', label: 'Genetics Lab', icon: 'Microscope', component: 'GeneticsLab' },
  { id: 'token-swap', label: 'Token Swap', icon: 'ArrowDownUp', component: 'TokenSwap' },
  { id: 'portfolio', label: 'Portfolio', icon: 'PieChart', component: 'Portfolio' },
  { id: 'my-wallet', label: 'My Wallet', icon: 'Wallet', component: 'MyWallet' },
  { id: 'daft-generator', label: 'Daft Generator', icon: 'Cpu', component: 'DaftGenerator' },
  { id: 'price-alerts', label: 'Price Alerts', icon: 'Bell', component: 'PriceAlerts' },
  { id: 'wallet-manager', label: 'Wallet Manager', icon: 'Eye', component: 'WalletManager' },
  { id: 'token-reviews', label: 'Token Reviews', icon: 'MessageSquare', component: 'TokenReviews' },
  { id: 'leaderboard', label: 'Leaderboard', icon: 'Trophy', component: 'Leaderboard' },
  { id: 'whale-watcher', label: 'Whale Watcher', icon: 'Activity', component: 'WhaleWatcher' },
  { id: 'bridge-portal', label: 'Bridge Portal', icon: 'GitBranch', component: 'BridgePortal' },
  { id: 'gallery', label: 'Gallery', icon: 'Image', component: 'Gallery' },
  { id: 'agent-hub', label: 'Agent Hub', icon: 'Bot', component: 'AgentHub' },
  { id: 'daft-lab', label: 'Daft Lab', icon: 'Beaker', component: 'DaftLab' },
  { id: 'security-scanner', label: 'Security Scanner', icon: 'Search', component: 'SecurityScanner' },
  { id: 'control-panel', label: 'Control Panel', icon: 'Settings', component: 'ControlPanel' },
  { id: 'network', label: 'Network', icon: 'Globe', component: 'NetworkNeighborhood' },
  { id: 'privacy', label: 'Privacy Shield', icon: 'Shield', component: 'PrivacyShield' },
  { id: 'strategy-marketplace', label: 'Strategy Marketplace', icon: 'ShoppingCart', component: 'StrategyMarketplace' },
  { id: 'private-portfolio', label: 'Private Portfolio', icon: 'Lock', component: 'PrivatePortfolio' },
  { id: 'signal-marketplace', label: 'Signal Marketplace', icon: 'Radio', component: 'SignalMarketplace' },
];

const iconComponents = {
  Cpu, Settings, Wallet, Image, Globe, Shield, Bot, Beaker, GitBranch, Search,
  ArrowDownUp, PieChart, Bell, Eye, MessageSquare, Trophy, Activity, FileText, Brain, Dna, Microscope, ShoppingCart, Radio, Lock
};

export const Desktop: React.FC = () => {
  const { openWindow } = useAppContext();
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);

  const handleIconClick = (icon: DesktopIconType) => {
    setSelectedIcon(icon.id);
    soundManager.playOpen();
    openWindow(icon);
  };

  return (
    <div className="desktop-bg">
      <div className="absolute top-4 left-4 bottom-16 grid gap-3 overflow-y-auto pb-8" style={{ gridTemplateColumns: 'repeat(3, 80px)', gridAutoRows: 'min-content' }}>
        {DESKTOP_ICONS.map((icon) => {
          const IconComponent = iconComponents[icon.icon as keyof typeof iconComponents];
          return (
            <div
              key={icon.id}
              className={`desktop-icon ${selectedIcon === icon.id ? 'selected' : ''}`}
              onClick={() => handleIconClick(icon)}
            >
              <div className="desktop-icon-image flex items-center justify-center">
                <IconComponent size={32} color="white" />
              </div>
              <div className="desktop-icon-label">{icon.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
