import React from 'react';
import { ModuleTab, ActivityCategory, CAType } from '../types';
import { Database, Settings, BookOpen, Activity, Zap, TrendingUp, Users } from 'lucide-react';

interface Props {
  activity: string;
  ca: ActivityCategory;
  activeTab: ModuleTab;
  onTabChange: (tab: ModuleTab) => void;
}

// Configuration visuelle dynamique par CA
const CA_THEMES: Record<CAType, { gradient: string; accent: string; shadow: string }> = {
  'CA1': { gradient: 'from-cyan-500 to-blue-600', accent: 'text-cyan-600', shadow: 'shadow-cyan-500/20' },
  'CA2': { gradient: 'from-emerald-400 to-green-600', accent: 'text-emerald-600', shadow: 'shadow-emerald-500/20' },
  'CA3': { gradient: 'from-purple-500 to-fuchsia-600', accent: 'text-purple-600', shadow: 'shadow-purple-500/20' },
  'CA4': { gradient: 'from-orange-400 to-red-600', accent: 'text-orange-600', shadow: 'shadow-orange-500/20' },
  'CA5': { gradient: 'from-amber-400 to-orange-500', accent: 'text-amber-600', shadow: 'shadow-amber-500/20' }
};

export const CAModule: React.FC<Props> = ({ activity, ca, activeTab, onTabChange }) => {
  
  const theme = CA_THEMES[ca.id] || CA_THEMES['CA1'];

  const tabs = [
    { id: 'DATA', label: 'Données & Analyse', icon: Database },
    { id: 'CONFIG', label: 'Configuration', icon: Settings },
    { id: 'SESSION', label: 'Fiche Séance', icon: BookOpen },
  ] as const;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50/50">
      
      {/* 1. HERO HEADER */}
      <header className="px-8 pt-8 pb-4 flex-none z-10">
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden">
          
          {/* Background Gradient Splash */}
          <div className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-br ${theme.gradient} opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none`}></div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 gap-6">
            <div className="flex items-center gap-6">
               {/* Large Sport Icon */}
               <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white shadow-lg ${theme.shadow} transform rotate-3 hover:rotate-0 transition-transform duration-300`}>
                  <Activity size={40} strokeWidth={1.5} />
               </div>
               
               <div>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold uppercase tracking-wider mb-2 ${theme.accent}`}>
                    <Zap size={12} fill="currentColor" /> {ca.label}
                  </div>
                  <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                    {activity}
                  </h1>
                  <p className="text-slate-500 font-medium mt-1">Espace de gestion pédagogique</p>
               </div>
            </div>

            {/* Quick Stats (Fake for visual balance) */}
            <div className="flex gap-4">
               <div className="text-center px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-2xl font-bold text-slate-800">24</div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Élèves</div>
               </div>
               <div className="text-center px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-2xl font-bold text-slate-800">92%</div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Activité</div>
               </div>
            </div>
          </div>

          {/* 2. SEGMENTED CONTROL TABS */}
          <div className="mt-8">
            <nav className="flex p-1.5 bg-slate-100/80 backdrop-blur-sm rounded-xl max-w-fit border border-slate-200/50">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id as ModuleTab)}
                    className={`
                      relative flex items-center gap-2.5 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300
                      ${isActive 
                        ? 'text-slate-900 shadow-sm bg-white ring-1 ring-black/5' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                      }
                    `}
                  >
                    <Icon size={18} className={isActive ? theme.accent : 'text-slate-400'} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* 3. CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-8 pt-2">
        
        {/* VIEW 1: DATA & ANALYSIS */}
        {activeTab === 'DATA' && (
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
            {/* Empty State Card */}
            <div className="col-span-full bg-white p-12 rounded-3xl border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center min-h-[400px]">
               <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 text-indigo-400 animate-pulse-slow">
                  <Database size={40} />
               </div>
               <h3 className="text-2xl font-bold text-slate-900 mb-2">Zone d'Import & Analyse</h3>
               <p className="text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
                 C'est ici que vous importerez vos CSV (Chrono EPS, etc.) pour générer des tableaux de bord automatiques pour <span className="font-bold text-slate-800">{activity}</span>.
               </p>
               <button className="px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2">
                 <Database size={18} /> Charger un fichier CSV
               </button>
            </div>
          </div>
        )}

        {/* VIEW 2: CONFIGURATION */}
        {activeTab === 'CONFIG' && (
          <div className="max-w-5xl mx-auto animate-fade-in-up">
             <div className="bg-white p-16 rounded-3xl border border-slate-100 shadow-sm text-center">
               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                  <Settings size={40} />
               </div>
               <h3 className="text-2xl font-bold text-slate-900 mb-2">Configuration des Observables</h3>
               <p className="text-slate-500 max-w-lg mx-auto">
                 Personnalisez les boutons, compteurs et chronomètres que les élèves utiliseront pour l'observation.
               </p>
            </div>
          </div>
        )}

        {/* VIEW 3: SESSION PLANNER */}
        {activeTab === 'SESSION' && (
           <div className="max-w-5xl mx-auto animate-fade-in-up">
             <div className="bg-white p-16 rounded-3xl border border-slate-100 shadow-sm text-center">
               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                  <BookOpen size={40} />
               </div>
               <h3 className="text-2xl font-bold text-slate-900 mb-2">Scénario Pédagogique</h3>
               <p className="text-slate-500 max-w-lg mx-auto">
                 Définissez le temps de travail, les consignes, les variables didactiques et les critères de réussite.
               </p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};