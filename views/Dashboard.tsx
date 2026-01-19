import React, { useState } from 'react';
import { useEPSKernel } from '../hooks/useEPSKernel';
import { ChevronRight, TrendingUp, AlertCircle, Users } from 'lucide-react';

interface Props {
  kernel: ReturnType<typeof useEPSKernel>;
}

export const Dashboard: React.FC<Props> = ({ kernel }) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Tableau de Bord</h2>
           <p className="text-slate-500">
               {kernel.currentSession.activity} • <span className="font-semibold text-indigo-600">{kernel.currentSession.ca}</span>
           </p>
        </div>
        <div className="flex gap-4">
             <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-full"><Users size={16}/></div>
                <div>
                    <div className="text-xs text-slate-500 uppercase font-semibold">Présents</div>
                    <div className="text-xl font-bold text-slate-800">{kernel.filteredStudents.length}</div>
                </div>
             </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Élève</th>
                {/* Dynamic Headers based on first student stats */}
                {kernel.filteredStudents.length > 0 && 
                 Object.keys(kernel.stats[kernel.filteredStudents[0].id]?.stats || {}).map(key => (
                    <th key={key} className="p-4 font-semibold text-center">{key}</th>
                ))}
                <th className="p-4 font-semibold text-center">Fiabilité</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {kernel.filteredStudents.map(student => {
                const sData = kernel.stats[student.id];
                return (
                  <tr key={student.id} className="hover:bg-slate-50 transition group">
                    <td className="p-4 font-medium text-slate-900">{student.lastName} {student.firstName}</td>
                    
                    {/* Dynamic Values */}
                    {Object.values(sData?.stats || {}).map((val: any, idx) => (
                        <td key={idx} className="p-4 text-center text-slate-700 font-mono">
                            {val}
                        </td>
                    ))}

                    <td className="p-4 text-center">
                       <div className="flex items-center justify-center gap-1">
                           <div className="w-full bg-slate-200 rounded-full h-2 w-16 overflow-hidden">
                               <div className="bg-indigo-500 h-full" style={{ width: `${sData?.reliability}%` }}></div>
                           </div>
                       </div>
                    </td>
                  </tr>
                );
              })}
              {kernel.filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-slate-500 flex flex-col items-center justify-center">
                    <AlertCircle size={32} className="mb-2 text-slate-300"/>
                    <p>Aucun élève dans le groupe <span className="font-bold">{kernel.currentSession.group}</span>.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};