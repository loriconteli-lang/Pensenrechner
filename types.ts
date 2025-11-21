export type RoleType = 'KLP' | 'FLP' | 'SHP';

export type WorkField = 'Unterricht und Klasse' | 'Lernende und Schulpartner' | 'Schule' | 'Lehrperson' | 'Alle';

export type Municipality = 'Glarus' | 'Glarus Nord' | 'Glarus Süd';

export interface GlobalSettings {
  annualHours: number;
  baseLessons: {
    [key in RoleType]: number;
  };
}

export interface SpecialFunction {
  id: string;
  name: string;
  reliefLessons: number;
  hours: number;
  workField: WorkField;
  allowedRoles: RoleType | 'Alle';
  isStandard?: boolean; 
}

export interface SpecialFunctionConfig {
  hours: number;
  meta?: {
    isSingleClass?: boolean; // Specific for SHP
    [key: string]: any;
  };
}

export interface TeacherData {
  municipality: Municipality;
  lastName: string;
  firstName: string;
  role: RoleType;
  teachingLessons: number;
  activeSpecialFunctions: string[]; // IDs of selected functions
  functionConfig: Record<string, SpecialFunctionConfig>; // Store individual hours/settings per function ID
  manualCorrections: Record<string, number>; // Key: Category Name, Value: +/- Hours
  remarks: string;
}

export interface DistributionCategory {
  name: string;
  hours: number; // Total hours including base + functions + corrections
  color: string;
  correction?: number; // Sum of special functions hours + manual corrections
  manualCorrectionOnly?: number; // Only the manual part for display
}