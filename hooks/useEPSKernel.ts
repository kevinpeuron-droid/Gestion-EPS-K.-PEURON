import { useState, useEffect, useMemo } from 'react';
import { Student, Observation, ActivityCategory, CAType, Session, Criterion } from '../types';

// --- CONFIGURATION PAR DÉFAUT (Sécurité) ---

export const DEFAULT_CA_LIST: ActivityCategory[] = [
  { id: 'CA1', label: 'CA1 : Performance', shortLabel: 'Perf.', iconName: 'Timer', color: 'text-blue-500', bgColor: 'bg-blue-50', activities: ['Demi-fond', 'Natation', 'Musculation', 'Vitesse-Relais'] },
  { id: 'CA2', label: 'CA2 : Adaptation', shortLabel: 'Nature', iconName: 'Compass', color: 'text-emerald-500', bgColor: 'bg-emerald-50', activities: ['Escalade', 'Orientation', 'Sauvetage'] },
  { id: 'CA3', label: 'CA3 : Artistique', shortLabel: 'Arts', iconName: 'Music', color: 'text-purple-500', bgColor: 'bg-purple-50', activities: ['Danse', 'Acrosport', 'Cirque'] },
  { id: 'CA4', label: 'CA4 : Opposition', shortLabel: 'Duel', iconName: 'Swords', color: 'text-red-500', bgColor: 'bg-red-50', activities: ['Badminton', 'Basket-ball', 'Boxe', 'Volley'] },
  { id: 'CA5', label: 'CA5 : Entretien', shortLabel: 'Forme', iconName: 'HeartPulse', color: 'text-orange-500', bgColor: 'bg-orange-50', activities: ['Step', 'Yoga', 'Musculation'] }
];

const DEFAULT_SESSION: Session = {
  id: 'init-session',
  date: new Date().toISOString().split('T')[0],
  activity: 'Demi-fond',
  ca: 'CA1',
  group: 'Classe Entière',
  showSessionToStudents: true,
  showObservationToStudents: true,
  variables: { simplify: '', complexify: '' },
  materials: '',
  safetyAlert: '',
  timeline: []
};

// --- HELPER DE SÉCURITÉ ---
function safelyParse<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item || item === 'undefined' || item === 'null') return fallback;
    return JSON.parse(item);
  } catch (e) {
    console.warn(`Erreur de lecture pour ${key}, retour aux valeurs par défaut.`);
    return fallback;
  }
}

export const useEPSKernel = (sessionId: string | null) => {
  
  // 1. ÉTATS PERSISTANTS
  const [caList, setCaList] = useState<ActivityCategory[]>(() => safelyParse('eps_ca_list', DEFAULT_CA_LIST));
  const [students, setStudents] = useState<Student[]>(() => safelyParse('eps_students', []));
  const [observations, setObservations] = useState<Observation[]>(() => safelyParse('eps_observations', []));
  const [criteria, setCriteria] = useState<Criterion[]>(() => safelyParse('eps_criteria', []));
  
  // Session avec merge de sécurité
  const [currentSession, setCurrentSession] = useState<Session>(() => {
    const saved = safelyParse('eps_current_session', DEFAULT_SESSION);
    // On force la présence des tableaux pour éviter les crashs .map()
    return { 
        ...DEFAULT_SESSION, 
        ...saved, 
        timeline: saved.timeline || [],
        variables: saved.variables || { simplify: '', complexify: '' }
    }; 
  });

  // 2. PERSISTENCE AUTOMATIQUE
  useEffect(() => { localStorage.setItem('eps_ca_list', JSON.stringify(caList)); }, [caList]);
  useEffect(() => { localStorage.setItem('eps_students', JSON.stringify(students)); }, [students]);
  useEffect(() => { localStorage.setItem('eps_observations', JSON.stringify(observations)); }, [observations]);
  useEffect(() => { localStorage.setItem('eps_criteria', JSON.stringify(criteria)); }, [criteria]);
  useEffect(() => { localStorage.setItem('eps_current_session', JSON.stringify(currentSession)); }, [currentSession]);

  // 3. ÉTATS CALCULÉS
  const filteredStudents = useMemo(() => {
    if (!currentSession?.group) return students;
    return students.filter(s => s.group === currentSession.group);
  }, [students, currentSession.group]);

  const availableGroups = useMemo(() => {
    const groups = new Set(students.map(s => s.group || 'Sans Groupe'));
    return Array.from(groups).sort();
  }, [students]);

  // Moteur de Stats (Simplifié)
  const stats = useMemo(() => {
    const res: Record<string, any> = {};
    filteredStudents.forEach(s => {
      const obs = observations.filter(o => o.studentId === s.id);
      res[s.id] = {
        studentId: s.id,
        reliability: Math.min(100, obs.length * 5),
        stats: { 'Obs.': obs.length }
      };
    });
    return res;
  }, [filteredStudents, observations]);

  // 4. ACTIONS DE MODIFICATION

  const updateSession = (partial: Partial<Session>) => {
    setCurrentSession(prev => {
      if (!prev) return DEFAULT_SESSION;
      const updated = { ...prev, ...partial };
      
      // Auto-détection du CA si l'activité change
      if (partial.activity) {
        const foundCA = caList.find(ca => ca.activities.includes(partial.activity!));
        if (foundCA) updated.ca = foundCA.id;
      }
      return updated;
    });
  };

  const addObservation = (obs: Omit<Observation, 'id' | 'timestamp'>) => {
    const newObs: Observation = { ...obs, id: crypto.randomUUID(), timestamp: Date.now() };
    setObservations(prev => [...prev, newObs]);
  };

  const importStudents = (list: Student[]) => {
    setStudents(list);
    if (list.length > 0) updateSession({ group: list[0].group });
  };

  // -- GESTION DES SPORTS (CA LIST DYNAMIQUE) --
  const addSport = (caId: CAType, name: string) => {
    setCaList(prev => prev.map(ca => {
      if (ca.id === caId && !ca.activities.includes(name)) {
        return { ...ca, activities: [...ca.activities, name] };
      }
      return ca;
    }));
  };

  const removeSport = (caId: CAType, name: string) => {
    setCaList(prev => prev.map(ca => {
      if (ca.id === caId) {
        return { ...ca, activities: ca.activities.filter(a => a !== name) };
      }
      return ca;
    }));
  };

  const updateCriteria = (newCriteria: Criterion[]) => setCriteria(newCriteria);
  
  const applyCAPreset = (caId: CAType) => {
     // Preset simple pour éviter le vide
     console.log(`Application du preset ${caId}`);
     // TODO: Implémenter des critères par défaut selon le CA
  };

  return {
    // Data
    currentSession,
    caList,
    students,
    filteredStudents,
    availableGroups,
    observations,
    criteria,
    stats,
    
    // Actions
    updateSession,
    addObservation,
    importStudents,
    updateCriteria,
    applyCAPreset,
    addSport,
    removeSport
  };
};