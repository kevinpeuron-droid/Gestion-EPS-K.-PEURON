import React, { useState } from 'react';
import { 
  Timer, Compass, Music, Swords, HeartPulse, 
  ChevronDown, ChevronRight, Users,
  PanelLeftClose, PanelLeftOpen, Activity, Plus, X
} from 'lucide-react';
import { ActivityCategory, CAType } from '../types';

interface Props {
  selectedActivity: string;
  onSelectActivity: (activity: string) => void;
  onNavigateClasses: () => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  
  // Props dynamiques
  caList: ActivityCategory[];
  onAddSport: (caId: CAType, name: string) => void;
  onRemoveSport: (caId: CAType, name: string) => void;
}

const IconMap: Record<string, React.ElementType> = {
  Timer, Compass, Music, Swords, HeartPulse
};

export const Sidebar: React.FC<Props> = ({ 
  selectedActivity, 
  onSelectActivity, 
  onNavigateClasses,
  isCollapsed,
  toggleCollapse,
  caList,
  onAddSport,
  onRemoveSport
}) => {
  // SÉCURITÉ : caList doit être un tableau
  const safeCAList = Array.isArray(caList) ? caList : [];

  // Trouver le CA actif sans crasher si l'activité n'existe pas
  const activeCA = safeCAList.find(ca => ca.activities.includes(selectedActivity));
  const activeCAId = activeCA ? activeCA.id : 'CA1';
  
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    [activeCAId]: true
  });

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddSportClick = (e: React.MouseEvent, caId: CAType) => {
    e.stopPropagation();
    const name = prompt("Nom de la nouvelle activité :");
    if (name && name.trim().length > 0) {
      onAddSport(caId, name.trim());
      setOpenSections(prev => ({ ...prev, [caId]: true }));
    }
  };

  const handleRemoveSportClick = (e: React.MouseEvent, caId: CAType, activityName: string) => {
    e.stopPropagation();
    if (confirm(`Supprimer "${activityName}" de la liste ?`)) {
      onRemoveSport(caId, activityName);
    }
  };

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-slate-900 text-white flex flex-col shadow-xl z-20 transition-all duration-300`}>
      {/* Header */}
      <div className="p-4 h-20 border-b border-slate-800 flex items-center justify-between">
        {!isCollapsed && (
          <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2 text-white">
            <Activity className="text-emerald-400" /> 
            <span>Observ'EPS</span>
          </h1>
        )}
        {isCollapsed && <Activity className="text-emerald-400 mx-auto" />}
        <button onClick={toggleCollapse} className="text-slate-500 hover:text-white transition">
           {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20}/>}
        </button>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
        <div className="space-y-1">
          {safeCAList.map((ca) => {
            const Icon = IconMap[ca.iconName] || Timer;
            const isOpen = openSections[ca.id];
            const isActiveContext = ca.activities.includes(selectedActivity);

            return (
              <div key={ca.id} className="px-2">
                <button 
                  onClick={() => !isCollapsed && toggleSection(ca.id)}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-colors group relative ${isActiveContext ? 'bg-slate-800' : 'hover:bg-slate-800'}`}
                  title={ca.label}
                >
                  <div className={`flex items-center gap-3 ${ca.color}`}>
                     <Icon size={20} />
                     {!isCollapsed && <span className="font-semibold text-sm text-slate-200">{ca.shortLabel}</span>}
                  </div>
                  
                  {!isCollapsed && (
                    <div className="flex items-center gap-2">
                        <div 
                            onClick={(e) => handleAddSportClick(e, ca.id)}
                            className="p-1 rounded text-slate-500 hover:text-emerald-400 hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Ajouter une activité"
                        >
                            <Plus size={14} />
                        </div>
                        <span className="text-slate-500">
                           {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </span>
                    </div>
                  )}
                </button>

                {isOpen && !isCollapsed && (
                  <div className="mt-1 ml-4 space-y-1 border-l border-slate-700 pl-2">
                    {ca.activities.map(activity => (
                      <div key={activity} className="relative group/item">
                          <button
                            onClick={() => onSelectActivity(activity)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition pr-8 ${
                              selectedActivity === activity 
                                ? `${ca.bgColor} ${ca.color} font-bold`
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                          >
                            {activity}
                          </button>
                          
                          <button 
                            onClick={(e) => handleRemoveSportClick(e, ca.id, activity)}
                            className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-slate-600 hover:text-red-400 opacity-0 group-hover/item:opacity-100 transition-opacity"
                            title="Supprimer"
                          >
                            <X size={12} />
                          </button>
                      </div>
                    ))}
                    {ca.activities.length === 0 && (
                        <div className="px-3 py-2 text-xs text-slate-600 italic">Aucune activité</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 space-y-2">
         <button 
            onClick={onNavigateClasses}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition text-indigo-300 bg-slate-800 hover:bg-indigo-900 hover:text-white`}
        >
            <Users size={20} />
            {!isCollapsed && <span>Gestion Classes</span>}
         </button>
      </div>
    </aside>
  );
};