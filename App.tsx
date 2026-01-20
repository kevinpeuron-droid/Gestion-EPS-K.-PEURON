import React, { useState } from 'react';
import { useEPSKernel } from './hooks/useEPSKernel';
import { Dashboard } from './views/Dashboard';
import { ClassManager } from './views/ClassManager';
import { SessionPlanner } from './views/SessionPlanner';
import { ActivityAdmin } from './components/ActivityAdmin';
import { StudentView } from './components/StudentView';
import { TeacherMobileView } from './components/TeacherMobileView';
import { Sidebar } from './components/Sidebar';
import { Users, Smartphone, ChevronDown, LayoutDashboard, Eye, BookOpen } from 'lucide-react';
import { ViewState } from './types';
import { CAModule } from './components/CAModule';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const sessionId = 'session-persist-1';
  const kernel = useEPSKernel(sessionId);

  // -- MODE RENDERERS --
  if (currentView === 'STUDENT_MODE') {
      return (
        <div className="max-w-md mx-auto h-screen bg-slate-50 flex flex-col">
          <header className="bg-white p-4 shadow-sm flex items-center justify-between border-b border-slate-200">
             <h1 className="font-bold text-slate-800 flex items-center gap-2"><Users size={20}/> Mode Élève</h1>
             <button onClick={() => setCurrentView('DASHBOARD')} className="text-xs text-slate-400 border px-3 py-1.5 rounded hover:bg-slate-100 transition">Quitter</button>
          </header>
          <StudentView 
            students={kernel.filteredStudents} 
            onObserve={kernel.addObservation} 
            session={kernel.currentSession}
            criteria={kernel.criteria}
          />
        </div>
      );
  }

  if (currentView === 'TEACHER_MOBILE') {
      return (
        <div className="max-w-md mx-auto h-screen bg-slate-50 flex flex-col">
           <header className="bg-indigo-600 text-white p-4 shadow-sm flex items-center justify-between">
             <h1 className="font-bold flex items-center gap-2"><Smartphone size={20}/> Mode Prof</h1>
             <button onClick={() => setCurrentView('DASHBOARD')} className="text-xs text-indigo-200 border border-indigo-400 px-3 py-1.5 rounded hover:bg-indigo-700 transition">Quitter</button>
          </header>
          <TeacherMobileView students={kernel.filteredStudents} onObserve={kernel.addObservation} sessionId={sessionId} />
        </div>
      );
  }

  const handleViewChange = (view: ViewState) => setCurrentView(view);
  const isClassMode = currentView === 'CLASSES';
  const isSettingsMode = currentView === 'SETTINGS';

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden">
      
      <Sidebar 
        caDefinitions={kernel.caDefinitions}
        currentActivity={kernel.currentActivity}
        onSelectActivity={(act) => {
            kernel.selectActivity(act);
            if (currentView !== 'DASHBOARD' && currentView !== 'SESSION_PLANNER') setCurrentView('DASHBOARD');
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onOpenSettings={() => setCurrentView('SETTINGS')}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10 shrink-0">
           
           {/* Left Section */}
           <div className="flex items-center gap-8">
              {!isSettingsMode && (
                <div className="relative">
                   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Classe Active</label>
                   <div className="relative group">
                      <select 
                          value={kernel.currentSession.group} 
                          onChange={(e) => kernel.updateSession({ group: e.target.value })}
                          className="appearance-none bg-slate-50 border border-slate-200 text-slate-800 font-bold py-1.5 pl-3 pr-8 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-slate-100 transition min-w-[120px] text-sm"
                      >
                          {kernel.availableGroups.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-indigo-500" />
                   </div>
                </div>
              )}

              {!isClassMode && !isSettingsMode && (
                  <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button 
                        onClick={() => handleViewChange('DASHBOARD')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${currentView === 'DASHBOARD' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <LayoutDashboard size={16}/> Module
                    </button>
                    <button 
                        onClick={() => handleViewChange('CLASSES')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${currentView === 'CLASSES' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Users size={16}/> Élèves
                    </button>
                  </div>
              )}
           </div>

           {/* Right Section (Mode switchers) */}
           <div className="flex items-center gap-4">
               <button onClick={() => setCurrentView('TEACHER_MOBILE')} className="text-slate-400 hover:text-indigo-600 transition" title="Mode Mobile">
                   <Smartphone size={20} />
               </button>
               <button onClick={() => setCurrentView('STUDENT_MODE')} className="text-slate-400 hover:text-indigo-600 transition" title="Mode Élève">
                   <Users size={20} />
               </button>
           </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-8">
            <div className="max-w-screen-2xl mx-auto h-full">
                {currentView === 'DASHBOARD' && (
                    <div className="h-full rounded-[2.5rem] bg-white border border-white/60 shadow-xl shadow-slate-200/50 overflow-hidden relative">
                        <CAModule 
                            activity={kernel.currentActivity}
                            ca={kernel.currentCA}
                            activeTab={kernel.activeTab}
                            onTabChange={kernel.setTab}
                        />
                    </div>
                )}
                {currentView === 'CLASSES' && <ClassManager kernel={kernel} />}
                {currentView === 'SESSION_PLANNER' && <SessionPlanner kernel={kernel} />}
                {currentView === 'SETTINGS' && <ActivityAdmin kernel={kernel} />}
            </div>
        </main>
      </div>
    </div>
  );
}

export default App;
