import React from 'react';
import { useEPSKernel } from '../hooks/useEPSKernel';
import { ActivityCategory, ModuleTab, EngineId, AppDefinition, ActivityResult } from '../types';
import { ExternalAppLoader } from './ExternalAppLoader';
import { SynthesisModule } from './SynthesisModule';
import { ObservationSetup } from '../views/ObservationSetup'; // Import du composant Config
import { SessionPlanner } from '../views/SessionPlanner'; // Import du composant Séance
import { 
  BarChart3, Settings2, BookOpenCheck, 
  Gamepad2, Cpu
} from 'lucide-react';

// Modif Props pour accepter le Kernel entier (plus simple pour le prop drilling vers les sous-modules)
interface Props {
  kernel: ReturnType<typeof useEPSKernel>;
  // Props extraites pour compatibilité UI
  activity: string;
  ca: ActivityCategory;
  activeTab: ModuleTab;
  onTabChange: (tab: ModuleTab) => void;
  currentEngineId: EngineId;
  currentApp: AppDefinition;
  onSaveResult: (res: Omit<ActivityResult, 'id' | 'date'>) => void;
  results: ActivityResult[];
  sessionKey?: number;
}

// Configuration des Thèmes Visuels (Gradients & Accents)
const THEMES: Record<string, { bg: string; text: string; light: string; border: string }> = {
  'CA1': { bg: 'bg-cyan-500', text: 'text-cyan-600', light: 'bg-cyan-50', border: 'border-cyan-200' },
  'CA2': { bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-200' },
  'CA3': { bg: 'bg-fuchsia-500', text: 'text-fuchsia-600', light: 'bg-fuchsia-50', border: 'border-fuchsia-200' },
  'CA4': { bg: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-50', border: 'border-orange-200' },
  'CA5': { bg: 'bg-rose-500', text: 'text-rose-600', light: 'bg-rose-50', border: 'border-rose-200' }
};

export const CAModule: React.FC<Props> = ({ 
    kernel, // Nouveau prop
    activity, ca, activeTab, onTabChange, 
    currentEngineId, currentApp, 
    onSaveResult, results, sessionKey 
}) => {
  const theme = THEMES[ca.id] || THEMES['CA1'];
  
  const tabs = [
    { id: 'DATA', label: 'Synthèse', icon: BarChart3 },
    { id: 'CONFIG', label: 'Config', icon: Settings2 },
    { id: 'SESSION', label: 'Séance', icon: BookOpenCheck },
  ];

  if (currentEngineId && currentEngineId !== 'STANDARD') {
      const appLabel = currentEngineId === 'CHRONO_PLIJADOUR' ? 'Chrono' : 'Orientation';
      const AppIcon = currentEngineId === 'CHRONO_PLIJADOUR' ? Cpu : Gamepad2;
      tabs.push({ id: 'APP', label: appLabel, icon: AppIcon });
  }

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-slate-50/30">
      
      {/* 1. HEADER STANDARD */}
      <header className="px-10 pt-10 pb-6 shrink-0 z-20">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
          <div>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${theme.border} ${theme.light} mb-4`}>
              <span className={`w-2 h-2 rounded-full ${theme.bg} animate-pulse`}></span>
              <span className={`text-xs font-bold uppercase tracking-widest ${theme.text}`}>
                {ca.label} • {ca.description}
              </span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none">
              {activity}
            </h1>
          </div>

          <nav className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200/60 inline-flex">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id as ModuleTab)}
                  className={`
                    flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300
                    ${isActive 
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-100' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }
                  `}
                >
                  <Icon size={18} strokeWidth={2.5} className={isActive ? 'text-white' : 'text-slate-400'} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* 2. MAIN CONTENT */}
      <div className="flex-1 px-10 pb-10 overflow-hidden">
        
        {/* VIEW: EXTERNAL APP */}
        {activeTab === 'APP' && (
           <div className="h-full w-full animate-enter">
              <ExternalAppLoader 
                  key={sessionKey} 
                  engineId={currentEngineId} 
                  activityName={activity}
                  onSaveResult={onSaveResult}
              />
           </div>
        )}

        {/* VIEW: DATA / SYNTHESIS */}
        {activeTab === 'DATA' && (
           <div className="h-full w-full bg-white rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
              <SynthesisModule 
                  key={sessionKey}
                  activityName={activity} 
                  appDef={currentApp} 
                  results={results} 
              />
           </div>
        )}

        {/* VIEW: CONFIG (ObservationSetup) */}
        {activeTab === 'CONFIG' && (
          <div className="h-full w-full overflow-y-auto animate-enter">
              <ObservationSetup kernel={kernel} />
          </div>
        )}

        {/* VIEW: SESSION (SessionPlanner) */}
        {activeTab === 'SESSION' && (
          <div className="h-full w-full overflow-y-auto animate-enter">
             <SessionPlanner kernel={kernel} />
          </div>
        )}

      </div>
    </div>
  );
};