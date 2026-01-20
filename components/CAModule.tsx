import React from 'react';
import { ActivityCategory, ModuleTab, CAType, EngineId, AppDefinition, ActivityResult } from '../types';
import { ExternalAppLoader } from './ExternalAppLoader';
import { SynthesisModule } from './SynthesisModule'; // Nouveau
import { 
  BarChart3, Settings2, BookOpenCheck, 
  Database, Plus, Layout, Zap, PenTool,
  Gamepad2, Cpu
} from 'lucide-react';

interface Props {
  activity: string;
  ca: ActivityCategory;
  activeTab: ModuleTab;
  onTabChange: (tab: ModuleTab) => void;
  currentEngineId: EngineId;
  currentApp: AppDefinition;
  
  // Bridge Props
  onSaveResult: (res: Omit<ActivityResult, 'id' | 'date'>) => void;
  results: ActivityResult[];
  
  // Reset Prop
  sessionKey?: number;
}

// Configuration des Thèmes Visuels (Gradients & Accents)
const THEMES: Record<CAType, { bg: string; text: string; light: string; border: string }> = {
  'CA1': { bg: 'bg-cyan-500', text: 'text-cyan-600', light: 'bg-cyan-50', border: 'border-cyan-200' },
  'CA2': { bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-200' },
  'CA3': { bg: 'bg-fuchsia-500', text: 'text-fuchsia-600', light: 'bg-fuchsia-50', border: 'border-fuchsia-200' },
  'CA4': { bg: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-50', border: 'border-orange-200' },
  'CA5': { bg: 'bg-rose-500', text: 'text-rose-600', light: 'bg-rose-50', border: 'border-rose-200' }
};

export const CAModule: React.FC<Props> = ({ 
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
              {/* Le "key" force la réinitialisation complète du composant quand sessionKey change */}
              <ExternalAppLoader 
                  key={sessionKey} 
                  engineId={currentEngineId} 
                  activityName={activity}
                  onSaveResult={onSaveResult}
              />
           </div>
        )}

        {/* VIEW: DATA / SYNTHESIS (SMART DASHBOARD) */}
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

        {/* VIEW: CONFIG & SESSION (Legacy Placeholders) */}
        {(activeTab === 'CONFIG' || activeTab === 'SESSION') && (
          <div className="h-full w-full bg-white rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden flex flex-col items-center justify-center text-center p-12 group">
             {/* Decor */}
             <div className={`
                absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                w-[600px] h-[600px] ${theme.bg} opacity-[0.03] rounded-full blur-[120px] 
                pointer-events-none transition-all duration-1000 group-hover:opacity-[0.05] z-0
             `}></div>

             <div className="relative z-10 max-w-lg mx-auto space-y-6 animate-enter">
                {activeTab === 'CONFIG' && (
                  <>
                    <div className="w-24 h-24 mx-auto bg-slate-50 rounded-[1.5rem] flex items-center justify-center shadow-inner text-slate-300 mb-2">
                       <Layout size={40} strokeWidth={1.5} />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900">Configuration</h2>
                    <p className="text-slate-500 text-lg">
                      Définissez les observables et les critères d'évaluation pour ce module.
                    </p>
                  </>
                )}
                {activeTab === 'SESSION' && (
                  <>
                    <div className="w-24 h-24 mx-auto bg-slate-50 rounded-[1.5rem] flex items-center justify-center shadow-inner text-slate-300 mb-2">
                       <PenTool size={40} strokeWidth={1.5} />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900">Fiche de Séance</h2>
                    <p className="text-slate-500 text-lg">
                      Préparez votre intervention : Objectifs, Déroulement, Matériel.
                    </p>
                  </>
                )}
             </div>
          </div>
        )}

      </div>
    </div>
  );
};