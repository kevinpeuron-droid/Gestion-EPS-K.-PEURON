import React from 'react';
import { useEPSKernel } from './hooks/useEPSKernel';
import { Sidebar } from './components/Sidebar';
import { CAModule } from './components/CAModule';
import './index.css';

function App() {
  const kernel = useEPSKernel();

  return (
    <div className="flex h-screen bg-slate-50/50 font-sans text-slate-900 overflow-hidden selection:bg-indigo-500 selection:text-white">
      
      {/* 1. SIDEBAR (Dock Latéral) */}
      <Sidebar 
        caDefinitions={kernel.caDefinitions}
        currentActivity={kernel.currentActivity}
        onSelectActivity={kernel.selectActivity}
        isCollapsed={kernel.isSidebarCollapsed}
        onToggleCollapse={kernel.toggleSidebar}
      />

      {/* 2. MAIN CONTENT (Zone de travail) */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        {/* Background décoratif subtil */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-white to-slate-50 opacity-60 pointer-events-none z-0"></div>

        <div className="flex-1 z-10 overflow-hidden flex flex-col">
          <CAModule 
            activity={kernel.currentActivity}
            ca={kernel.currentCA}
            activeTab={kernel.activeTab}
            onTabChange={kernel.setActiveTab}
          />
        </div>
      </div>

    </div>
  );
}

export default App;