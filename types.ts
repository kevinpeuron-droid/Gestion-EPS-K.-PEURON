
// --- NAVIGATION & STRUCTURE ---

export type ModuleTab = 'DATA' | 'CONFIG' | 'SESSION';

export type CAType = 'CA1' | 'CA2' | 'CA3' | 'CA4' | 'CA5';

export interface ActivityCategory {
  id: CAType;
  label: string;
  shortLabel: string;
  iconName: string; // Lucide icon name
  color: string;    // Text color class
  bgColor: string;  // Background/Accent color class
  activities: string[];
}

// État minimal du Kernel
export interface KernelState {
  currentActivity: string;
  currentCA: ActivityCategory;
  activeTab: ModuleTab;
  isSidebarCollapsed: boolean;
}

// --- APP VIEWS ---

export type ViewState = 'DASHBOARD' | 'CLASSES' | 'SESSION_PLANNER' | 'STUDENT_MODE' | 'TEACHER_MOBILE' | 'SETTINGS';

// --- DOMAIN ENTITIES ---

export interface Student {
  id: string;
  lastName: string;
  firstName: string;
  gender: 'M' | 'F';
  group: string;
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
