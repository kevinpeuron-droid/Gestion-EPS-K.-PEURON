import { useState, useMemo, useEffect } from 'react';
import { ActivityCategory, ModuleTab, Student, Session, Observation, Criterion, CAType, EngineId, AppDefinition } from '../types';

// --- CONFIGURATION INITIALE STANDARD ---
const INITIAL_CA_DEFINITIONS: ActivityCategory[] = [
  { 
    id: 'CA1', 
    label: 'CA1', 
    description: 'Performance',
    shortLabel: 'Perf', 
    iconName: 'Timer', 
    color: 'text-cyan-500', 
    bgColor: 'bg-cyan-500', 
    activities: ['Demi-fond', 'Natation', 'Vitesse'] 
  },
  { 
    id: 'CA2', 
    label: 'CA2', 
    description: 'Adaptation',
    shortLabel: 'Nature', 
    iconName: 'Compass', 
    color: 'text-emerald-500', 
    bgColor: 'bg-emerald-500', 
    activities: ['Course Orientation', 'Escalade'] 
  },
  { 
    id: 'CA3', 
    label: 'CA3', 
    description: 'Artistique',
    shortLabel: 'Arts', 
    iconName: 'Music', 
    color: 'text-fuchsia-500', 
    bgColor: 'bg-fuchsia-500', 
    activities: ['Danse', 'Acrosport'] 
  },
  { 
    id: 'CA4', 
    label: 'CA4', 
    description: 'Opposition',
    shortLabel: 'Duel', 
    iconName: 'Swords', 
    color: 'text-orange-500', 
    bgColor: 'bg-orange-500', 
    activities: ['Badminton', 'Tennis de Table'] 
  },
  { 
    id: 'CA5', 
    label: 'CA5', 
    description: 'Entretien',
    shortLabel: 'Forme', 
    iconName: 'HeartPulse', 
    color: 'text-rose-500', 
    bgColor: 'bg-rose-500', 
    activities: ['Step', 'Yoga'] 
  }
];

const INITIAL_APPS: AppDefinition[] = [
  { 
    id: 'STANDARD', 
    name: 'Fiche Standard', 
    description: 'Observation par critères, compteurs et notes.',
    componentKey: 'STANDARD', 
    isSystem: true,
    icon: 'Layout',
    color: 'text-slate-600'
  },
  { 
    id: 'CHRONO_PLIJADOUR', 
    name: 'Chrono Plijadour', 
    description: 'Module expert Natation & Vitesse (Chrono multi-lignes).',
    componentKey: 'CHRONO_PLIJADOUR', 
    isSystem: true,
    icon: 'Cpu',
    color: 'text-cyan-600'
  },
  { 
    id: 'MINGUEN', 
    name: 'Minguen Orientation', 
    description: 'Suivi de balises, poinçonnage et cartographie.',
    componentKey: 'MINGUEN', 
    isSystem: true,
    icon: 'Compass',
    color: 'text-emerald-600'
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
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0 && !parsed[0].description) return INITIAL_CA_DEFINITIONS;
      return parsed;
    }
    return INITIAL_CA_DEFINITIONS;
  });

  // Registre des Apps (Logiciels disponibles)
  const [registeredApps, setRegisteredApps] = useState<AppDefinition[]>(() => {
    const saved = localStorage.getItem('eps_registered_apps');
    return saved ? JSON.parse(saved) : INITIAL_APPS;
  });

  // Registre des Moteurs (Lien Activité -> App ID)
  const [engineRegistry, setEngineRegistry] = useState<Record<string, EngineId>>(() => {
    const saved = localStorage.getItem('eps_engine_registry');
    return saved ? JSON.parse(saved) : {};
  });

  // Persistance
  useEffect(() => {
    localStorage.setItem('eps_ca_definitions', JSON.stringify(caDefinitions));
  }, [caDefinitions]);

  useEffect(() => {
    localStorage.setItem('eps_registered_apps', JSON.stringify(registeredApps));
  }, [registeredApps]);

  useEffect(() => {
    localStorage.setItem('eps_engine_registry', JSON.stringify(engineRegistry));
  }, [engineRegistry]);

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

  // Récupère l'AppDefinition complète en fonction de l'activité courante
  const currentApp = useMemo(() => {
    const appId = engineRegistry[currentActivity] || 'STANDARD';
    return registeredApps.find(app => app.id === appId) || registeredApps[0];
  }, [currentActivity, engineRegistry, registeredApps]);

  // Pour la compatibilité avec CAModule (qui attend juste l'ID ou le componentKey)
  const currentEngineId = useMemo(() => currentApp.componentKey, [currentApp]);

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
      if (currentActivity === activityName) {
          const ca = caDefinitions.find(c => c.id === caId);
          const remaining = ca?.activities.filter(a => a !== activityName) || [];
          if (remaining.length > 0) selectActivity(remaining[0]);
          else selectActivity(caDefinitions[0].activities[0]);
      }
      // Clean registry
      const newRegistry = { ...engineRegistry };
      delete newRegistry[activityName];
      setEngineRegistry(newRegistry);
  };

  const renameActivity = (caId: CAType, oldName: string, newName: string) => {
      if (!newName.trim()) return;
      setCaDefinitions(prev => prev.map(ca => {
          if (ca.id === caId) {
              return { ...ca, activities: ca.activities.map(a => a === oldName ? newName : a) };
          }
          return ca;
      }));
      
      const newRegistry = { ...engineRegistry };
      if (newRegistry[oldName]) {
        newRegistry[newName] = newRegistry[oldName];
        delete newRegistry[oldName];
        setEngineRegistry(newRegistry);
      }

      if (currentActivity === oldName) selectActivity(newName);
  };

  const setActivityEngine = (activityName: string, engineId: EngineId) => {
    setEngineRegistry(prev => ({ ...prev, [activityName]: engineId }));
  };

  // --- GESTION DES APPS (LOGICIELS) ---

  const registerApp = (name: string, componentKey: AppDefinition['componentKey']) => {
    const newApp: AppDefinition = {
      id: `CUSTOM_${Date.now()}`,
      name,
      description: `Alias personnalisé basé sur ${componentKey}`,
      componentKey,
      isSystem: false,
      icon: 'Box',
      color: 'text-indigo-600'
    };
    setRegisteredApps(prev => [...prev, newApp]);
  };

  const deleteApp = (appId: string) => {
    setRegisteredApps(prev => prev.filter(app => app.id !== appId || app.isSystem)); // Protect system apps
    // Reset any activity using this app to STANDARD
    const newRegistry = { ...engineRegistry };
    let changed = false;
    Object.keys(newRegistry).forEach(act => {
      if (newRegistry[act] === appId) {
        newRegistry[act] = 'STANDARD';
        changed = true;
      }
    });
    if(changed) setEngineRegistry(newRegistry);
  };

  return {
    // État Global
    caDefinitions,
    currentActivity,
    currentCA,
    currentEngineId,
    currentApp,
    activeTab,
    isSidebarCollapsed,
    engineRegistry,
    registeredApps,
    
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
    setActivityEngine,
    registerApp,
    deleteApp,
    
    // Compatibilité
    caList: caDefinitions,
    addSport: () => {},
    removeSport: () => {}
  };
};
