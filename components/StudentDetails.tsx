import React from 'react';
import { Student, StudentStats } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { ArrowLeft, Award, TrendingUp, AlertCircle } from 'lucide-react';

interface Props {
  student: Student;
  stats: StudentStats;
  onBack: () => void;
}

export const StudentDetails: React.FC<Props> = ({ student, stats, onBack }) => {
  // Transform criteria stats for chart
  const radarData = Object.entries(stats.criteriaStats).map(([key, val]) => {
    const value = val as { attempts: number; success: number; rate: number };
    return {
      subject: key,
      A: value.rate,
      fullMark: 100,
    };
  });

  const barData = Object.entries(stats.criteriaStats).map(([key, val]) => {
    const value = val as { attempts: number; success: number; rate: number };
    return {
      name: key,
      success: value.success,
      failures: value.attempts - value.success,
    };
  });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-800">
        <ArrowLeft size={20} /> Retour
      </button>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Header Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex-1 w-full">
          <h1 className="text-3xl font-bold text-slate-900 mb-1">{student.firstName} {student.lastName}</h1>
          <p className="text-slate-500 mb-6">{student.group} • {student.gender === 'M' ? 'Garçon' : 'Fille'}</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-indigo-50 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-indigo-700 mb-1 font-medium">
                <TrendingUp size={18} /> Moyenne Pondérée
              </div>
              <div className="text-3xl font-bold text-indigo-900">{stats.weightedAverage}%</div>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-emerald-700 mb-1 font-medium">
                <Award size={18} /> Observations
              </div>
              <div className="text-3xl font-bold text-emerald-900">{stats.totalObservations}</div>
            </div>
            <div className="bg-slate-100 p-4 rounded-xl col-span-2">
               <div className="flex items-center gap-2 text-slate-700 mb-1 font-medium">
                <AlertCircle size={18} /> Indice de Fiabilité
              </div>
              <div className="w-full bg-slate-300 rounded-full h-2.5 mb-1 mt-2">
                <div 
                  className="bg-slate-700 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${stats.reliabilityIndex * 10}%` }}
                ></div>
              </div>
              <div className="text-right text-xs text-slate-500">{stats.reliabilityIndex}/10</div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="flex-1 w-full space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 min-h-[300px]">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Profil de Compétence</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar name="Elève" dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.4} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 min-h-[300px]">
             <h3 className="text-lg font-bold text-slate-800 mb-4">Volume d'Activité</h3>
             <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12}} />
                  <Tooltip />
                  <Bar dataKey="success" stackId="a" fill="#22c55e" name="Réussites" />
                  <Bar dataKey="failures" stackId="a" fill="#ef4444" name="Echecs" />
                </BarChart>
              </ResponsiveContainer>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};