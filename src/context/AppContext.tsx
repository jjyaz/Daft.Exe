import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { WindowState, DesktopIcon, AppContextType } from '../types';
import { walletManager } from '../lib/wallet';
import { initializeMockUser } from '../lib/mockAuth';
import { supabase } from '../lib/supabase';
import { soundManager } from '../lib/sounds';

interface ExtendedAppContextType extends AppContextType {
  walletConnected: boolean;
  walletAddress: string;
  walletBalance: number;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const AppContext = createContext<ExtendedAppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [nextZIndex, setNextZIndex] = useState(100);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);

  const openWindow = (icon: DesktopIcon) => {
    const existing = windows.find(w => w.id === icon.id);
    if (existing) {
      focusWindow(existing.id);
      return;
    }

    const newWindow: WindowState = {
      id: icon.id,
      title: icon.label,
      icon: icon.icon,
      component: icon.component,
      x: 100 + windows.length * 30,
      y: 100 + windows.length * 30,
      width: 600,
      height: 400,
      minimized: false,
      maximized: false,
      zIndex: nextZIndex,
    };

    setWindows([...windows, newWindow]);
    setNextZIndex(nextZIndex + 1);
  };

  const closeWindow = (id: string) => {
    setWindows(windows.filter(w => w.id !== id));
  };

  const minimizeWindow = (id: string) => {
    setWindows(windows.map(w =>
      w.id === id ? { ...w, minimized: !w.minimized } : w
    ));
  };

  const maximizeWindow = (id: string) => {
    setWindows(windows.map(w =>
      w.id === id ? {
        ...w,
        maximized: !w.maximized,
        x: w.maximized ? w.x : 0,
        y: w.maximized ? w.y : 0,
        width: w.maximized ? w.width : window.innerWidth,
        height: w.maximized ? w.height : window.innerHeight - 32
      } : w
    ));
  };

  const focusWindow = (id: string) => {
    setWindows(windows.map(w =>
      w.id === id ? { ...w, zIndex: nextZIndex, minimized: false } : w
    ));
    setNextZIndex(nextZIndex + 1);
  };

  const updateWindowPosition = (id: string, x: number, y: number) => {
    setWindows(windows.map(w =>
      w.id === id ? { ...w, x, y } : w
    ));
  };

  const updateWindowSize = (id: string, width: number, height: number) => {
    setWindows(windows.map(w =>
      w.id === id ? { ...w, width, height } : w
    ));
  };

  const connectWallet = async () => {
    try {
      soundManager.playClick();
      console.log('Starting wallet connection...');
      const wallet = await walletManager.connectWallet();
      console.log('Wallet connected:', wallet);
      setWalletAddress(wallet.address);
      setWalletBalance(wallet.balance);
      setWalletConnected(true);
      soundManager.playSuccess();
      await initializeMockUser(supabase, wallet.address);

      const freshBalance = await walletManager.getBalance();
      console.log('Fresh balance after connection:', freshBalance);
      setWalletBalance(freshBalance);
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      soundManager.playError();

      let errorMessage = 'Failed to connect wallet';
      if (error.message) {
        if (error.message.includes('User rejected') || error.message.includes('cancelled')) {
          errorMessage = 'Connection cancelled by user';
        } else if (error.message.includes('No Solana wallet')) {
          errorMessage = error.message;
        } else {
          errorMessage = error.message;
        }
      }

      alert(errorMessage);
    }
  };

  const disconnectWallet = () => {
    setWalletConnected(false);
    setWalletAddress('');
    setWalletBalance(0);
    soundManager.playClick();
  };

  useEffect(() => {
    if (walletConnected) {
      const interval = setInterval(async () => {
        const newBalance = await walletManager.getBalance();
        setWalletBalance(newBalance);
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [walletConnected]);

  return (
    <AppContext.Provider value={{
      windows,
      openWindow,
      closeWindow,
      minimizeWindow,
      maximizeWindow,
      focusWindow,
      updateWindowPosition,
      updateWindowSize,
      walletConnected,
      walletAddress,
      walletBalance,
      connectWallet,
      disconnectWallet,
    }}>
      {children}
    </AppContext.Provider>
  );
};
