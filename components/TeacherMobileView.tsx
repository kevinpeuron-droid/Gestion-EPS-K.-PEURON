import React, { useState } from 'react';
import { Student, Observation } from '../types';
import { Check, X, MessageSquare, Filter } from 'lucide-react';

interface Props {
  students: Student[];
  onObserve: (obs: Omit<Observation, 'id' | 'timestamp'>) => void;
  sessionId: string;
}

export const TeacherMobileView: React.FC<Props> = ({ students, onObserve, sessionId }) => {
  const [filterGroup, setFilterGroup] = useState<string>('ALL');
  
  const groups = Array.from(new Set(students.map(s => s.group)));
  const filteredStudents = filterGroup === 'ALL' ? students : students.filter(s => s.group === filterGroup);

  const handleQuickGrade = (studentId: string, isSuccess: boolean) => {
    // Quick grade defaults to "GLOBAL_PERFORMANCE" or similar generic criteria
    onObserve({
      sessionId,
      studentId,
      criteriaId: 'MAITRISE_GLOBALE',
      isSuccess,
      authorRole: 'PROF'
    });
  };

  return (
    <div className="p-2 pb-20">
      {/* Filter Bar */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-2 sticky top-0 bg-slate-50 z-10 pt-2">
        <button
          onClick={() => setFilterGroup('ALL')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${filterGroup === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border'}`}
        >
          Tous
        </button>
        {groups.map(g => (
          <button
            key={g}
            onClick={() => setFilterGroup(g)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${filterGroup === g ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border'}`}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredStudents.map(student => (
          <div key={student.id} className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900">{student.lastName}</div>
              <div className="text-sm text-slate-500">{student.firstName}</div>
            </div>

            <div className="flex items-center gap-3">
               {/* Quick Actions */}
               <button 
                onClick={() => handleQuickGrade(student.id, false)}
                className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 active:scale-90 transition"
              >
                <X size={20} />
              </button>
              
              <button 
                className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 active:scale-90 transition"
                title="Quick Note (Mock)"
              >
                <MessageSquare size={18} />
              </button>

              <button 
                onClick={() => handleQuickGrade(student.id, true)}
                className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 active:scale-90 transition"
              >
                <Check size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};