import React from 'react';
import { useEPSKernel } from './hooks/useEPSKernel';
import { Sidebar } from './components/Sidebar';
import { CAModule } from './components/CAModule';

function App() {
  const kernel = useEPSKernel();

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden relative">
      
      {/* Sidebar (Navigation) */}
      <Sidebar 
        caDefinitions={kernel.caDefinitions}
        currentActivity={kernel.currentActivity}
        onSelectActivity={kernel.selectActivity}
        isCollapsed={kernel.isSidebarCollapsed}
        onToggleCollapse={kernel.toggleSidebar}
      />

      {/* Main Stage (Bento Container) */}
      <main className="flex-1 h-full p-4 pl-0 transition-all duration-300 ease-out min-w-0">
        <div className="h-full w-full rounded-[2.5rem] bg-white border border-white/60 shadow-xl shadow-slate-200/50 overflow-hidden relative">
            <CAModule 
              activity={kernel.currentActivity}
              ca={kernel.currentCA}
              activeTab={kernel.activeTab}
              onTabChange={kernel.setTab}
            />
        </div>
      </main>

    </div>
  );
}

export default App;