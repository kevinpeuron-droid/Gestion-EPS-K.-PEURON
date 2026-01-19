import React, { useState } from 'react';
import { 
  Timer, Compass, Music, Swords, HeartPulse, 
  ChevronDown, ChevronRight,
  PanelLeftClose, PanelLeftOpen, Activity
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
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const activeCA = caDefinitions.find(ca => ca.activities.includes(currentActivity));
    return activeCA ? { [activeCA.id]: true } : {};
  });

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside className={`${isCollapsed ? 'w-24' : 'w-80'} bg-white text-slate-600 flex flex-col shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] z-50 transition-all duration-300 ease-in-out border-r border-slate-100`}>
      
      {/* Brand Header */}
      <div className={`h-28 flex items-center ${isCollapsed ? 'justify-center' : 'px-8'} border-b border-slate-50`}>
        <div className="flex items-center gap-4 group cursor-default">
           <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 transition-transform group-hover:scale-105 duration-300">
              <Activity size={24} strokeWidth={2.5} />
           </div>
           {!isCollapsed && (
             <div>
               <h1 className="font-extrabold text-slate-900 text-xl tracking-tight leading-none">Observ'EPS</h1>
               <span className="text-[11px] uppercase font-bold text-indigo-500 tracking-wider">Pro Edition</span>
             </div>
           )}
        </div>
      </div>

      {/* Navigation Scrollable */}
      <div className="flex-1 overflow-y-auto py-8 space-y-6 px-5 scrollbar-thin scrollbar-thumb-slate-200">
         
         {!isCollapsed && <div className="px-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Activités</div>}

         {caDefinitions.map(ca => {
            const Icon = IconMap[ca.iconName] || Activity;
            const isOpen = openSections[ca.id];
            const isContextActive = ca.activities.includes(currentActivity);

            // Couleur active dynamique selon le CA (pour le texte/icones)
            const activeColorClass = isContextActive ? ca.color : 'text-slate-500';
            const activeBgClass = isContextActive ? ca.bgColor : 'group-hover:bg-slate-50';

            return (
              <div key={ca.id} className="group/section">
                 {/* Main CA Button */}
                 <button 
                    onClick={() => !isCollapsed && toggleSection(ca.id)}
                    className={`
                        w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-4'} py-4 rounded-2xl transition-all duration-300
                        ${isContextActive && !isCollapsed ? 'bg-slate-50 shadow-sm' : 'hover:bg-slate-50'}
                    `}
                 >
                    <div className="flex items-center gap-4">
                       <div className={`
                            w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
                            ${isContextActive ? 'bg-white shadow-sm scale-110' : 'bg-slate-100 text-slate-400 group-hover/section:bg-white group-hover/section:text-slate-600'}
                       `}>
                            <Icon size={20} className={isContextActive ? ca.color : ''} />
                       </div>
                       
                       {!isCollapsed && (
                           <span className={`font-bold text-[15px] ${isContextActive ? 'text-slate-900' : 'text-slate-500'}`}>
                               {ca.shortLabel}
                           </span>
                       )}
                    </div>
                    
                    {!isCollapsed && (
                       <span className={`transition-transform duration-300 text-slate-400 ${isOpen ? 'rotate-180' : ''}`}>
                         <ChevronDown size={18} strokeWidth={2.5} />
                       </span>
                    )}
                 </button>

                 {/* Sub-menu (Activities) */}
                 {!isCollapsed && isOpen && (
                    <div className="mt-2 ml-4 space-y-1 border-l-2 border-slate-100 pl-4 py-1">
                       {ca.activities.map(act => (
                          <button
                            key={act}
                            onClick={() => onSelectActivity(act)}
                            className={`
                                relative block w-full text-left text-[14px] py-3 px-4 rounded-xl transition-all duration-200 font-medium
                                ${currentActivity === act 
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                }
                            `}
                          >
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
      <div className="p-6 border-t border-slate-50">
        <button 
          onClick={onToggleCollapse} 
          className="w-full flex items-center justify-center p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all duration-200 active:scale-95"
        >
            {isCollapsed ? <PanelLeftOpen size={20}/> : <PanelLeftClose size={20}/>}
        </button>
      </div>
    </aside>
  );
};