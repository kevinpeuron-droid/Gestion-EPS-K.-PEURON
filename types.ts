
// --- NAVIGATION & STRUCTURE ---

export type ModuleTab = 'DATA' | 'CONFIG' | 'SESSION' | 'APP';

export type CAType = 'CA1' | 'CA2' | 'CA3' | 'CA4' | 'CA5';

export type EngineId = string; // Devenu dynamique (ex: 'STANDARD', 'CHRONO_PLIJADOUR', 'CUSTOM_123')

export interface AppDefinition {
  id: string;
  name: string;
  description: string;
  componentKey: 'STANDARD' | 'CHRONO_PLIJADOUR' | 'MINGUEN'; // Le moteur technique sous-jacent
  isSystem: boolean; // Si true, impossible à supprimer
  icon: string; // Nom de l'icône Lucide
  color: string; // Tailwind color class
}

export interface ActivityCategory {
  id: CAType;
  label: string;       // Ex: "CA1"
  description: string; // Ex: "Performance"
  shortLabel: string;  // Ex: "Perf"
  iconName: string;    // Lucide icon name
  color: string;       // Text color class
  bgColor: string;     // Background/Accent color class
  activities: string[];
}

export interface ActivityConfig {
  sessionLink?: string;     // URL vers la fiche de séance (PDF, Doc, Drive)
  observationLink?: string; // URL vers la fiche d'observation (Sheet, Form, PDF)
}

// --- SHARE BRIDGE (NOUVEAU) ---

export type ShareType = 'APP' | 'SESSION_DOC' | 'OBSERVATION_DOC' | 'WAITING';

export interface SharedResource {
  type: ShareType;
  activityName: string;
  engineId?: string; // Si type === 'APP'
  url?: string;      // Si type === 'SESSION_DOC' ou 'OBSERVATION_DOC'
  timestamp: number; // Pour forcer le refresh
}

// --- DATA BRIDGE ---

// Structure générique renvoyée par les moteurs
export interface ActivityResult {
  id: string;          // UUID du résultat
  studentId: string;   // Lien élève
  studentName: string; // Snapshot du nom (si ID perdu)
  activityId: string;  // Sport concerné
  engineId: string;    // Moteur ayant généré la donnée
  date: string;        // ISO Date
  data: Record<string, any>; // Payload flexible (ex: { bestTime: 45000, avg: 47000, nbReps: 4 })
}

// État minimal du Kernel
export interface KernelState {
  currentActivity: string;
  currentCA: ActivityCategory;
  activeTab: ModuleTab;
  isSidebarCollapsed: boolean;
}

// --- APP VIEWS ---

export type ViewState = 'DASHBOARD' | 'CLASSES' | 'SESSION_PLANNER' | 'SETTINGS';

// --- DOMAIN ENTITIES ---

export interface Student {
  id: string;
  lastName: string;
  firstName: string;
  gender: 'M' | 'F';
  group: string; // Classe (ex: 2NDE 1)
}

// Mapping pour l'import CSV
export interface CSVMapping {
  lastNameIndex: number;
  firstNameIndex: number;
  genderIndex: number;
  groupIndex: number;
}

export type UIMode = 'BINARY' | 'MULTI_CHOICE' | 'STEPPER' | 'CHRONO' | 'SCALE_GRADIENT' | 'RATING';

export interface CriterionConfig {
  unit?: string;
  options?: { label: string; value: string; color?: string }[];
  min?: number;
  max?: number;
  isBlocking?: boolean;
  [key: string]: any;
}

export interface Criterion {
  id: string;
  label: string;
  type: 'SIMPLE' | 'COMPLEX';
  uiMode: UIMode;
  config: CriterionConfig;
}

export interface SessionSequence {
  id: string;
  title: string;
  durationMin: number;
  type: 'ECHAUFFEMENT' | 'CORPS' | 'CALME';
}

export interface SessionVariables {
  simplify: string;
  complexify: string;
}

export interface Session {
  id: string;
  activity: string;
  ca: string;
  group: string;
  date: string;
  status: 'PLANNING' | 'ACTIVE' | 'ARCHIVED';
  timeline: SessionSequence[];
  variables: SessionVariables;
  safetyAlert: string;
  materials: string;
  showSessionToStudents: boolean;
  showObservationToStudents: boolean;
}

export interface Observation {
  id: string;
  sessionId: string;
  studentId: string;
  variableName?: string;
  criteriaId?: string;
  value?: any;
  isSuccess?: boolean;
  authorRole: 'PROF' | 'ELEVE';
  timestamp: number;
  type?: string;
}

export interface CriteriaStat {
  attempts: number;
  success: number;
  rate: number;
}

export interface StudentStats {
  weightedAverage: number;
  totalObservations: number;
  reliabilityIndex: number;
  criteriaStats: Record<string, CriteriaStat>;
}