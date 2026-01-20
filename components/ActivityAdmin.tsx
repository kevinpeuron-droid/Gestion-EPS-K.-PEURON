import React, { useState } from 'react';
import { useEPSKernel } from '../hooks/useEPSKernel';
import { CAType, AppDefinition } from '../types';
import { StudentImport } from './StudentImport';
import { 
  Trash2, Plus, Edit3, Shield, Check,
  Timer, Compass, Swords, Music, HeartPulse, Activity, X,
  Cpu, Gamepad2, Settings, LayoutGrid, AppWindow, Box, AlertCircle, Users
} from 'lucide-react';

interface Props {
  kernel: ReturnType<typeof useEPSKernel>;
}

const IconMap: Record<string, React.ElementType> = {
  Timer, Compass, Music, Swords, HeartPulse, Activity,
  Cpu, Gamepad2, Settings, Box, Layout: LayoutGrid
};

export const ActivityAdmin: React.FC<Props> = ({ kernel }) => {
  const [activeTab, setActiveTab] = useState<'ACTIVITIES' | 'APPS' | 'STUDENTS'>('ACTIVITIES');
  
  // -- STATES ACTIVITIES --
  const [newActivityInputs, setNewActivityInputs] = useState<Record<string, string>>({});
  const [editingActivity, setEditingActivity] = useState<{caId: CAType, name: string} | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editEngineId, setEditEngineId] = useState<string>('STANDARD');

  // -- STATES APPS --
  const [newAppInput, setNewAppInput] = useState<{name: string, base: AppDefinition['componentKey']}>({ name: '', base: 'STANDARD' });

  // --- LOGIC ACTIVITIES ---

  const handleInputChange = (caId: string, val: string) => {
      setNewActivityInputs(prev => ({ ...prev, [caId]: val }));
  };

  const handleAddActivity = (caId: CAType) => {
      const name = newActivityInputs[caId];
      if (name) {
          kernel.addActivity(caId, name);
          setNewActivityInputs(prev => ({ ...prev, [caId]: '' }));
      }
  };

  const handleDeleteActivity = (caId: CAType, name: string) => {
      if (confirm(`Supprimer définitivement l'activité "${name}" ?`)) {
          kernel.deleteActivity(caId, name);
      }
  };

  const startEditActivity = (caId: CAType, name: string) => {
      setEditingActivity({ caId, name });
      setEditValue(name);
      setEditEngineId(kernel.engineRegistry[name] || 'STANDARD');
  };

  const saveEditActivity = () => {
      if (editingActivity && editValue) {
          if (editValue !== editingActivity.name) {
              kernel.renameActivity(editingActivity.caId, editingActivity.name, editValue);
          }
          // Save Engine Choice
          kernel.setActivityEngine(editValue, editEngineId);
      }
      setEditingActivity(null);
      setEditValue('');
  };

  // --- LOGIC APPS ---

  const handleAddApp = () => {
      if (newAppInput.name) {
          kernel.registerApp(newAppInput.name, newAppInput.base);
          setNewAppInput({ name: '', base: 'STANDARD' });
      }
  };

  const handleDeleteApp = (appId: string) => {
      if (confirm("Supprimer ce logiciel ? Les activités qui l'utilisent repasseront en Standard.")) {
          kernel.deleteApp(appId);
      }
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-fade-in space-y-8">
      
      {/* HEADER & TABS */}
      <div className="bg-white p-2 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex p-2 bg-slate-100/50 rounded-2xl gap-1 w-full md:w-auto">
              <button 
                onClick={() => setActiveTab('ACTIVITIES')}
                className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'ACTIVITIES' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500 hover:bg-slate-200/50'}`}
              >
                  <LayoutGrid size={18} /> Activités
              </button>
              <button 
                onClick={() => setActiveTab('APPS')}
                className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'APPS' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500 hover:bg-slate-200/50'}`}
              >
                  <AppWindow size={18} /> Logiciels
              </button>
              <button 
                onClick={() => setActiveTab('STUDENTS')}
                className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'STUDENTS' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500 hover:bg-slate-200/50'}`}
              >
                  <Users size={18} /> Élèves
              </button>
          </div>
          
          <div className="px-6 flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
             <Shield size={14} /> Administration
          </div>
      </div>

      {/* === TAB 1: ACTIVITIES === */}
      {activeTab === 'ACTIVITIES' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-enter">
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
                              <div className="flex flex-col gap-2 min-h-[100px]">
                                  {ca.activities.length === 0 && (
                                      <div className="w-full h-20 flex items-center justify-center text-slate-300 text-sm italic border-2 border-dashed border-slate-100 rounded-xl">
                                          Aucune activité
                                      </div>
                                  )}
                                  
                                  {ca.activities.map(act => {
                                      const isEditing = editingActivity?.name === act && editingActivity?.caId === ca.id;
                                      
                                      // Trouve l'app utilisée
                                      const engineId = kernel.engineRegistry[act] || 'STANDARD';
                                      const usedApp = kernel.registeredApps.find(app => app.id === engineId) || kernel.registeredApps[0];
                                      
                                      // Safety check
                                      if (!usedApp) return null;

                                      const AppIcon = IconMap[usedApp.icon] || Box;

                                      if (isEditing) {
                                          return (
                                              <div key={act} className="flex flex-col gap-2 bg-slate-50 border border-indigo-200 rounded-xl p-3 animate-enter shadow-lg shadow-indigo-100/50">
                                                  <label className="text-[10px] font-bold text-indigo-400 uppercase">Nom de l'activité</label>
                                                  <input 
                                                    autoFocus
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
                                                  />
                                                  
                                                  <label className="text-[10px] font-bold text-indigo-400 uppercase mt-1">Logiciel / Outil</label>
                                                  <select
                                                    value={editEngineId}
                                                    onChange={(e) => setEditEngineId(e.target.value)}
                                                    className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
                                                  >
                                                      {kernel.registeredApps.map(app => (
                                                          <option key={app.id} value={app.id}>{app.name} {app.isSystem ? '(Système)' : ''}</option>
                                                      ))}
                                                  </select>

                                                  <div className="flex gap-2 mt-2">
                                                      <button onClick={saveEditActivity} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-indigo-700">Enregistrer</button>
                                                      <button onClick={() => setEditingActivity(null)} className="px-3 bg-white border border-slate-200 text-slate-500 py-2 rounded-lg text-xs font-bold hover:bg-slate-50">Annuler</button>
                                                  </div>
                                              </div>
                                          );
                                      }

                                      return (
                                          <div 
                                            key={act} 
                                            className="group/badge flex items-center justify-between p-2 pr-3 bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-xl transition-all cursor-pointer"
                                            onClick={() => startEditActivity(ca.id, act)}
                                          >
                                              <div className="flex items-center gap-3">
                                                  <span className="text-sm font-bold text-slate-700 pl-1">{act}</span>
                                              </div>

                                              <div className="flex items-center gap-2">
                                                  {/* Badge Logiciel */}
                                                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${usedApp.color.replace('text-', 'bg-').replace('600', '100')} ${usedApp.color}`}>
                                                      <AppIcon size={12} />
                                                      {usedApp.name}
                                                  </div>
                                                  
                                                  <button 
                                                    onClick={(e) => { e.stopPropagation(); startEditActivity(ca.id, act); }}
                                                    className="p-1.5 text-slate-300 hover:text-indigo-500 transition opacity-0 group-hover/badge:opacity-100"
                                                  >
                                                      <Edit3 size={14} />
                                                  </button>

                                                  <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteActivity(ca.id, act);
                                                    }}
                                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition opacity-0 group-hover/badge:opacity-100"
                                                  >
                                                      <X size={14} />
                                                  </button>
                                              </div>
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
                                      onKeyDown={(e) => e.key === 'Enter' && handleAddActivity(ca.id)}
                                      placeholder={`Ajouter au ${ca.label}...`}
                                      className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition shadow-sm"
                                  />
                                  <button 
                                      onClick={() => handleAddActivity(ca.id)}
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
      )}

      {/* === TAB 2: APPS LIBRARY === */}
      {activeTab === 'APPS' && (
          <div className="space-y-6 animate-enter">
              
              {/* Add New App */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-end">
                  <div className="flex-1 w-full space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nom du logiciel</label>
                      <input 
                          value={newAppInput.name}
                          onChange={(e) => setNewAppInput(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Ex: Mon Chrono Vitesse..."
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                  </div>
                  <div className="flex-1 w-full space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Basé sur le module</label>
                      <select 
                          value={newAppInput.base}
                          onChange={(e) => setNewAppInput(prev => ({ ...prev, base: e.target.value as any }))}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                          <option value="STANDARD">Standard (Obs. Critériée)</option>
                          <option value="CHRONO_PLIJADOUR">Chrono Plijadour (Natation)</option>
                          <option value="MINGUEN">Minguen Orientation (CO)</option>
                      </select>
                  </div>
                  <button 
                      onClick={handleAddApp}
                      disabled={!newAppInput.name}
                      className="px-8 py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-200"
                  >
                      <Plus size={20} className="inline mr-2" /> Déclarer
                  </button>
              </div>

              {/* Apps Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {kernel.registeredApps.map(app => {
                      const AppIcon = IconMap[app.icon] || Box;
                      return (
                          <div key={app.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-colors">
                               
                               <div className="flex items-start justify-between mb-4">
                                   <div className={`p-3 rounded-2xl ${app.color.replace('text-', 'bg-').replace('600', '100')} ${app.color}`}>
                                       <AppIcon size={24} />
                                   </div>
                                   {app.isSystem ? (
                                       <div className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest rounded-full border border-slate-200">
                                           Système
                                       </div>
                                   ) : (
                                       <button 
                                          onClick={() => handleDeleteApp(app.id)}
                                          className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                                       >
                                          <Trash2 size={20} />
                                       </button>
                                   )}
                               </div>

                               <h3 className="text-xl font-bold text-slate-800 mb-2">{app.name}</h3>
                               <p className="text-sm text-slate-500 mb-6 min-h-[40px]">{app.description}</p>

                               <div className="flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-50 p-3 rounded-xl">
                                   <Cpu size={14} /> 
                                   Moteur : <span className="font-mono text-slate-600">{app.componentKey}</span>
                               </div>

                          </div>
                      );
                  })}
              </div>
          </div>
      )}

      {/* === TAB 3: STUDENTS (NEW) === */}
      {activeTab === 'STUDENTS' && (
          <div className="space-y-8 animate-enter">
              {/* COMPOSANT D'IMPORT */}
              <StudentImport onImport={kernel.importStudents} />
              
              {/* LISTE ACTUELLE */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <div>
                          <h3 className="text-lg font-bold text-slate-800">Base Élèves ({kernel.students.length})</h3>
                          <p className="text-sm text-slate-500">Liste globale disponible pour toutes les activités.</p>
                      </div>
                      <button 
                        onClick={kernel.clearAllStudents}
                        className="text-red-500 text-sm font-bold hover:text-red-700 px-4 py-2 hover:bg-red-50 rounded-lg transition"
                      >
                          <Trash2 size={16} className="inline mr-2"/> Tout Supprimer
                      </button>
                  </div>
                  
                  <div className="max-h-[500px] overflow-y-auto">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-white sticky top-0 text-slate-400 font-bold uppercase text-xs tracking-wider border-b border-slate-100">
                              <tr>
                                  <th className="p-4">Nom</th>
                                  <th className="p-4">Prénom</th>
                                  <th className="p-4">Classe</th>
                                  <th className="p-4 text-center">Sexe</th>
                                  <th className="p-4 text-right">Actions</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                              {kernel.students.map(s => (
                                  <tr key={s.id} className="hover:bg-slate-50">
                                      <td className="p-4 font-bold text-slate-700">{s.lastName}</td>
                                      <td className="p-4 text-slate-600">{s.firstName}</td>
                                      <td className="p-4"><span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-500">{s.group}</span></td>
                                      <td className="p-4 text-center">
                                          <span className={`w-6 h-6 inline-flex items-center justify-center rounded-full text-xs font-bold ${s.gender === 'M' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                                              {s.gender}
                                          </span>
                                      </td>
                                      <td className="p-4 text-right">
                                          <button 
                                            onClick={() => kernel.deleteStudent(s.id)}
                                            className="text-slate-300 hover:text-red-500 p-1"
                                          >
                                              <X size={16} />
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                              {kernel.students.length === 0 && (
                                  <tr>
                                      <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                                          Aucun élève dans la base. Utilisez le module d'import ci-dessus.
                                      </td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};
