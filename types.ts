
export type RoleType = 'KLP' | 'FLP' | 'SHP' | 'DaZ';

export type WorkField = 'Unterricht und Klasse' | 'Lernende und Schulpartner' | 'Schule' | 'Lehrperson' | 'Alle';

export type Municipality = 'Glarus' | 'Glarus Nord' | 'Glarus Süd';

export type InputUnit = 'Stunden' | 'Lektionen';

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
  inputUnit?: InputUnit; // Default is 'Stunden' if undefined
}

export interface SpecialFunctionConfig {
  hours: number;
  meta?: {
    isSingleClass?: boolean; // Specific for SHP/DaZ
    [key: string]: any;
  };
}

export interface CustomFunction {
  id: string;
  name: string;
  value: number;
  unit: InputUnit;
  workField: WorkField;
}

export interface TeacherData {
  municipality: Municipality;
  lastName: string;
  firstName: string;
  birthYear: number;
  role: RoleType;
  teachingLessons: number;
  activeSpecialFunctions: string[]; // IDs of selected functions
  functionConfig: Record<string, SpecialFunctionConfig>; // Store individual hours/settings per function ID
  customFunctions: CustomFunction[]; // User defined free-text functions
  manualCorrections: Record<string, number>; // Key: Category Name, Value: +/- Hours
  remarks: string;
}

export interface SavedAgreement {
  id: string;
  folderId: string;
  lastModified: number;
  data: TeacherData;
  // Cached values for dashboard performance
  cachedPensumPercentage: number;
  cachedTotalHours: number;
  cachedTotalLessons: number;
}

export interface Folder {
  id: string;
  name: string;
}

export interface DistributionCategory {
  name: string;
  hours: number; // Total hours including base + functions + corrections
  color: string;
  correction?: number; // Sum of special functions hours + manual corrections
  manualCorrectionOnly?: number; // Only the manual part for display
}