import React, { useState } from 'react';
import { useEPSKernel } from './hooks/useEPSKernel';
import { Dashboard } from './views/Dashboard';
import { ClassManager } from './views/ClassManager';
import { SessionPlanner } from './views/SessionPlanner';
import { ObservationSetup } from './views/ObservationSetup';
import { StudentView } from './components/StudentView';
import { TeacherMobileView } from './components/TeacherMobileView';
import { Sidebar } from './components/Sidebar';
import { Users, Smartphone, ChevronDown, LayoutDashboard, Eye, BookOpen, Settings } from 'lucide-react';
import { ViewState } from './types';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const kernel = useEPSKernel('session-persist-1');

  // --- BARRIÈRE DE SÉCURITÉ ---
  // Empêche le rendu tant que le kernel n'a pas chargé la session
  if (!kernel || !kernel.currentSession) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-slate-50 text-slate-500 space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <div className="font-medium animate-pulse">Initialisation du moteur EPS...</div>
      </div>
    );
  }

  // --- RENDU DES MODES IMMERSIFS ---
  
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
          <TeacherMobileView students={kernel.filteredStudents} onObserve={kernel.addObservation} sessionId={kernel.currentSession.id} />
        </div>
      );
  }

  // --- RENDU DU BUREAU PROFESSEUR ---

  const handleViewChange = (view: ViewState) => setCurrentView(view);
  const isClassMode = currentView === 'CLASSES';

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden">
      
      <Sidebar 
        selectedActivity={kernel.currentSession.activity}
        onSelectActivity={(act) => {
            kernel.updateSession({ activity: act });
            if (currentView === 'CLASSES') setCurrentView('DASHBOARD');
        }}
        onNavigateClasses={() => setCurrentView('CLASSES')}
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        caList={kernel.caList}
        onAddSport={kernel.addSport}
        onRemoveSport={kernel.removeSport}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10 shrink-0">
           <div className="flex items-center gap-8">
              {/* Sélecteur de classe */}
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

              {/* Navigation Rapide */}
              {!isClassMode && (
                  <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button 
                        onClick={() => handleViewChange('DASHBOARD')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${currentView === 'DASHBOARD' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <LayoutDashboard size={16}/> Dashboard
                    </button>
                    <button 
                        onClick={() => handleViewChange('SESSION_PLANNER')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${currentView === 'SESSION_PLANNER' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <BookOpen size={16}/> Séance
                    </button>
                    <button 
                        onClick={() => handleViewChange('OBSERVATION_SETUP')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${currentView === 'OBSERVATION_SETUP' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Settings size={16}/> Critères
                    </button>
                  </div>
              )}
           </div>

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
            <div className="max-w-7xl mx-auto h-full">
                {currentView === 'DASHBOARD' && <Dashboard kernel={kernel} />}
                {currentView === 'CLASSES' && <ClassManager kernel={kernel} />}
                {currentView === 'SESSION_PLANNER' && <SessionPlanner kernel={kernel} />}
                {currentView === 'OBSERVATION_SETUP' && <ObservationSetup kernel={kernel} />}
            </div>
        </main>
      </div>
    </div>
  );
}

export default App;