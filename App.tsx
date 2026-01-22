
import React, { useState, useEffect } from 'react';
import { useEPSKernel } from './hooks/useEPSKernel';
import { Dashboard } from './views/Dashboard';
import { ClassManager } from './views/ClassManager';
import { SessionPlanner } from './views/SessionPlanner';
import { ActivityAdmin } from './components/ActivityAdmin';
import { ExternalAppLoader } from './components/ExternalAppLoader';
import { Sidebar } from './components/Sidebar';
import { 
  Users, Smartphone, ChevronDown, LayoutDashboard, 
  RotateCcw, ExternalLink, Cast, Globe, Lock, ArrowLeft 
} from 'lucide-react';
import { ViewState, SharedResource } from './types';

// --- ROUTER SYSTEM ---

type Route = 'HOME' | 'PROF' | 'ELEVE';

const getRouteFromHash = (): Route => {
  const hash = window.location.hash;
  if (hash.startsWith('#/prof')) return 'PROF';
  if (hash.startsWith('#/eleve')) return 'ELEVE';
  return 'HOME';
};

function App() {
  const [route, setRoute] = useState<Route>(getRouteFromHash());
  const kernel = useEPSKernel('session-persist-1');

  // Listen to hash changes
  useEffect(() => {
    const onHashChange = () => setRoute(getRouteFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // -- RENDERER --
  if (route === 'PROF') return <TeacherInterface kernel={kernel} />;
  if (route === 'ELEVE') return <StudentInterface kernel={kernel} />;
  return <LandingPage />;
}

// --- LANDING PAGE (ACCUEIL) ---

const LandingPage = () => {
  return (
    <div className="h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
      {/* Background Graphic */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
         <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500 rounded-full blur-[128px]"></div>
         <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500 rounded-full blur-[128px]"></div>
      </div>

      <div className="z-10 text-center space-y-12 max-w-2xl">
        <div className="space-y-4">
           <h1 className="text-6xl font-black tracking-tighter">Observ'EPS <span className="text-indigo-400">Pro</span></h1>
           <p className="text-xl text-slate-400 font-light">La suite logicielle complète pour l'EPS connectée.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
           <a href="#/prof" className="group relative bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl p-8 transition-all hover:scale-105">
              <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                 <ArrowLeft className="rotate-180" />
              </div>
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-900/50">
                 <Smartphone size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-2">Espace Enseignant</h3>
              <p className="text-sm text-slate-400">Gestion, analyse, configuration et pilotage de la séance.</p>
           </a>

           <a href="#/eleve" className="group relative bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl p-8 transition-all hover:scale-105">
              <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                 <ArrowLeft className="rotate-180" />
              </div>
              <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-900/50">
                 <Users size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-2">Espace Élève</h3>
              <p className="text-sm text-slate-400">Accès aux ateliers, saisie de résultats et fiches de suivi.</p>
           </a>
        </div>
      </div>
      
      <footer className="absolute bottom-6 text-slate-600 text-xs font-mono">
         v2.0 • Propulsé par React Kernel
      </footer>
    </div>
  );
};

// --- TEACHER INTERFACE (PROF) ---

const TeacherInterface = ({ kernel }: { kernel: ReturnType<typeof useEPSKernel> }) => {
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  
  const isClassMode = currentView === 'CLASSES';
  const isSettingsMode = currentView === 'SETTINGS';

  // Fonction de diffusion
  const handleBroadcast = () => {
    const app = kernel.currentApp;
    
    // Si on est sur l'onglet Config ou Session, on diffuse le document correspondant
    if (kernel.activeTab === 'CONFIG' && kernel.currentActivityConfig.observationLink) {
        kernel.setSharedResource({
            type: 'OBSERVATION_DOC',
            activityName: kernel.currentActivity,
            url: kernel.currentActivityConfig.observationLink,
            timestamp: Date.now()
        });
        alert("Fiche d'observation diffusée aux élèves.");
    } 
    else if (kernel.activeTab === 'SESSION' && kernel.currentActivityConfig.sessionLink) {
        kernel.setSharedResource({
            type: 'SESSION_DOC',
            activityName: kernel.currentActivity,
            url: kernel.currentActivityConfig.sessionLink,
            timestamp: Date.now()
        });
        alert("Fiche de séance diffusée aux élèves.");
    }
    // Sinon, on diffuse l'application active (Moteur)
    else if (kernel.currentEngineId !== 'STANDARD') {
        kernel.setSharedResource({
            type: 'APP',
            activityName: kernel.currentActivity,
            engineId: kernel.currentEngineId,
            timestamp: Date.now()
        });
        alert(`Application "${app.name}" diffusée aux élèves.`);
    } 
    else {
        alert("Aucun contenu spécifique à diffuser pour cette vue.");
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden">
      
      <Sidebar 
        caDefinitions={kernel.caDefinitions}
        currentActivity={kernel.currentActivity}
        onSelectActivity={(act) => {
            kernel.selectActivity(act);
            if (currentView !== 'DASHBOARD' && currentView !== 'SESSION_PLANNER') setCurrentView('DASHBOARD');
        }}
        isCollapsed={kernel.isSidebarCollapsed}
        onToggleCollapse={kernel.toggleSidebar}
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
                  <div className="flex items-center gap-3">
                    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                        <button 
                            onClick={() => setCurrentView('DASHBOARD')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${currentView === 'DASHBOARD' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <LayoutDashboard size={16}/> Module
                        </button>
                        <button 
                            onClick={() => setCurrentView('CLASSES')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${currentView === 'CLASSES' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Users size={16}/> Élèves
                        </button>
                    </div>

                    <button 
                       onClick={kernel.startNewSession}
                       className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 active:scale-95 transition shadow-sm text-sm font-bold"
                       title="Réinitialiser pour une nouvelle séance"
                    >
                       <RotateCcw size={16} /> Nouvelle Séance
                    </button>
                  </div>
              )}
           </div>

           {/* Right Section (Broadcast) */}
           <div className="flex items-center gap-4">
               {/* BOUTON SHARE */}
               <button 
                  onClick={handleBroadcast}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 active:scale-95 transition shadow-lg shadow-indigo-200"
                  title="Diffuser l'écran actuel aux élèves"
               >
                  <Cast size={18} /> Diffuser aux élèves
               </button>

               <a href="#/" className="text-slate-400 hover:text-red-600 transition ml-4" title="Déconnexion">
                   <Lock size={20} />
               </a>
           </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-8">
            <div className="max-w-screen-2xl mx-auto h-full">
                {currentView === 'DASHBOARD' && <Dashboard kernel={kernel} />}
                {currentView === 'CLASSES' && <ClassManager kernel={kernel} />}
                {currentView === 'SESSION_PLANNER' && <SessionPlanner kernel={kernel} />}
                {currentView === 'SETTINGS' && <ActivityAdmin kernel={kernel} />}
            </div>
        </main>
      </div>
    </div>
  );
};

// --- STUDENT INTERFACE (ELEVE) ---

const StudentInterface = ({ kernel }: { kernel: ReturnType<typeof useEPSKernel> }) => {
  const resource = kernel.sharedResource;

  if (!resource) {
      return (
          <div className="h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center animate-enter">
              <div className="w-24 h-24 bg-white rounded-full shadow-sm border border-slate-200 flex items-center justify-center mb-6 animate-pulse">
                  <Cast size={40} className="text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">En attente du professeur...</h2>
              <p className="text-slate-500 max-w-md">
                  Le contenu s'affichera ici dès que l'enseignant le diffusera. 
                  Gardez cette page ouverte.
              </p>
              <a href="#/" className="mt-12 text-xs text-slate-300 hover:text-slate-500 underline">Retour Accueil</a>
          </div>
      );
  }

  return (
      <div className="h-screen bg-slate-50 flex flex-col">
          {/* Minimal Header */}
          <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
              <div className="font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  {resource.activityName}
              </div>
              <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase text-indigo-500 bg-indigo-50 px-2 py-1 rounded">Mode Élève</span>
                  <a href="#/" className="text-slate-400 hover:text-slate-600"><Lock size={16}/></a>
              </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden relative">
              
              {/* CAS 1 : APPLICATION (Moteur) */}
              {resource.type === 'APP' && resource.engineId && (
                  <ExternalAppLoader 
                      engineId={resource.engineId} 
                      activityName={resource.activityName} 
                      onSaveResult={kernel.saveResult} 
                  />
              )}

              {/* CAS 2 : DOCUMENT (Iframe) */}
              {(resource.type === 'SESSION_DOC' || resource.type === 'OBSERVATION_DOC') && resource.url && (
                  <iframe 
                      src={resource.url} 
                      className="w-full h-full border-0" 
                      title="Document Partagé"
                      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                  />
              )}

          </div>
      </div>
  );
};

export default App;
