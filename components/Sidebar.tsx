import React, { useState } from 'react';
import { 
  Timer, Compass, Music, Swords, HeartPulse, 
  Activity, ChevronRight, PanelLeftClose, PanelLeftOpen, 
  Settings, UserCircle
} from 'lucide-react';
import { ActivityCategory } from '../types';

interface Props {
  caDefinitions: ActivityCategory[];
  currentActivity: string;
  onSelectActivity: (activity: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenSettings: () => void;
}

const IconMap: Record<string, React.ElementType> = {
  Timer, Compass, Music, Swords, HeartPulse
};

export const Sidebar: React.FC<Props> = ({ 
  caDefinitions, 
  currentActivity, 
  onSelectActivity, 
  isCollapsed,
  onToggleCollapse,
  onOpenSettings
}) => {
  const [expandedCA, setExpandedCA] = useState<string | null>(() => {
    const found = caDefinitions.find(ca => ca.activities.includes(currentActivity));
    return found ? found.id : null;
  });

  const handleToggleCA = (caId: string) => {
    if (isCollapsed) return;
    setExpandedCA(prev => prev === caId ? null : caId);
  };

  return (
    <aside 
      className={`
        ${isCollapsed ? 'w-24' : 'w-[320px]'} 
        h-full flex flex-col py-6 px-4 z-50 transition-all duration-500 ease-in-out shrink-0
      `}
    >
      {/* Container "Glass Dark" */}
      <div className="flex-1 flex flex-col bg-[#0F172A] rounded-[2rem] shadow-2xl shadow-slate-900/20 border border-slate-800 overflow-hidden relative">
        
        {/* Glow interne */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-50" />

        {/* --- HEADER --- */}
        <div className={`h-24 flex items-center ${isCollapsed ? 'justify-center' : 'px-8'} shrink-0`}>
          <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer">
              <div className="absolute inset-0 bg-indigo-500 rounded-xl blur opacity-40 group-hover:opacity-60 transition-opacity" />
              <div className="relative w-11 h-11 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white shadow-inner border border-white/10">
                <Activity size={22} strokeWidth={3} />
              </div>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col animate-enter">
                <h1 className="text-white font-bold text-lg tracking-tight leading-tight">Observ'EPS</h1>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Workspace</span>
              </div>
            )}
          </div>
        </div>

        {/* --- NAVIGATION --- */}
        <div className="flex-1 overflow-y-auto px-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700/50">
          
          {/* Section CA */}
          <div className="space-y-1">
            {!isCollapsed && <div className="px-4 mb-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Champs d'Apprentissage</div>}
            
            {caDefinitions.map((ca) => {
              const Icon = IconMap[ca.iconName] || Activity;
              const isExpanded = expandedCA === ca.id;
              const isActiveContext = ca.activities.includes(currentActivity);

              return (
                <div key={ca.id} className="group">
                  <button
                    onClick={() => handleToggleCA(ca.id)}
                    className={`
                      w-full relative flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-4'} py-3.5 rounded-2xl transition-all duration-300
                      ${isActiveContext ? 'bg-white/10 text-white shadow-lg shadow-black/20' : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'}
                    `}
                  >
                    {/* Active Indicator Bar */}
                    {isActiveContext && !isCollapsed && (
                      <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full ${ca.bgColor.replace('bg-', 'bg-')}`} />
                    )}

                    <div className="flex items-center gap-4">
                      <Icon 
                        size={22} 
                        className={`transition-colors duration-300 ${isActiveContext ? ca.color : 'text-slate-500 group-hover:text-slate-300'}`} 
                        strokeWidth={isActiveContext ? 2.5 : 2}
                      />
                      {!isCollapsed && (
                        <div className="text-left">
                           <div className="font-bold text-[15px] tracking-tight leading-none">{ca.label}</div>
                           <div className="text-[11px] text-slate-500 font-medium mt-0.5">{ca.description}</div>
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Sub-menu (Accordion) */}
                  {!isCollapsed && (
                    <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-2 mb-4' : 'grid-rows-[0fr] opacity-0'}`}>
                      <div className="overflow-hidden">
                        <div className="space-y-1 pl-4 border-l-2 border-slate-800 ml-4">
                          {ca.activities.map(act => (
                            <button
                              key={act}
                              onClick={() => onSelectActivity(act)}
                              className={`
                                w-full text-left text-[13px] py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-between group/item
                                ${currentActivity === act 
                                  ? 'text-white font-semibold bg-white/5' 
                                  : 'text-slate-500 hover:text-slate-300'
                                }
                              `}
                            >
                              {act}
                              {currentActivity === act && <ChevronRight size={14} className="text-indigo-400" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* --- FOOTER --- */}
        <div className="p-4 mt-auto border-t border-slate-800 bg-[#0B1120] space-y-2">
           {/* Admin Button */}
           <button 
              onClick={onOpenSettings}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'px-4'} py-3 rounded-xl hover:bg-white/5 transition group`}
              title="Gérer les activités"
           >
              <Settings size={20} className="text-slate-400 group-hover:text-white transition-colors" />
              {!isCollapsed && <span className="ml-3 text-sm font-medium text-slate-400 group-hover:text-white">Gérer les activités</span>}
           </button>

           {/* User Profile */}
           <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} animate-enter pt-2 border-t border-white/5`}>
              {!isCollapsed && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center border border-slate-500/50">
                      <UserCircle size={18} className="text-slate-300" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Prof. EPS</div>
                    </div>
                  </div>
              )}
              <button 
                onClick={onToggleCollapse}
                className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition"
              >
                {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
              </button>
            </div>
        </div>
      </div>
    </aside>
  );
};
