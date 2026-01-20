import { useState, useMemo, useEffect } from 'react';
import { ActivityCategory, ModuleTab, Student, Session, Observation, Criterion, CAType } from '../types';

// --- CONFIGURATION INITIALE STANDARD ---
const INITIAL_CA_DEFINITIONS: ActivityCategory[] = [
  { 
    id: 'CA1', 
    label: 'Performance', 
    shortLabel: 'Perf', 
    iconName: 'Timer', 
    color: 'text-cyan-500', 
    bgColor: 'bg-cyan-500', 
    activities: ['Demi-fond', 'Natation', 'Vitesse'] 
  },
  { 
    id: 'CA2', 
    label: 'Adaptation', 
    shortLabel: 'Nature', 
    iconName: 'Compass', 
    color: 'text-emerald-500', 
    bgColor: 'bg-emerald-500', 
    activities: ['Course Orientation', 'Escalade'] 
  },
  { 
    id: 'CA3', 
    label: 'Artistique', 
    shortLabel: 'Arts', 
    iconName: 'Music', 
    color: 'text-fuchsia-500', 
    bgColor: 'bg-fuchsia-500', 
    activities: ['Danse', 'Acrosport'] 
  },
  { 
    id: 'CA4', 
    label: 'Opposition', 
    shortLabel: 'Duel', 
    iconName: 'Swords', 
    color: 'text-orange-500', 
    bgColor: 'bg-orange-500', 
    activities: ['Badminton', 'Tennis de Table'] 
  },
  { 
    id: 'CA5', 
    label: 'Entretien', 
    shortLabel: 'Forme', 
    iconName: 'HeartPulse', 
    color: 'text-rose-500', 
    bgColor: 'bg-rose-500', 
    activities: ['Step', 'Yoga'] 
  }
];

// Mock Data Minimal
const MOCK_STUDENTS: Student[] = [
  { id: '1', lastName: 'DUPONT', firstName: 'Jean', gender: 'M', group: '2NDE 1' },
  { id: '2', lastName: 'MARTIN', firstName: 'Sophie', gender: 'F', group: '2NDE 1' },
];

export const useEPSKernel = (sessionId?: string) => {
  // --- CONFIGURATION DYNAMIQUE ---
  const [caDefinitions, setCaDefinitions] = useState<ActivityCategory[]>(() => {
    const saved = localStorage.getItem('eps_ca_definitions');
    return saved ? JSON.parse(saved) : INITIAL_CA_DEFINITIONS;
  });

  // Persistance
  useEffect(() => {
    localStorage.setItem('eps_ca_definitions', JSON.stringify(caDefinitions));
  }, [caDefinitions]);

  // --- STATE PRINCIPAL ---
  const [currentActivity, setCurrentActivity] = useState<string>(() => localStorage.getItem('eps_activity') || 'Demi-fond');
  const [activeTab, setActiveTab] = useState<ModuleTab>('DATA');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Données
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  
  // Session Actuelle
  const [currentSession, setCurrentSession] = useState<Session>({
    id: sessionId || 'default',
    activity: currentActivity,
    ca: 'CA1',
    group: '2NDE 1',
    date: new Date().toISOString(),
    status: 'PLANNING',
    timeline: [],
    variables: { simplify: '', complexify: '' },
    safetyAlert: '',
    materials: '',
    showSessionToStudents: false,
    showObservationToStudents: false
  });

  // --- VALEURS CALCULÉES ---
  const currentCA = useMemo(() => {
    return caDefinitions.find(ca => ca.activities.includes(currentActivity)) || caDefinitions[0];
  }, [currentActivity, caDefinitions]);

  const filteredStudents = useMemo(() => {
    if (!currentSession.group) return students;
    return students.filter(s => s.group === currentSession.group);
  }, [students, currentSession.group]);

  const availableGroups = useMemo(() => Array.from(new Set(students.map(s => s.group))), [students]);

  // Sync Activity to Session
  useEffect(() => {
      setCurrentSession(prev => ({ ...prev, activity: currentActivity, ca: currentCA.id }));
  }, [currentActivity, currentCA]);

  // --- ACTIONS ---
  const selectActivity = (activity: string) => {
    setCurrentActivity(activity);
    localStorage.setItem('eps_activity', activity);
    setActiveTab('DATA');
  };

  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);

  const addObservation = (obs: Omit<Observation, 'id' | 'timestamp'>) => {
      const newObs = { ...obs, id: crypto.randomUUID(), timestamp: Date.now() };
      setObservations(prev => [...prev, newObs]);
  };
  
  const updateSession = (patch: Partial<Session>) => setCurrentSession(prev => ({ ...prev, ...patch }));
  const importStudents = (list: Student[]) => setStudents(list);
  const updateCriteria = (list: Criterion[]) => setCriteria(list);
  
  // --- GESTION DES ACTIVITÉS (CRUD) ---
  
  const addActivity = (caId: CAType, activityName: string) => {
      if (!activityName.trim()) return;
      setCaDefinitions(prev => prev.map(ca => {
          if (ca.id === caId && !ca.activities.includes(activityName)) {
              return { ...ca, activities: [...ca.activities, activityName] };
          }
          return ca;
      }));
  };

  const deleteActivity = (caId: CAType, activityName: string) => {
      setCaDefinitions(prev => prev.map(ca => {
          if (ca.id === caId) {
              return { ...ca, activities: ca.activities.filter(a => a !== activityName) };
          }
          return ca;
      }));
      // Si on supprime l'activité courante, on bascule sur la première dispo
      if (currentActivity === activityName) {
          const ca = caDefinitions.find(c => c.id === caId);
          const remaining = ca?.activities.filter(a => a !== activityName) || [];
          if (remaining.length > 0) selectActivity(remaining[0]);
          else selectActivity(caDefinitions[0].activities[0]);
      }
  };

  const renameActivity = (caId: CAType, oldName: string, newName: string) => {
      if (!newName.trim()) return;
      setCaDefinitions(prev => prev.map(ca => {
          if (ca.id === caId) {
              return { ...ca, activities: ca.activities.map(a => a === oldName ? newName : a) };
          }
          return ca;
      }));
      if (currentActivity === oldName) selectActivity(newName);
  };

  return {
    // État Global
    caDefinitions,
    currentActivity,
    currentCA,
    activeTab,
    isSidebarCollapsed,
    
    // Données
    students,
    filteredStudents,
    availableGroups,
    currentSession,
    observations,
    criteria,
    stats: {}, // Placeholder
    
    // Actions UI
    setTab: setActiveTab,
    selectActivity,
    toggleSidebar,
    
    // Actions Données
    addObservation,
    updateSession,
    importStudents,
    updateCriteria,
    applyCAPreset: (id: string) => console.log('preset', id),
    
    // Actions Admin
    addActivity,
    deleteActivity,
    renameActivity,
    
    // Compatibilité
    caList: caDefinitions,
    addSport: () => {},
    removeSport: () => {}
  };
};
