import React, { useState } from 'react';
import { useEPSKernel } from '../hooks/useEPSKernel';
import { CAType, AppModuleType } from '../types';
import { 
  Trash2, Plus, Settings, Activity, 
  Timer, Compass, Swords, Music, HeartPulse, AppWindow 
} from 'lucide-react';

interface Props {
  kernel: ReturnType<typeof useEPSKernel>;
}

const IconMap: Record<string, React.ElementType> = {
  Timer, Compass, Music, Swords, HeartPulse, Activity
};

const ENGINE_OPTIONS: { value: AppModuleType; label: string; icon: string }[] = [
    { value: 'STANDARD', label: 'Standard (Obs)', icon: '📝' },
    { value: 'PLIJADOUR', label: 'Chrono Plijadour', icon: '⏱️' },
    { value: 'MINGUEN', label: 'Orientation Minguen', icon: '🧭' },
];

export const ActivityManager: React.FC<Props> = ({ kernel }) => {
  const [newActivityName, setNewActivityName] = useState('');
  const [selectedCA, setSelectedCA] = useState<CAType>('CA1');
  const [selectedEngine, setSelectedEngine] = useState<AppModuleType>('STANDARD');

  const handleAdd = () => {
    if (!newActivityName.trim()) return;
    kernel.addActivity(selectedCA, newActivityName.trim(), selectedEngine);
    setNewActivityName('');
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-slate-800">Gestion des Activités</h2>
            <p className="text-slate-500">Configurez les sports et assignez les moteurs d'application dédiés.</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
              <Settings className="text-slate-400" size={20} />
              <span className="text-sm font-bold text-slate-600">Configuration Avancée</span>
          </div>
      </div>

      {/* Zone Création Rapide */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nom de l'activité</label>
              <input 
                value={newActivityName}
                onChange={(e) => setNewActivityName(e.target.value)}
                placeholder="Ex: Ultimate, Yoga, Biathlon..."
                className="w-full p-3 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
          </div>
          
          <div className="w-full md:w-48">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Champ (CA)</label>
              <select 
                value={selectedCA}
                onChange={(e) => setSelectedCA(e.target.value as CAType)}
                className="w-full p-3 border border-slate-300 rounded-xl font-bold text-slate-800 bg-slate-50"
              >
                  {kernel.caDefinitions.map(ca => (
                      <option key={ca.id} value={ca.id}>{ca.shortLabel} ({ca.id})</option>
                  ))}
              </select>
          </div>

          <div className="w-full md:w-64">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Moteur (Interface)</label>
              <select 
                value={selectedEngine}
                onChange={(e) => setSelectedEngine(e.target.value as AppModuleType)}
                className="w-full p-3 border border-slate-300 rounded-xl font-bold text-indigo-700 bg-indigo-50"
              >
                  {ENGINE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>
                  ))}
              </select>
          </div>

          <button 
            onClick={handleAdd}
            disabled={!newActivityName}
            className="w-full md:w-auto p-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-200"
          >
              <Plus size={20} /> Ajouter
          </button>
      </div>

      {/* Grille des CA */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {kernel.caDefinitions.map(ca => {
              const Icon = IconMap[ca.iconName] || Activity;
              
              return (
                  <div key={ca.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                      {/* CA Header */}
                      <div className={`p-4 ${ca.bgColor} bg-opacity-10 border-b border-slate-100 flex items-center gap-3`}>
                          <div className={`p-2 rounded-lg ${ca.bgColor} text-white shadow-sm`}>
                              <Icon size={20} />
                          </div>
                          <div>
                              <h3 className={`font-black text-lg ${ca.color}`}>{ca.label}</h3>
                              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{ca.id}</div>
                          </div>
                      </div>

                      {/* Activities List */}
                      <div className="p-2 space-y-1 flex-1">
                          {ca.activities.length === 0 && (
                              <div className="p-8 text-center text-slate-400 italic text-sm">Aucune activité</div>
                          )}
                          {ca.activities.map(act => {
                              const engine = kernel.moduleRegistry[act] || 'STANDARD';
                              return (
                                  <div key={act} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl group transition-colors border border-transparent hover:border-slate-100">
                                      <div className="flex flex-col">
                                          <span className="font-bold text-slate-800">{act}</span>
                                          {/* Engine Selector (Inline) */}
                                          <select 
                                            value={engine}
                                            onChange={(e) => kernel.updateActivityEngine(act, e.target.value as AppModuleType)}
                                            className="text-[10px] bg-transparent text-slate-400 font-bold uppercase mt-0.5 cursor-pointer hover:text-indigo-600 outline-none"
                                          >
                                              {ENGINE_OPTIONS.map(opt => (
                                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                              ))}
                                          </select>
                                      </div>
                                      
                                      <div className="flex items-center gap-2">
                                          <div className={`
                                              px-2 py-1 rounded text-xs font-bold border
                                              ${engine === 'STANDARD' ? 'bg-slate-50 text-slate-500 border-slate-200' : 
                                                engine === 'PLIJADOUR' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                                engine === 'MINGUEN' ? 'bg-purple-50 text-purple-600 border-purple-200' : ''}
                                          `}>
                                              {engine === 'STANDARD' ? 'Std' : engine === 'PLIJADOUR' ? 'Chrono' : 'Orient.'}
                                          </div>
                                          <button 
                                            onClick={() => {
                                                if(confirm(`Supprimer ${act} ?`)) kernel.deleteActivity(ca.id, act);
                                            }}
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                          >
                                              <Trash2 size={16} />
                                          </button>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                  </div>
              );
          })}
      </div>
    </div>
  );
};
