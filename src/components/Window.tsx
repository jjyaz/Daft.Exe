import React, { useRef, useEffect } from 'react';
import { Minus, Square, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { WindowState } from '../types';
import { soundManager } from '../lib/sounds';

interface WindowProps {
  window: WindowState;
  children: React.ReactNode;
}

export const Window: React.FC<WindowProps> = ({ window: win, children }) => {
  const { closeWindow, minimizeWindow, maximizeWindow, focusWindow, updateWindowPosition } = useAppContext();
  const windowRef = useRef<HTMLDivElement>(null);
  const titleBarRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    soundManager.playOpen();
    return () => {
      soundManager.playClose();
    };
  }, []);

  useEffect(() => {
    const titleBar = titleBarRef.current;
    if (!titleBar) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (win.maximized) return;
      isDragging.current = true;
      dragOffset.current = {
        x: e.clientX - win.x,
        y: e.clientY - win.y
      };
      focusWindow(win.id);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const newX = e.clientX - dragOffset.current.x;
      const newY = e.clientY - dragOffset.current.y;
      updateWindowPosition(win.id, newX, newY);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    titleBar.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      titleBar.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [win, focusWindow, updateWindowPosition]);

  if (win.minimized) return null;

  return (
    <div
      ref={windowRef}
      className="win98-window"
      style={{
        left: win.x,
        top: win.y,
        width: win.width,
        height: win.height,
        zIndex: win.zIndex,
      }}
      onMouseDown={() => focusWindow(win.id)}
    >
      <div ref={titleBarRef} className="win98-titlebar">
        <span>{win.title}</span>
        <div className="win98-titlebar-buttons">
          <button
            className="win98-titlebar-button"
            onClick={() => {
              soundManager.playClick();
              minimizeWindow(win.id);
            }}
            title="Minimize"
          >
            <Minus size={8} />
          </button>
          <button
            className="win98-titlebar-button"
            onClick={() => {
              soundManager.playClick();
              maximizeWindow(win.id);
            }}
            title="Maximize"
          >
            <Square size={8} />
          </button>
          <button
            className="win98-titlebar-button"
            onClick={() => {
              soundManager.playClick();
              closeWindow(win.id);
            }}
            title="Close"
          >
            <X size={8} />
          </button>
        </div>
      </div>
      <div className="win98-border p-2" style={{ height: 'calc(100% - 24px)', overflow: 'auto' }}>
        {children}
      </div>
    </div>
  );
};
