import React, { useMemo } from 'react';
import { ActivityResult, AppDefinition } from '../types';
import { 
  Trophy, TrendingUp, Clock, AlertCircle, 
  BarChart3, Activity, Calendar
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface Props {
  activityName: string;
  appDef: AppDefinition;
  results: ActivityResult[];
}

const formatTime = (ms: number) => {
  if (!ms && ms !== 0) return '-';
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}'${seconds < 10 ? '0' : ''}${seconds}`;
};

export const SynthesisModule: React.FC<Props> = ({ activityName, appDef, results }) => {

  // SAFETY GUARD
  if (!appDef) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center text-slate-400">
         <AlertCircle size={48} className="mb-4 opacity-50" />
         <h3 className="text-xl font-bold text-slate-700">Erreur Configuration</h3>
         <p>Impossible de charger la définition de l'application.</p>
      </div>
    );
  }

  // --- ANALYTICS PLIJADOUR (CHRONO) ---
  const plijadourStats = useMemo(() => {
    if (appDef.componentKey !== 'CHRONO_PLIJADOUR') return null;

    // Calculer les meilleures perfs et moyennes
    const perfs = results.map(r => r.data.bestTime || 0).filter(t => t > 0);
    const avgTimes = results.map(r => r.data.avg50 || 0).filter(t => t > 0);
    
    const bestOverall = perfs.length > 0 ? Math.min(...perfs) : 0;
    const globalAvg50 = avgTimes.length > 0 ? (avgTimes.reduce((a, b) => a + b, 0) / avgTimes.length) : 0;
    
    // Data pour le graph
    const chartData = results.slice(0, 10).map(r => ({
       name: r.studentName.split(' ')[0], // Prénom
       best: r.data.bestTime ? Math.round(r.data.bestTime / 1000) : 0,
       avg: r.data.avg50 ? Math.round(r.data.avg50 / 1000) : 0
    }));

    return { bestOverall, globalAvg50, chartData };
  }, [results, appDef]);

  // --- RENDERERS ---

  if (results.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-12 text-center text-slate-400">
           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
             <BarChart3 size={32} className="opacity-50" />
           </div>
           <h3 className="text-xl font-bold text-slate-700 mb-2">Aucune donnée</h3>
           <p className="max-w-md">
             Utilisez l'application <span className="font-bold text-indigo-500">{appDef.name}</span> dans l'onglet correspondant pour générer des résultats.
             Ils apparaîtront ici automatiquement.
           </p>
        </div>
      );
  }

  return (
    <div className="h-full overflow-y-auto p-8 space-y-8">
       
       {/* HEADER SUMMARY */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl">
                 <Activity size={24} />
              </div>
              <div>
                 <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Participations</div>
                 <div className="text-3xl font-black text-slate-800">{results.length}</div>
              </div>
           </div>

           {/* STATS DYNAMIQUES SELON MOTEUR */}
           {appDef.componentKey === 'CHRONO_PLIJADOUR' && plijadourStats && (
             <>
               <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl">
                     <Trophy size={24} />
                  </div>
                  <div>
                     <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Record Séance</div>
                     <div className="text-3xl font-black text-slate-800">{formatTime(plijadourStats.bestOverall)}</div>
                  </div>
               </div>

               <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="p-4 bg-cyan-50 text-cyan-600 rounded-xl">
                     <Clock size={24} />
                  </div>
                  <div>
                     <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Moyenne 50m</div>
                     <div className="text-3xl font-black text-slate-800">{formatTime(plijadourStats.globalAvg50)}</div>
                  </div>
               </div>
             </>
           )}
       </div>

       {/* GRAPHIQUES */}
       <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          {/* GRAPHIQUE PLIJADOUR */}
          {appDef.componentKey === 'CHRONO_PLIJADOUR' && plijadourStats && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm min-h-[350px] flex flex-col">
               <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                 <TrendingUp size={20} className="text-cyan-500" /> Performance Globale (Top 10)
               </h3>
               <div className="flex-1 w-full min-h-[250px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={plijadourStats.chartData} margin={{top: 10, right: 30, left: 0, bottom: 0}}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                      <Tooltip 
                        cursor={{fill: '#f8fafc'}}
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                      />
                      <Bar dataKey="avg" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Moy. 50m (s)" />
                      <Bar dataKey="best" fill="#10b981" radius={[4, 4, 0, 0]} name="Meilleur (s)" />
                    </BarChart>
                 </ResponsiveContainer>
               </div>
            </div>
          )}

          {/* TABLEAU RÉCAP */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                 <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                   <Calendar size={20} className="text-indigo-500" /> Historique Récent
                 </h3>
              </div>
              <div className="overflow-auto flex-1 p-0">
                 <table className="w-full text-left text-sm">
                    <thead className="bg-white text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                       <tr>
                          <th className="px-6 py-4">Élève</th>
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4 text-right">Résultat</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {results.map((res) => (
                          <tr key={res.id} className="hover:bg-slate-50 transition">
                             <td className="px-6 py-4 font-bold text-slate-700">{res.studentName}</td>
                             <td className="px-6 py-4 text-slate-500">{new Date(res.date).toLocaleDateString()}</td>
                             <td className="px-6 py-4 text-right font-mono text-indigo-600 font-medium">
                                {appDef.componentKey === 'CHRONO_PLIJADOUR' ? (
                                   <span>
                                     {res.data.bestTime ? formatTime(res.data.bestTime) : '-'} <span className="text-xs text-slate-400">(Best)</span>
                                   </span>
                                ) : (
                                   <span>Donnée brute</span>
                                )}
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
          </div>
       </div>
    </div>
  );
};