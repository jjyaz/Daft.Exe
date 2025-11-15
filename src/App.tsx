import { AppProvider } from './context/AppContext';
import { Desktop } from './components/Desktop';
import { Taskbar } from './components/Taskbar';
import { WindowManager } from './components/WindowManager';

function App() {
  return (
    <AppProvider>
      <div className="w-screen h-screen overflow-hidden bg-teal-600">
        <Desktop />
        <WindowManager />
        <Taskbar />
      </div>
    </AppProvider>
  );
}

export default App;
