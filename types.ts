export type UserRole = 'PROF' | 'ELEVE';
export type ViewState = 'DASHBOARD' | 'CLASSES' | 'OBSERVATION_SETUP' | 'SESSION_PLANNER' | 'STUDENT_MODE' | 'TEACHER_MOBILE';

// --- RICH UI MODES ---
export type UIMode = 
  | 'BINARY'          // Oui/Non
  | 'MULTI_CHOICE'    // Liste d'options
  | 'STEPPER'         // Compteur + / -
  | 'CHRONO'          // Chronomètre
  | 'TIMER_HOLD'      // Appui long
  | 'SCALE_GRADIENT'  // Echelle 1-4
  | 'HEATMAP_ZONE';   // Zones terrain

export interface CriterionConfig {
  options?: { label: string; value: any; color?: string }[];
  targetValue?: number;
  isBlocking?: boolean;
  unit?: string;
  min?: number;
  max?: number;
}

export interface Criterion {
  id: string;
  label: string;
  type: 'BOOLEAN' | 'COUNTER' | 'RATING' | 'TIME' | 'COMPLEX'; 
  uiMode: UIMode;
  config: CriterionConfig;
}

// --- CORE ENTITIES ---

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  group: string;
  gender: 'M' | 'F';
}

export type CAType = 'CA1' | 'CA2' | 'CA3' | 'CA4' | 'CA5';

export interface ActivityCategory {
  id: CAType;
  label: string;
  shortLabel: string;
  iconName: string; 
  color: string;
  bgColor: string;
  activities: string[];
}

// --- SESSION TYPES ---

export interface SessionSequence {
  id: string;
  title: string;
  durationMin: number;
  type: 'ECHAUFFEMENT' | 'CORPS' | 'CALME';
}

export interface Session {
  id: string;
  date: string;
  activity: string;
  ca: CAType;
  group: string;
  
  // Visibility - MANDATORY
  showSessionToStudents: boolean;
  showObservationToStudents: boolean;
  
  // Didactic - MANDATORY
  variables: { simplify: string; complexify: string };
  
  // Logistical - MANDATORY
  materials: string;
  safetyAlert: string;
  
  // Temporal - MANDATORY ARRAY
  timeline: SessionSequence[];
}

// --- OBSERVATION & DATA TYPES ---

export type ObservationValue = 
  | { type: 'BOOLEAN'; value: boolean }
  | { type: 'COUNTER'; value: number }
  | { type: 'TIME'; value: number }
  | { type: 'RATING'; value: number }
  | { type: 'STRING'; value: string }
  | { type: 'COORDINATE'; x: number; y: number };

export interface Observation {
  id: string;
  sessionId: string;
  studentId: string;
  variableName: string;
  value: ObservationValue;
  timestamp: number;
  authorRole: UserRole;
}

export interface StudentStats {
  studentId: string;
  stats: Record<string, number | string>;
  reliability: number;
}