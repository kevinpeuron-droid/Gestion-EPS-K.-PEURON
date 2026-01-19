import { useState, useMemo, useEffect } from 'react';
import { ActivityCategory, ModuleTab, Student, Session, Observation, Criterion, CAType, AppModuleType } from '../types';

// --- CONFIGURATION INITIALE (Fallback) ---
const INITIAL_CA_DEFINITIONS: ActivityCategory[] = [
  { 
    id: 'CA1', 
    label: 'Performance', 
    shortLabel: 'Perf', 
    iconName: 'Timer', 
    color: 'text-cyan-500', 
    bgColor: 'bg-cyan-500', 
    activities: ['Demi-fond', 'Natation', 'Vitesse', 'Musculation'] 
  },
  { 
    id: 'CA2', 
    label: 'Adaptation', 
    shortLabel: 'Nature', 
    iconName: 'Compass', 
    color: 'text-emerald-500', 
    bgColor: 'bg-emerald-500', 
    activities: ['Course Orientation', 'Escalade', 'Savoir Nager'] 
  },
  { 
    id: 'CA3', 
    label: 'Artistique', 
    shortLabel: 'Arts', 
    iconName: 'Music', 
    color: 'text-fuchsia-500', 
    bgColor: 'bg-fuchsia-500', 
    activities: ['Danse', 'Acrosport', 'Cirque'] 
  },
  { 
    id: 'CA4', 
    label: 'Opposition', 
    shortLabel: 'Duel', 
    iconName: 'Swords', 
    color: 'text-orange-500', 
    bgColor: 'bg-orange-500', 
    activities: ['Badminton', 'Tennis de Table', 'Volley-ball', 'Boxe'] 
  },
  { 
    id: 'CA5', 
    label: 'Entretien', 
    shortLabel: 'Forme', 
    iconName: 'HeartPulse', 
    color: 'text-rose-500', 
    bgColor: 'bg-rose-500', 
    activities: ['Step', 'Yoga', 'Course en Durée'] 
  }
];

// REGISTRE DES MOTEURS D'APPLICATION
// C'est ici qu'on définit quel sport utilise quelle interface
const INITIAL_MODULE_REGISTRY: Record<string, AppModuleType> = {
    'Natation': 'PLIJADOUR',
    'Demi-fond': 'PLIJADOUR',
    'Vitesse': 'PLIJADOUR',
    'Course Orientation': 'MINGUEN',
    // Les autres sports par défaut sont en 'STANDARD' implicitement
};

// Mock Data
const MOCK_STUDENTS: Student[] = [
  { id: '1', lastName: 'DUPONT', firstName: 'Jean', gender: 'M', group: '2NDE 1' },
  { id: '2', lastName: 'MARTIN', firstName: 'Sophie', gender: 'F', group: '2NDE 1' },
  { id: '3', lastName: 'DURAND', firstName: 'Paul', gender: 'M', group: '2NDE 2' },
  { id: '4', lastName: 'LEFEBVRE', firstName: 'Julie', gender: 'F', group: '2NDE 2' },
];

export const useEPSKernel = (sessionId?: string) => {
  // --- CONFIGURATION DYNAMIQUE ---
  const [caDefinitions, setCaDefinitions] = useState<ActivityCategory[]>(() => {
    const saved = localStorage.getItem('eps_ca_definitions');
    return saved ? JSON.parse(saved) : INITIAL_CA_DEFINITIONS;
  });

  // --- REGISTRE DES MODULES ---
  const [moduleRegistry, setModuleRegistry] = useState<Record<string, AppModuleType>>(() => {
      const saved = localStorage.getItem('eps_module_registry');
      return saved ? JSON.parse(saved) : INITIAL_MODULE_REGISTRY;
  });

  // Persistance
  useEffect(() => {
    localStorage.setItem('eps_ca_definitions', JSON.stringify(caDefinitions));
  }, [caDefinitions]);

  useEffect(() => {
      localStorage.setItem('eps_module_registry', JSON.stringify(moduleRegistry));
  }, [moduleRegistry]);

  // --- STATE PRINCIPAL ---
  const [currentActivity, setCurrentActivity] = useState<string>(() => localStorage.getItem('eps_activity') || 'Badminton');
  const [activeTab, setActiveTab] = useState<ModuleTab>('DATA');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Données Pédagogiques
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

  // DÉTECTION DU MOTEUR
  const currentModuleType = useMemo<AppModuleType>(() => {
      return moduleRegistry[currentActivity] || 'STANDARD';
  }, [currentActivity, moduleRegistry]);

  const filteredStudents = useMemo(() => {
    if (!currentSession.group) return students;
    return students.filter(s => s.group === currentSession.group);
  }, [students, currentSession.group]);

  const availableGroups = useMemo(() => Array.from(new Set(students.map(s => s.group))), [students]);

  // Synchronisation Activité -> Session
  useEffect(() => {
      setCurrentSession(prev => ({ ...prev, activity: currentActivity, ca: currentCA.id }));
  }, [currentActivity, currentCA]);

  // --- ACTIONS ---
  const selectActivity = (activity: string) => {
    setCurrentActivity(activity);
    localStorage.setItem('eps_activity', activity);
    setActiveTab('DATA'); // Reset tab quand on change de sport
  };

  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);

  const addObservation = (obs: Omit<Observation, 'id' | 'timestamp'>) => {
      const newObs = { ...obs, id: crypto.randomUUID(), timestamp: Date.now() };
      setObservations(prev => [...prev, newObs]);
      console.log("Observation added:", newObs);
  };
  
  const updateSession = (patch: Partial<Session>) => setCurrentSession(prev => ({ ...prev, ...patch }));
  const importStudents = (list: Student[]) => setStudents(list);
  const updateCriteria = (list: Criterion[]) => setCriteria(list);
  
  // --- GESTION DES ACTIVITÉS & MOTEURS ---
  const addActivity = (caId: CAType, activityName: string) => {
      setCaDefinitions(prev => prev.map(ca => {
          if (ca.id === caId && !ca.activities.includes(activityName)) {
              return { ...ca, activities: [...ca.activities, activityName] };
          }
          return ca;
      }));
  };

  const renameActivity = (caId: CAType, oldName: string, newName: string) => {
      setCaDefinitions(prev => prev.map(ca => {
          if (ca.id === caId) {
              const newActivities = ca.activities.map(a => a === oldName ? newName : a);
              return { ...ca, activities: newActivities };
          }
          return ca;
      }));
      
      // Mettre à jour le registre si nécessaire
      if (moduleRegistry[oldName]) {
          const type = moduleRegistry[oldName];
          setModuleRegistry(prev => {
              const next = { ...prev, [newName]: type };
              delete next[oldName];
              return next;
          });
      }

      if (currentActivity === oldName) {
          selectActivity(newName);
      }
  };

  const deleteActivity = (caId: CAType, activityName: string) => {
      setCaDefinitions(prev => prev.map(ca => {
          if (ca.id === caId) {
              return { ...ca, activities: ca.activities.filter(a => a !== activityName) };
          }
          return ca;
      }));
  };

  // Lier un sport à un moteur spécifique
  const linkActivityToModule = (activityName: string, type: AppModuleType) => {
      setModuleRegistry(prev => ({ ...prev, [activityName]: type }));
  };

  return {
    // État Global
    caDefinitions,
    currentActivity,
    currentCA,
    currentModuleType, // STANDARD | PLIJADOUR | MINGUEN
    moduleRegistry,
    activeTab,
    isSidebarCollapsed,
    
    // Données
    students,
    filteredStudents,
    availableGroups,
    currentSession,
    observations,
    criteria,
    stats: {},
    
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
    
    // Actions Admin / Config
    addActivity,
    renameActivity,
    deleteActivity,
    linkActivityToModule,
    
    // Compatibilité
    caList: caDefinitions,
    addSport: () => {},
    removeSport: () => {}
  };
};
