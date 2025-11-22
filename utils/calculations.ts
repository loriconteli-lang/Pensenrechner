
import { TeacherData, GlobalSettings, SpecialFunction, DistributionCategory } from '../types';
import { DISTRIBUTION_SHARES } from '../constants';

export interface CalculatedData {
  distribution: DistributionCategory[];
  totalHours: number;
  pensumPercentage: number;
  baseHoursByField: Record<string, number>;
}

export const calculatePensum = (
  teacherData: TeacherData,
  settings: GlobalSettings,
  specialFunctions: SpecialFunction[]
): CalculatedData => {
  
  // 1. Determine Lesson Factor based on Role
  let hoursPerLesson = 0;
  
  if (teacherData.role === 'KLP') {
    // KLP base factor calculation (1890 - 120) / 26
    hoursPerLesson = (settings.annualHours - 120) / settings.baseLessons.KLP;
  } else {
    // Standard calculation for others
    hoursPerLesson = settings.annualHours / settings.baseLessons[teacherData.role];
  }

  const totalBaseHours = teacherData.teachingLessons * hoursPerLesson;

  // 2. Distribute Base Hours into Categories (82/7/7/4 split)
  const baseHoursByField: Record<string, number> = {
    'Unterricht und Klasse': totalBaseHours * DISTRIBUTION_SHARES['Unterricht und Klasse'],
    'Lernende und Schulpartner': totalBaseHours * DISTRIBUTION_SHARES['Lernende und Schulpartner'],
    'Schule': totalBaseHours * DISTRIBUTION_SHARES['Schule'],
    'Lehrperson': totalBaseHours * DISTRIBUTION_SHARES['Lehrperson'],
  };

  // 3. Initialize Distribution Buckets
  const distribution: DistributionCategory[] = [
    { name: 'Unterricht und Klasse', hours: baseHoursByField['Unterricht und Klasse'], color: 'bg-purple-600' },
    { name: 'Lernende und Schulpartner', hours: baseHoursByField['Lernende und Schulpartner'], color: 'bg-blue-500' },
    { name: 'Schule', hours: baseHoursByField['Schule'], color: 'bg-teal-500' },
    { name: 'Lehrperson', hours: baseHoursByField['Lehrperson'], color: 'bg-yellow-400' },
  ];

  // Reference Year for Age Calculation (School Year 2026/27 -> 2026)
  const referenceYear = 2026;
  const age = referenceYear - teacherData.birthYear;

  // 4. Apply Special Functions
  teacherData.activeSpecialFunctions.forEach(sfId => {
    const func = specialFunctions.find(f => f.id === sfId);
    if (func) {
      const category = distribution.find(c => c.name === func.workField);
      
      // Determine Hours
      let hoursToAdd = 0;

      // Special Case: Altersentlastung (sf-age)
      if (sfId === 'sf-age') {
        let reliefLessons = 0;
        if (age >= 60) {
          reliefLessons = 3;
        } else if (age >= 55) {
          reliefLessons = 1;
        }
        // 1 WL = 60h for relief in Glarus model (Context from prompt)
        hoursToAdd = reliefLessons * 60;
      } else {
        // Normal Logic
        const config = teacherData.functionConfig && teacherData.functionConfig[sfId];
        
        if (config) {
           // Use manually entered hours (or calculation based on meta)
           hoursToAdd = config.hours;
        } else {
           // Fallback to defaults
           if (func.inputUnit === 'Lektionen') {
              // If no config but unit is lessons, use default reliefLessons * 60
              hoursToAdd = func.reliefLessons * 60;
           } else {
              hoursToAdd = func.hours;
           }
        }
      }

      if (category && hoursToAdd > 0) {
        category.hours += hoursToAdd;
        category.correction = (category.correction || 0) + hoursToAdd;
      }
    }
  });

  // 5. Apply Custom Functions (User Defined)
  teacherData.customFunctions.forEach(cf => {
    const category = distribution.find(c => c.name === cf.workField);
    if (category) {
      // Convert lessons to hours if needed (Factor 60 based on previous logic)
      const hoursToAdd = cf.unit === 'Lektionen' ? cf.value * 60 : cf.value;
      
      if (hoursToAdd > 0) {
        category.hours += hoursToAdd;
        category.correction = (category.correction || 0) + hoursToAdd;
      }
    }
  });

  // 6. Apply Manual Corrections
  distribution.forEach(category => {
    const manualCorrection = teacherData.manualCorrections[category.name] || 0;
    if (manualCorrection !== 0) {
      category.hours += manualCorrection;
      category.correction = (category.correction || 0) + manualCorrection;
      category.manualCorrectionOnly = manualCorrection;
    }
  });

  // 7. Totals
  const totalHours = distribution.reduce((acc, curr) => acc + curr.hours, 0);
  const pensumPercentage = (totalHours / settings.annualHours) * 100;

  return {
    distribution,
    totalHours,
    pensumPercentage,
    baseHoursByField
  };
};
