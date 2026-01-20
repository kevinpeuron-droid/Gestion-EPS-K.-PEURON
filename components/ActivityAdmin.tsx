import React, { useState } from 'react';
import { useEPSKernel } from '../hooks/useEPSKernel';
import { CAType } from '../types';
import { 
  Trash2, Plus, Edit3, Settings, Shield,
  Timer, Compass, Swords, Music, HeartPulse, Activity
} from 'lucide-react';

interface Props {
  kernel: ReturnType<typeof useEPSKernel>;
}

const IconMap: Record<string, React.ElementType> = {
  Timer, Compass, Music, Swords, HeartPulse, Activity
};

export const ActivityAdmin: React.FC<Props> = ({ kernel }) => {
  const [newActivityInputs, setNewActivityInputs] = useState<Record<string, string>>({});
  const [editingActivity, setEditingActivity] = useState<{caId: CAType, name: string} | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleInputChange = (caId: string, val: string) => {
      setNewActivityInputs(prev => ({ ...prev, [caId]: val }));
  };

  const handleAdd = (caId: CAType) => {
      const name = newActivityInputs[caId];
      if (name) {
          kernel.addActivity(caId, name);
          setNewActivityInputs(prev => ({ ...prev, [caId]: '' }));
      }
  };

  const handleDelete = (caId: CAType, name: string) => {
      if (confirm(`Supprimer définitivement l'activité "${name}" ?`)) {
          kernel.deleteActivity(caId, name);
      }
  };

  const startEdit = (caId: CAType, name: string) => {
      setEditingActivity({ caId, name });
      setEditValue(name);
  };

  const saveEdit = () => {
      if (editingActivity && editValue) {
          kernel.renameActivity(editingActivity.caId, editingActivity.name, editValue);
          setEditingActivity(null);
      }
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-fade-in space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Shield size={32} />
            </div>
            <div>
                <h2 className="text-2xl font-black text-slate-800">Administration des Activités</h2>
                <p className="text-slate-500">Gérez le catalogue des sports disponibles pour chaque Champ d'Apprentissage.</p>
            </div>
          </div>
          <div className="text-sm text-slate-400 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
             Modifications enregistrées automatiquement
          </div>
      </div>

      {/* Grid des CA */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {kernel.caDefinitions.map(ca => {
              const Icon = IconMap[ca.iconName] || Activity;
              const inputValue = newActivityInputs[ca.id] || '';

              return (
                  <div key={ca.id} className="glass-panel rounded-2xl overflow-hidden flex flex-col h-full bg-white">
                      {/* CA Header */}
                      <div className={`p-4 ${ca.bgColor} bg-opacity-10 border-b border-slate-100 flex items-center justify-between`}>
                          <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${ca.bgColor} text-white shadow-sm`}>
                                  <Icon size={18} />
                              </div>
                              <span className={`font-bold ${ca.color}`}>{ca.label}</span>
                          </div>
                          <span className="text-[10px] font-black opacity-50 uppercase">{ca.id}</span>
                      </div>

                      {/* Content */}
                      <div className="p-4 flex-1 flex flex-col gap-3">
                          
                          {/* List Activities */}
                          <div className="space-y-2">
                              {ca.activities.length === 0 && (
                                  <div className="text-center py-4 text-slate-400 italic text-sm border-2 border-dashed border-slate-100 rounded-lg">
                                      Aucune activité
                                  </div>
                              )}
                              {ca.activities.map(act => (
                                  <div key={act} className="group flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all">
                                      {editingActivity?.name === act && editingActivity?.caId === ca.id ? (
                                          <div className="flex flex-1 gap-2">
                                              <input 
                                                autoFocus
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onBlur={saveEdit}
                                                onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                                                className="flex-1 bg-white border border-indigo-300 rounded px-2 py-1 text-sm outline-none shadow-sm"
                                              />
                                          </div>
                                      ) : (
                                          <>
                                            <span className="font-medium text-slate-700 pl-2">{act}</span>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => startEdit(ca.id, act)}
                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(ca.id, act)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                          </>
                                      )}
                                  </div>
                              ))}
                          </div>

                          {/* Add New */}
                          <div className="mt-auto pt-4 border-t border-slate-100">
                              <div className="flex items-center gap-2">
                                  <input 
                                    value={inputValue}
                                    onChange={(e) => handleInputChange(ca.id, e.target.value)}
                                    placeholder="Ajouter (ex: VTT)..."
                                    className="flex-1 text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAdd(ca.id)}
                                  />
                                  <button 
                                    onClick={() => handleAdd(ca.id)}
                                    disabled={!inputValue}
                                    className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition shadow-sm"
                                  >
                                      <Plus size={18} />
                                  </button>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-2 ml-1">
                                  {ca.id === 'CA1' && "💡 Hérite des outils de mesure (Chrono, Perf)."}
                                  {ca.id === 'CA4' && "💡 Hérite des outils de score et duel."}
                                  {ca.id === 'CA2' && "💡 Hérite des outils de déplacement."}
                              </p>
                          </div>

                      </div>
                  </div>
              );
          })}
      </div>
    </div>
  );
};
