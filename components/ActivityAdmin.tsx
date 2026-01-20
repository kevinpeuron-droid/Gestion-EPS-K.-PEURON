import React, { useState } from 'react';
import { useEPSKernel } from '../hooks/useEPSKernel';
import { CAType } from '../types';
import { 
  Trash2, Plus, Edit3, Shield,
  Timer, Compass, Swords, Music, HeartPulse, Activity, X
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
      if (editingActivity && editValue && editValue !== editingActivity.name) {
          kernel.renameActivity(editingActivity.caId, editingActivity.name, editValue);
      }
      setEditingActivity(null);
      setEditValue('');
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-fade-in space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-900/20">
                <Shield size={24} />
            </div>
            <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Gestion des Activités</h2>
                <p className="text-slate-500 font-medium">Ajoutez, modifiez ou supprimez les sports de chaque Champ.</p>
            </div>
          </div>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
             Auto-Save Active
          </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {kernel.caDefinitions.map(ca => {
              const Icon = IconMap[ca.iconName] || Activity;
              const inputValue = newActivityInputs[ca.id] || '';

              return (
                  <div key={ca.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden group">
                      
                      {/* CA Header */}
                      <div className="p-6 pb-2 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl ${ca.bgColor} flex items-center justify-center text-white shadow-md`}>
                                  <Icon size={18} strokeWidth={2.5} />
                              </div>
                              <div>
                                  <div className={`text-sm font-black uppercase tracking-wider ${ca.color}`}>{ca.label}</div>
                                  <div className="text-lg font-bold text-slate-800 leading-none">{ca.description}</div>
                              </div>
                          </div>
                      </div>

                      {/* Activities Body */}
                      <div className="p-6 flex-1 flex flex-col gap-4">
                          <div className="flex flex-wrap gap-2 content-start min-h-[100px]">
                              {ca.activities.length === 0 && (
                                  <div className="w-full h-20 flex items-center justify-center text-slate-300 text-sm italic border-2 border-dashed border-slate-100 rounded-xl">
                                      Aucune activité
                                  </div>
                              )}
                              
                              {ca.activities.map(act => {
                                  const isEditing = editingActivity?.name === act && editingActivity?.caId === ca.id;
                                  
                                  if (isEditing) {
                                      return (
                                          <div key={act} className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 animate-enter">
                                              <input 
                                                autoFocus
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onBlur={saveEdit}
                                                onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                                                className="bg-white border border-indigo-300 rounded px-2 py-1 text-sm outline-none w-32 shadow-sm text-slate-800 font-medium"
                                              />
                                          </div>
                                      );
                                  }

                                  return (
                                      <div 
                                        key={act} 
                                        className="group/badge inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer"
                                        onClick={() => startEdit(ca.id, act)}
                                      >
                                          {act}
                                          <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(ca.id, act);
                                            }}
                                            className="w-5 h-5 flex items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                                          >
                                              <X size={12} strokeWidth={3} />
                                          </button>
                                      </div>
                                  );
                              })}
                          </div>
                      </div>

                      {/* Quick Add Footer */}
                      <div className="p-4 bg-slate-50/50 border-t border-slate-100">
                          <div className="relative">
                               <input 
                                  value={inputValue}
                                  onChange={(e) => handleInputChange(ca.id, e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleAdd(ca.id)}
                                  placeholder={`Ajouter au ${ca.label}...`}
                                  className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition shadow-sm"
                               />
                               <button 
                                  onClick={() => handleAdd(ca.id)}
                                  disabled={!inputValue}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-slate-900 text-white rounded-lg hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 transition shadow-sm"
                               >
                                   <Plus size={16} />
                               </button>
                          </div>
                      </div>

                  </div>
              );
          })}
      </div>
    </div>
  );
};
