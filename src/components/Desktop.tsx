import React, { useState } from 'react';
import { DesktopIcon as DesktopIconType } from '../types';
import { useAppContext } from '../context/AppContext';
import { soundManager } from '../lib/sounds';
import {
  Cpu, Settings, Wallet, Image, Globe,
  Shield, Bot, Beaker, GitBranch, Search
} from 'lucide-react';

const DESKTOP_ICONS: DesktopIconType[] = [
  { id: 'daft-generator', label: 'Daft Generator', icon: 'Cpu', component: 'DaftGenerator' },
  { id: 'control-panel', label: 'Control Panel', icon: 'Settings', component: 'ControlPanel' },
  { id: 'my-wallet', label: 'My Wallet', icon: 'Wallet', component: 'MyWallet' },
  { id: 'gallery', label: 'Gallery', icon: 'Image', component: 'Gallery' },
  { id: 'network', label: 'Network Neighborhood', icon: 'Globe', component: 'NetworkNeighborhood' },
  { id: 'privacy', label: 'Privacy Shield', icon: 'Shield', component: 'PrivacyShield' },
  { id: 'agent-hub', label: 'Agent Hub', icon: 'Bot', component: 'AgentHub' },
  { id: 'daft-lab', label: 'Daft Lab', icon: 'Beaker', component: 'DaftLab' },
  { id: 'bridge-portal', label: 'Bridge Portal', icon: 'GitBranch', component: 'BridgePortal' },
  { id: 'security-scanner', label: 'Security Scanner', icon: 'Search', component: 'SecurityScanner' },
];

const iconComponents = {
  Cpu, Settings, Wallet, Image, Globe, Shield, Bot, Beaker, GitBranch, Search
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
      <div className="absolute top-4 left-4 flex flex-col gap-4" style={{ width: '80px' }}>
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
