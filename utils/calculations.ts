
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
      // Special Case: Altersentlastung (sf-age)
      if (sfId === 'sf-age') {
        let reliefLessons = 0;
        if (age >= 60) {
          reliefLessons = 3;
        } else if (age >= 55) {
          reliefLessons = 1;
        }

        if (reliefLessons > 0) {
          // LOGIC CHANGE:
          // 1. Remove the time for these lessons from "Unterricht und Klasse".
          //    We assume the 'teachingLessons' input includes these relief lessons as "Soll".
          //    So we assume 82% of a lesson's value was allocated to Teaching.
          const hoursToRemoveFromTeaching = reliefLessons * hoursPerLesson * DISTRIBUTION_SHARES['Unterricht und Klasse'];
          
          const teachingCat = distribution.find(c => c.name === 'Unterricht und Klasse');
          if (teachingCat) {
             teachingCat.hours -= hoursToRemoveFromTeaching;
             // correction is strictly for additions usually, but here we technically reduced the base load.
             // We won't track negative correction for display simplicity in the "Zusatz" column unless desired.
             // But to make the math work for "Base" + "Zusatz" = "Total", let's adjust the hours directly.
          }

          // 2. Add fixed 60h per relief lesson to "Lehrperson"
          const hoursToAdd = reliefLessons * 60;
          const teacherCat = distribution.find(c => c.name === 'Lehrperson');
          if (teacherCat) {
             teacherCat.hours += hoursToAdd;
             teacherCat.correction = (teacherCat.correction || 0) + hoursToAdd;
          }
        }

      } else {
        // Normal Logic for other functions
        const category = distribution.find(c => c.name === func.workField);
        
        let hoursToAdd = 0;
        const config = teacherData.functionConfig && teacherData.functionConfig[sfId];
        
        if (config) {
           hoursToAdd = config.hours;
        } else {
           if (func.inputUnit === 'Lektionen') {
              hoursToAdd = func.reliefLessons * 60;
           } else {
              hoursToAdd = func.hours;
           }
        }

        if (category && hoursToAdd > 0) {
          category.hours += hoursToAdd;
          category.correction = (category.correction || 0) + hoursToAdd;
        }
      }
    }
  });

  // 5. Apply Custom Functions (User Defined)
  teacherData.customFunctions.forEach(cf => {
    const category = distribution.find(c => c.name === cf.workField);
    if (category) {
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
