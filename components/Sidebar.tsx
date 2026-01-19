import React, { useState } from 'react';
import { 
  Timer, Compass, Music, Swords, HeartPulse, 
  ChevronDown, ChevronRight,
  PanelLeftClose, PanelLeftOpen, Activity, LayoutGrid
} from 'lucide-react';
import { ActivityCategory } from '../types';

interface Props {
  caDefinitions: ActivityCategory[];
  currentActivity: string;
  onSelectActivity: (activity: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const IconMap: Record<string, React.ElementType> = {
  Timer, Compass, Music, Swords, HeartPulse
};

export const Sidebar: React.FC<Props> = ({ 
  caDefinitions,
  currentActivity, 
  onSelectActivity, 
  isCollapsed,
  onToggleCollapse
}) => {
  // Gestion locale de l'ouverture des menus
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const activeCA = caDefinitions.find(ca => ca.activities.includes(currentActivity));
    return activeCA ? { [activeCA.id]: true } : {};
  });

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside className={`${isCollapsed ? 'w-24' : 'w-80'} bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-50 transition-all duration-300 ease-in-out border-r border-slate-800`}>
      
      {/* Brand Header */}
      <div className={`h-24 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-8'} border-b border-slate-800/60`}>
        <div className="flex items-center gap-3.5">
           <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Activity size={20} strokeWidth={3} />
           </div>
           {!isCollapsed && (
             <div>
               <h1 className="font-bold text-white text-lg tracking-tight leading-none">Observ'EPS</h1>
               <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Pro Edition</span>
             </div>
           )}
        </div>
      </div>

      {/* Navigation Scrollable */}
      <div className="flex-1 overflow-y-auto py-8 space-y-4 px-4 scrollbar-hide">
         
         {!isCollapsed && <div className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Champs d'Apprentissage</div>}

         {caDefinitions.map(ca => {
            const Icon = IconMap[ca.iconName] || Activity;
            const isOpen = openSections[ca.id];
            const isContextActive = ca.activities.includes(currentActivity);

            return (
              <div key={ca.id} className="group">
                 {/* Main CA Button */}
                 <button 
                    onClick={() => !isCollapsed && toggleSection(ca.id)}
                    className={`relative w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-4'} py-3.5 rounded-2xl transition-all duration-200 
                      ${isContextActive 
                        ? 'bg-white/10 text-white shadow-lg' 
                        : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                 >
                    {/* Active Marker (Left) */}
                    {isContextActive && !isCollapsed && (
                      <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full ${ca.color.replace('text-', 'bg-')}`}></div>
                    )}

                    <div className="flex items-center gap-4">
                       <Icon 
                        size={22} 
                        className={`transition-colors duration-300 ${isContextActive ? ca.color : 'text-slate-500 group-hover:text-slate-300'}`} 
                       />
                       {!isCollapsed && <span className="font-semibold text-[15px]">{ca.shortLabel}</span>}
                    </div>
                    {!isCollapsed && (
                       <span className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} opacity-50`}>
                         <ChevronDown size={16}/>
                       </span>
                    )}
                 </button>

                 {/* Sub-menu (Activities) */}
                 {!isCollapsed && isOpen && (
                    <div className="mt-2 space-y-1">
                       {ca.activities.map(act => (
                          <button
                            key={act}
                            onClick={() => onSelectActivity(act)}
                            className={`relative block w-full text-left text-[14px] py-2.5 pl-14 pr-4 rounded-xl transition-all
                              ${currentActivity === act 
                                ? 'text-white font-medium bg-white/5' 
                                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                              }`}
                          >
                            {currentActivity === act && (
                               <div className={`absolute left-10 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${ca.color.replace('text-', 'bg-')}`}></div>
                            )}
                            {act}
                          </button>
                       ))}
                    </div>
                 )}
              </div>
            )
         })}
      </div>

      {/* Footer / Collapse */}
      <div className="p-6 border-t border-slate-800/60">
        <button 
          onClick={onToggleCollapse} 
          className="w-full flex items-center justify-center p-3 rounded-xl hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
        >
            {isCollapsed ? <PanelLeftOpen size={20}/> : <PanelLeftClose size={20}/>}
        </button>
      </div>
    </aside>
  );
};