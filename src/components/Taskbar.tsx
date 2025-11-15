import React, { useState, useEffect } from 'react';
import { Menu, Volume2, Wifi } from 'lucide-react';

export const Taskbar: React.FC = () => {
  const [showStartMenu, setShowStartMenu] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <>
      <div className="taskbar">
        <button
          className="win98-button start-button"
          onClick={() => setShowStartMenu(!showStartMenu)}
        >
          <Menu size={16} />
          Start
        </button>

        <div className="system-tray">
          <Volume2 size={14} />
          <Wifi size={14} color="var(--solana-purple)" />
          <span style={{ fontSize: '11px' }}>{formatTime(time)}</span>
        </div>
      </div>

      {showStartMenu && (
        <div className="start-menu">
          <div className="start-menu-item" onClick={() => setShowStartMenu(false)}>
            Programs
          </div>
          <div className="start-menu-item" onClick={() => setShowStartMenu(false)}>
            Documents
          </div>
          <div className="start-menu-item" onClick={() => setShowStartMenu(false)}>
            Settings
          </div>
          <div className="border-t border-gray-500 my-1"></div>
          <div className="start-menu-item" onClick={() => setShowStartMenu(false)}>
            Shut Down
          </div>
        </div>
      )}
    </>
  );
};
