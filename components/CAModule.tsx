import React from 'react';
import { ModuleTab, ActivityCategory, CAType } from '../types';
import { Database, Settings, BookOpen, Activity, Zap } from 'lucide-react';

interface Props {
  activity: string;
  ca: ActivityCategory;
  activeTab: ModuleTab;
  onTabChange: (tab: ModuleTab) => void;
}

// Thèmes visuels "Pastel Vif"
const CA_THEMES: Record<CAType, { gradient: string; accent: string; shadow: string; border: string }> = {
  'CA1': { gradient: 'from-blue-500 to-indigo-600', accent: 'text-indigo-600', shadow: 'shadow-indigo-200', border: 'border-indigo-100' },
  'CA2': { gradient: 'from-emerald-400 to-teal-600', accent: 'text-emerald-600', shadow: 'shadow-emerald-200', border: 'border-emerald-100' },
  'CA3': { gradient: 'from-fuchsia-500 to-purple-600', accent: 'text-fuchsia-600', shadow: 'shadow-fuchsia-200', border: 'border-fuchsia-100' },
  'CA4': { gradient: 'from-orange-400 to-rose-500', accent: 'text-rose-600', shadow: 'shadow-rose-200', border: 'border-rose-100' },
  'CA5': { gradient: 'from-amber-400 to-orange-500', accent: 'text-amber-600', shadow: 'shadow-amber-200', border: 'border-amber-100' }
};

export const CAModule: React.FC<Props> = ({ activity, ca, activeTab, onTabChange }) => {
  
  const theme = CA_THEMES[ca.id] || CA_THEMES['CA1'];

  const tabs = [
    { id: 'DATA', label: 'Données & Analyse', icon: Database },
    { id: 'CONFIG', label: 'Configuration', icon: Settings },
    { id: 'SESSION', label: 'Fiche Séance', icon: BookOpen },
  ] as const;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      
      {/* 1. HERO HEADER (Flottant) */}
      <header className="px-8 pt-8 pb-6 flex-none z-10">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
            
            {/* Titre & Info */}
            <div className="flex items-center gap-6">
               <div className={`
                    w-24 h-24 rounded-[2rem] bg-gradient-to-br ${theme.gradient} 
                    flex items-center justify-center text-white shadow-2xl ${theme.shadow} 
                    transform transition-transform hover:scale-105 duration-300
               `}>
                  <Activity size={44} strokeWidth={1.5} />
               </div>
               
               <div>
                  <div className={`
                      inline-flex items-center gap-2 px-4 py-1.5 rounded-full 
                      bg-white border ${theme.border} text-xs font-bold uppercase tracking-wider mb-3 shadow-sm
                      ${theme.accent}
                  `}>
                    <Zap size={14} fill="currentColor" /> {ca.label}
                  </div>
                  <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight leading-none">
                    {activity}
                  </h1>
               </div>
            </div>

            {/* 2. PILL TABS SELECTOR (Style iOS Segmented Control) */}
            <nav className="bg-slate-200/50 p-1.5 rounded-full flex gap-1 shadow-inner max-w-full overflow-x-auto">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id as ModuleTab)}
                    className={`
                      relative flex items-center gap-2.5 px-6 py-3 rounded-full text-sm font-bold transition-all duration-300
                      ${isActive 
                        ? 'bg-white text-slate-900 shadow-lg shadow-slate-200/50 scale-100' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                      }
                    `}
                  >
                    <Icon size={18} className={isActive ? theme.accent : 'text-slate-400'} strokeWidth={2.5} />
                    <span className="whitespace-nowrap">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
        </div>
      </header>

      {/* 3. BENTO CONTENT AREA */}
      <main className="flex-1 overflow-y-auto px-8 pb-8 pt-2 scrollbar-thin scrollbar-thumb-slate-300">
        
        {/* VIEW 1: DATA & ANALYSIS */}
        {activeTab === 'DATA' && (
          <div className="max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-2 gap-8 animate-fade-in-up">
            
            {/* Main Bento Card */}
            <div className="xl:col-span-2 bg-white rounded-[2.5rem] p-12 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border-none text-center flex flex-col items-center justify-center min-h-[500px] relative overflow-hidden">
               {/* Decorative Background Blob */}
               <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-b ${theme.gradient} opacity-[0.03] rounded-full blur-3xl pointer-events-none`}></div>

               <div className={`w-24 h-24 rounded-3xl bg-slate-50 flex items-center justify-center mb-8 text-slate-400 shadow-inner`}>
                  <Database size={48} strokeWidth={1.5} />
               </div>
               
               <h3 className="text-3xl font-extrabold text-slate-900 mb-4 relative z-10">
                   Espace Données
               </h3>
               
               <p className="text-slate-500 text-lg max-w-xl mx-auto mb-10 leading-relaxed relative z-10">
                 Importez vos fichiers CSV pour générer automatiquement les tableaux de bord de suivi et d'analyse pour <span className={`font-bold ${theme.accent}`}>{activity}</span>.
               </p>
               
               <button className={`
                    px-10 py-5 rounded-2xl font-bold text-white shadow-xl transition-all duration-300 active:scale-95 flex items-center gap-3 text-lg
                    bg-gradient-to-r ${theme.gradient} hover:shadow-2xl hover:-translate-y-1
               `}>
                 <Database size={24} /> Importer un fichier CSV
               </button>
            </div>
          </div>
        )}

        {/* VIEW 2: CONFIGURATION */}
        {activeTab === 'CONFIG' && (
          <div className="max-w-[1200px] mx-auto animate-fade-in-up">
             <div className="bg-white rounded-[2.5rem] p-16 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border-none text-center relative overflow-hidden">
               <div className="absolute top-0 right-0 p-12 opacity-5">
                   <Settings size={200} />
               </div>

               <div className="w-24 h-24 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto mb-8 text-slate-400 shadow-inner">
                  <Settings size={48} strokeWidth={1.5} />
               </div>
               <h3 className="text-3xl font-extrabold text-slate-900 mb-4">Configuration des Observables</h3>
               <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                 Personnalisez les indicateurs de réussite. Créez des boutons, des compteurs ou des chronomètres adaptés à votre situation d'apprentissage.
               </p>
            </div>
          </div>
        )}

        {/* VIEW 3: SESSION PLANNER */}
        {activeTab === 'SESSION' && (
           <div className="max-w-[1200px] mx-auto animate-fade-in-up">
             <div className="bg-white rounded-[2.5rem] p-16 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border-none text-center relative overflow-hidden">
               <div className="absolute -left-10 bottom-0 p-12 opacity-5">
                   <BookOpen size={200} />
               </div>

               <div className="w-24 h-24 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto mb-8 text-slate-400 shadow-inner">
                  <BookOpen size={48} strokeWidth={1.5} />
               </div>
               <h3 className="text-3xl font-extrabold text-slate-900 mb-4">Scénario Pédagogique</h3>
               <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                 Structurez votre leçon. Définissez le timing, les consignes de sécurité, le matériel et les variables didactiques pour chaque phase.
               </p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};