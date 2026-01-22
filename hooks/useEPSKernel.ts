
import { useState, useMemo, useEffect, useCallback } from 'react';
import { ActivityCategory, ModuleTab, Student, Session, Observation, Criterion, CAType, EngineId, AppDefinition, ActivityResult, ActivityConfig, SharedResource, SessionContent } from '../types';

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

const MOCK_STUDENTS: Student[] = [
  { id: '1', lastName: 'DUPONT', firstName: 'Jean', gender: 'M', group: '2NDE 1' },
  { id: '2', lastName: 'MARTIN', firstName: 'Sophie', gender: 'F', group: '2NDE 1' },
];

export const useEPSKernel = (sessionId?: string) => {
  // --- SESSION KEY (Reset) ---
  const [sessionKey, setSessionKey] = useState<number>(Date.now());

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

  const [registeredApps, setRegisteredApps] = useState<AppDefinition[]>(() => {
    const saved = localStorage.getItem('eps_registered_apps');
    let loaded = saved ? JSON.parse(saved) : INITIAL_APPS;
    if (!Array.isArray(loaded) || loaded.length === 0) {
      loaded = INITIAL_APPS;
    }
    return loaded;
  });

  const [engineRegistry, setEngineRegistry] = useState<Record<string, EngineId>>(() => {
    const saved = localStorage.getItem('eps_engine_registry');
    return saved ? JSON.parse(saved) : {};
  });

  const [activityConfigRegistry, setActivityConfigRegistry] = useState<Record<string, ActivityConfig>>(() => {
    const saved = localStorage.getItem('eps_activity_config');
    return saved ? JSON.parse(saved) : {};
  });

  // --- REGISTRES DONNÉES INTERNES ---
  
  // 1. CRITÈRES D'OBSERVATION (observationGrids)
  const [criteriaRegistry, setCriteriaRegistry] = useState<Record<string, Criterion[]>>(() => {
    const saved = localStorage.getItem('eps_criteria_registry');
    return saved ? JSON.parse(saved) : {};
  });

  // 2. CONTENU DE SÉANCE (sessionContents)
  const [sessionContentRegistry, setSessionContentRegistry] = useState<Record<string, SessionContent>>(() => {
    const saved = localStorage.getItem('eps_session_contents');
    return saved ? JSON.parse(saved) : {};
  });

  // 3. META-DONNÉES SÉANCE (Timeline, Variables, etc.)
  const [sessionRegistry, setSessionRegistry] = useState<Record<string, Partial<Session>>>(() => {
    const saved = localStorage.getItem('eps_session_registry');
    return saved ? JSON.parse(saved) : {};
  });

  // --- ACTIVITY RESULTS ---
  const [activityResults, setActivityResults] = useState<ActivityResult[]>(() => {
    const saved = localStorage.getItem('eps_activity_results');
    return saved ? JSON.parse(saved) : [];
  });

  // --- SHARED RESOURCE (SYNC) ---
  const [sharedResource, setSharedResourceState] = useState<SharedResource | null>(() => {
    const saved = localStorage.getItem('eps_shared_resource');
    return saved ? JSON.parse(saved) : null;
  });

  // Listener pour la synchronisation entre onglets (Prof -> Élève)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'eps_shared_resource') {
        const newValue = e.newValue ? JSON.parse(e.newValue) : null;
        setSharedResourceState(newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const setSharedResource = (resource: SharedResource) => {
    setSharedResourceState(resource);
    localStorage.setItem('eps_shared_resource', JSON.stringify(resource));
  };

  // --- STATE PRINCIPAL ---
  const [currentActivity, setCurrentActivity] = useState<string>(() => localStorage.getItem('eps_activity') || 'Demi-fond');
  const [activeTab, setActiveTab] = useState<ModuleTab>('DATA');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const [students, setStudents] = useState<Student[]>(() => {
      const saved = localStorage.getItem('eps_students');
      return saved ? JSON.parse(saved) : MOCK_STUDENTS;
  });

  const [observations, setObservations] = useState<Observation[]>([]);
  
  // États dérivés courants (chargés via loadActivityContext)
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [currentSession, setCurrentSession] = useState<Session>({
    id: sessionId || 'default',
    activity: currentActivity,
    ca: 'CA1',
    group: students.length > 0 ? students[0].group : '2NDE 1',
    date: new Date().toISOString(),
    status: 'PLANNING',
    timeline: [],
    variables: { simplify: '', complexify: '' },
    safetyAlert: '',
    materials: '',
    showSessionToStudents: false,
    showObservationToStudents: false
  });

  const [currentSessionContent, setCurrentSessionContent] = useState<SessionContent>({
    objectives: '', warmUp: '', situations: '', assessment: ''
  });

  // --- PERSISTANCE EFFETS ---
  useEffect(() => { localStorage.setItem('eps_ca_definitions', JSON.stringify(caDefinitions)); }, [caDefinitions]);
  useEffect(() => { localStorage.setItem('eps_registered_apps', JSON.stringify(registeredApps)); }, [registeredApps]);
  useEffect(() => { localStorage.setItem('eps_engine_registry', JSON.stringify(engineRegistry)); }, [engineRegistry]);
  useEffect(() => { localStorage.setItem('eps_activity_config', JSON.stringify(activityConfigRegistry)); }, [activityConfigRegistry]);
  useEffect(() => { localStorage.setItem('eps_activity_results', JSON.stringify(activityResults)); }, [activityResults]);
  useEffect(() => { localStorage.setItem('eps_students', JSON.stringify(students)); }, [students]);
  useEffect(() => { localStorage.setItem('eps_criteria_registry', JSON.stringify(criteriaRegistry)); }, [criteriaRegistry]);
  useEffect(() => { localStorage.setItem('eps_session_contents', JSON.stringify(sessionContentRegistry)); }, [sessionContentRegistry]);
  useEffect(() => { localStorage.setItem('eps_session_registry', JSON.stringify(sessionRegistry)); }, [sessionRegistry]);


  // --- VALEURS CALCULÉES ---
  const currentCA = useMemo(() => {
    return caDefinitions.find(ca => ca.activities.includes(currentActivity)) || caDefinitions[0];
  }, [currentActivity, caDefinitions]);

  const currentApp = useMemo(() => {
    const appId = engineRegistry[currentActivity] || 'STANDARD';
    return registeredApps.find(app => app.id === appId) || registeredApps[0] || INITIAL_APPS[0];
  }, [currentActivity, engineRegistry, registeredApps]);

  const currentEngineId = useMemo(() => currentApp?.componentKey || 'STANDARD', [currentApp]);
  
  const currentActivityConfig = useMemo(() => {
      return activityConfigRegistry[currentActivity] || {};
  }, [currentActivity, activityConfigRegistry]);

  const filteredStudents = useMemo(() => {
    if (!currentSession.group) return students;
    return students.filter(s => s.group === currentSession.group);
  }, [students, currentSession.group]);

  const availableGroups = useMemo(() => Array.from(new Set(students.map(s => s.group))).sort(), [students]);

  // --- ACTIONS CRITIQUES ---

  const loadActivityContext = useCallback((activity: string, caId: CAType) => {
      // 1. Charger les critères (INTERNE)
      const savedCriteria = criteriaRegistry[activity] || [];
      setCriteria(savedCriteria);

      // 2. Charger le contenu textuel de séance (INTERNE)
      const savedContent = sessionContentRegistry[activity] || {
        objectives: '', warmUp: '', situations: '', assessment: ''
      };
      setCurrentSessionContent(savedContent);

      // 3. Charger les méta-données de session (groupes, options)
      const savedSessionPartial = sessionRegistry[activity] || {};
      
      setCurrentSession(prev => ({
          ...prev,
          activity: activity,
          ca: caId,
          timeline: savedSessionPartial.timeline || [],
          variables: savedSessionPartial.variables || { simplify: '', complexify: '' },
          safetyAlert: savedSessionPartial.safetyAlert || '',
          materials: savedSessionPartial.materials || '',
          showSessionToStudents: savedSessionPartial.showSessionToStudents || false,
          showObservationToStudents: savedSessionPartial.showObservationToStudents || false
      }));
  }, [criteriaRegistry, sessionRegistry, sessionContentRegistry]);

  // Initial load
  useEffect(() => {
     loadActivityContext(currentActivity, currentCA.id);
  }, []); 

  const selectActivity = (activity: string) => {
    const foundCA = caDefinitions.find(ca => ca.activities.includes(activity)) || caDefinitions[0];
    setCurrentActivity(activity);
    localStorage.setItem('eps_activity', activity);
    setActiveTab('DATA');
    loadActivityContext(activity, foundCA.id);
  };

  const updateSession = (patch: Partial<Session>) => {
      setCurrentSession(prev => {
          const updated = { ...prev, ...patch };
          setSessionRegistry(reg => ({
              ...reg,
              [prev.activity]: {
                  timeline: updated.timeline,
                  variables: updated.variables,
                  safetyAlert: updated.safetyAlert,
                  materials: updated.materials,
                  showSessionToStudents: updated.showSessionToStudents,
                  showObservationToStudents: updated.showObservationToStudents
              }
          }));
          return updated;
      });
  };

  // --- HELPERS INTERNES ---

  const addCriterion = (activityId: string, criterion: Criterion) => {
    const currentList = criteriaRegistry[activityId] || [];
    updateObservationGrid(activityId, [...currentList, criterion]);
  };
  
  const updateObservationGrid = (activityId: string, list: Criterion[]) => {
      setCriteria(list);
      setCriteriaRegistry(reg => ({
          ...reg,
          [activityId]: list
      }));
  };
  
  // Alias pour compatibilité UI
  const updateCriteria = (list: Criterion[]) => updateObservationGrid(currentActivity, list);

  const saveSession = (activityId: string, content: SessionContent) => {
    setCurrentSessionContent(content);
    setSessionContentRegistry(reg => ({
      ...reg,
      [activityId]: content
    }));
  };
  
  // Alias pour compatibilité UI
  const updateSessionContent = (activityId: string, content: SessionContent) => saveSession(activityId, content);

  const updateActivityConfig = (activityName: string, config: ActivityConfig) => {
      setActivityConfigRegistry(prev => ({
          ...prev,
          [activityName]: { ...(prev[activityName] || {}), ...config }
      }));
  };

  const mergeStudents = (newStudents: Student[]) => {
      setStudents(prev => {
          const merged = [...prev];
          let updatedCount = 0;
          let addedCount = 0;

          newStudents.forEach(newS => {
              const existingIndex = merged.findIndex(s => 
                  s.lastName.toLowerCase() === newS.lastName.toLowerCase() &&
                  s.firstName.toLowerCase() === newS.firstName.toLowerCase() &&
                  s.group === newS.group
              );

              if (existingIndex >= 0) {
                  merged[existingIndex] = { ...newS, id: merged[existingIndex].id };
                  updatedCount++;
              } else {
                  merged.push(newS);
                  addedCount++;
              }
          });
          alert(`${addedCount} élèves ajoutés, ${updatedCount} mis à jour.`);
          return merged;
      });
  };

  const deleteStudent = (id: string) => {
    if(confirm("Supprimer cet élève ?")) setStudents(prev => prev.filter(s => s.id !== id));
  };

  const clearAllStudents = () => {
    if(confirm("ATTENTION : Cela va supprimer TOUS les élèves de la base. Confirmer ?")) setStudents([]);
  };

  const startNewSession = () => {
    if (window.confirm("Voulez-vous vraiment démarrer une nouvelle séance ?")) {
      setObservations([]);
      setSessionKey(Date.now());
    }
  };

  const addObservation = (obs: Omit<Observation, 'id' | 'timestamp'>) => {
      const newObs = { ...obs, id: crypto.randomUUID(), timestamp: Date.now() };
      setObservations(prev => [...prev, newObs]);
  };
  
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
          selectActivity(caDefinitions[0].activities[0]);
      }
      const newRegistry = { ...engineRegistry };
      delete newRegistry[activityName];
      setEngineRegistry(newRegistry);
      
      const newConfigRegistry = { ...activityConfigRegistry };
      delete newConfigRegistry[activityName];
      setActivityConfigRegistry(newConfigRegistry);
  };

  const renameActivity = (caId: CAType, oldName: string, newName: string) => {
      if (!newName.trim()) return;
      setCaDefinitions(prev => prev.map(ca => {
          if (ca.id === caId) {
              return { ...ca, activities: ca.activities.map(a => a === oldName ? newName : a) };
          }
          return ca;
      }));
      // Migrate Registries
      const registriesToMigrate = [
          { get: engineRegistry, set: setEngineRegistry },
          { get: activityConfigRegistry, set: setActivityConfigRegistry },
          { get: criteriaRegistry, set: setCriteriaRegistry },
          { get: sessionRegistry, set: setSessionRegistry },
          { get: sessionContentRegistry, set: setSessionContentRegistry }
      ];

      registriesToMigrate.forEach(({ get, set }) => {
          if (get[oldName]) {
              set((prev: any) => {
                  const next = { ...prev, [newName]: prev[oldName] };
                  delete next[oldName];
                  return next;
              });
          }
      });
      
      if (currentActivity === oldName) selectActivity(newName);
  };

  const setActivityEngine = (activityName: string, engineId: EngineId) => {
    setEngineRegistry(prev => ({ ...prev, [activityName]: engineId }));
  };

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
    setRegisteredApps(prev => prev.filter(app => app.id !== appId || app.isSystem));
  };

  const saveResult = (payload: Omit<ActivityResult, 'id' | 'date'>) => {
      setActivityResults(prev => {
          const today = new Date().toISOString().split('T')[0];
          const existingIndex = prev.findIndex(r => 
              r.studentId === payload.studentId && 
              r.activityId === payload.activityId &&
              r.date.startsWith(today)
          );
          const newResult: ActivityResult = {
              id: existingIndex >= 0 ? prev[existingIndex].id : crypto.randomUUID(),
              date: existingIndex >= 0 ? prev[existingIndex].date : new Date().toISOString(),
              ...payload
          };
          if (existingIndex >= 0) {
              const newResults = [...prev];
              newResults[existingIndex] = newResult;
              return newResults;
          } else {
              return [...prev, newResult];
          }
      });
  };

  const getSynthesis = () => {
    const currentActivityResults = activityResults.filter(r => r.activityId === currentActivity);
    currentActivityResults.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return currentActivityResults;
  };

  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);

  return {
    sessionKey,
    caDefinitions,
    currentActivity,
    currentActivityConfig,
    currentCA,
    currentEngineId,
    currentApp,
    activeTab,
    isSidebarCollapsed,
    engineRegistry,
    registeredApps,
    activityResults,
    students,
    filteredStudents,
    availableGroups,
    currentSession,
    currentSessionContent, 
    observations,
    criteria,
    sharedResource, 
    setTab: setActiveTab,
    selectActivity,
    toggleSidebar,
    startNewSession,
    addObservation,
    updateSession,
    importStudents: mergeStudents,
    deleteStudent,
    clearAllStudents,
    updateCriteria,
    updateObservationGrid,
    updateSessionContent,
    saveSession, // Exported
    addCriterion, // Exported
    updateActivityConfig,
    applyCAPreset: (id: string) => console.log('preset', id),
    addActivity,
    deleteActivity,
    renameActivity,
    setActivityEngine,
    registerApp,
    deleteApp,
    saveResult,
    getSynthesis,
    setSharedResource, 
    caList: caDefinitions,
    addSport: () => {},
    removeSport: () => {}
  };
};
