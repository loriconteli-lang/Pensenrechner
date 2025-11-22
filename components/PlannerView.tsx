
import React, { useEffect } from 'react';
import { GlobalSettings, SpecialFunction, TeacherData, RoleType, Municipality, InputUnit, WorkField, CustomFunction } from '../types';
import { User, Building2, LayoutGrid, Clock, Plus, Trash2, X } from 'lucide-react';
import { ProgressBar } from './ProgressBar';
import { calculatePensum } from '../utils/calculations';

interface PlannerViewProps {
  settings: GlobalSettings;
  teacherData: TeacherData;
  specialFunctions: SpecialFunction[];
  onUpdateTeacherData: (data: TeacherData) => void;
}

export const PlannerView: React.FC<PlannerViewProps> = ({
  settings,
  teacherData,
  specialFunctions,
  onUpdateTeacherData,
}) => {
  
  // Reference Year for age calculation
  const CURRENT_YEAR = 2025;
  const age = CURRENT_YEAR - teacherData.birthYear;

  // Auto-select standard function if role changes
  useEffect(() => {
    let newActive = [...teacherData.activeSpecialFunctions];
    let changed = false;

    // 1. Standard Roles (KLP/SHP/FLP)
    const standardFuncs: Record<RoleType, string> = {
      'KLP': 'sf-klp',
      'SHP': 'sf-shp',
      'FLP': 'sf-flp'
    };

    const expectedStandard = standardFuncs[teacherData.role];
    
    // Remove other roles' standard functions
    Object.entries(standardFuncs).forEach(([role, sfId]) => {
      if (role !== teacherData.role && newActive.includes(sfId)) {
        newActive = newActive.filter(id => id !== sfId);
        changed = true;
      }
    });

    // Add current role's standard function
    if (expectedStandard && !newActive.includes(expectedStandard)) {
      if (specialFunctions.find(f => f.id === expectedStandard)) {
        newActive.push(expectedStandard);
        // Initialize config if missing
        const defaultConfig = teacherData.functionConfig[expectedStandard] || { hours: specialFunctions.find(f => f.id === expectedStandard)?.hours || 0 };
        onUpdateTeacherData({
           ...teacherData,
           activeSpecialFunctions: [...newActive],
           functionConfig: {
             ...teacherData.functionConfig,
             [expectedStandard]: defaultConfig
           }
        });
        return; // Early return because we called update
      }
    }

    // 2. Age Relief (Altersentlastung)
    const ageReliefId = 'sf-age';
    const isEligibleForAgeRelief = age >= 55;
    const hasAgeRelief = newActive.includes(ageReliefId);

    if (isEligibleForAgeRelief && !hasAgeRelief) {
      newActive.push(ageReliefId);
      changed = true;
    } else if (!isEligibleForAgeRelief && hasAgeRelief) {
      newActive = newActive.filter(id => id !== ageReliefId);
      changed = true;
    }

    if (changed) {
      onUpdateTeacherData({ ...teacherData, activeSpecialFunctions: newActive });
    }
  }, [teacherData.role, teacherData.birthYear, specialFunctions]); // eslint-disable-line react-hooks/exhaustive-deps

  // Calculations
  const { distribution: finalDistribution, totalHours, pensumPercentage } = calculatePensum(
    teacherData, 
    settings, 
    specialFunctions
  );

  const toggleSpecialFunction = (id: string, isChecked: boolean) => {
    const newActive = isChecked
      ? [...teacherData.activeSpecialFunctions, id]
      : teacherData.activeSpecialFunctions.filter(fid => fid !== id);
    onUpdateTeacherData({ ...teacherData, activeSpecialFunctions: newActive });
  };

  const handleRoleChange = (role: RoleType) => {
    const newLessons = role === 'KLP' ? 26 : 28;
    onUpdateTeacherData({ ...teacherData, role, teachingLessons: newLessons });
  };

  const handleManualCorrection = (categoryName: string, value: string) => {
    const numValue = parseFloat(value);
    const newCorrections = { ...teacherData.manualCorrections };
    
    if (isNaN(numValue) || value === '') {
      delete newCorrections[categoryName];
    } else {
      newCorrections[categoryName] = numValue;
    }
    
    onUpdateTeacherData({ ...teacherData, manualCorrections: newCorrections });
  };

  const handleFunctionHourChange = (id: string, val: number, unit: InputUnit = 'Stunden') => {
    // Convert input to hours for storage
    // If unit is 'Lektionen', factor is 60
    const hours = unit === 'Lektionen' ? val * 60 : val;

    onUpdateTeacherData({
      ...teacherData,
      functionConfig: {
        ...teacherData.functionConfig,
        [id]: {
          ...teacherData.functionConfig[id],
          hours: hours
        }
      }
    });
  };

  const handleSHPSingleClassChange = (isChecked: boolean) => {
    const shpId = 'sf-shp';
    const newHours = isChecked ? 60 : 120;
    
    onUpdateTeacherData({
      ...teacherData,
      functionConfig: {
        ...teacherData.functionConfig,
        [shpId]: {
          hours: newHours,
          meta: { isSingleClass: isChecked }
        }
      }
    });
  };

  const handleAddCustomFunction = () => {
    const newCustom: CustomFunction = {
      id: `custom-${Date.now()}`,
      name: 'Neue Aufgabe',
      value: 0,
      unit: 'Stunden',
      workField: 'Schule'
    };
    onUpdateTeacherData({
      ...teacherData,
      customFunctions: [...teacherData.customFunctions, newCustom]
    });
  };

  const handleUpdateCustomFunction = (id: string, field: keyof CustomFunction, value: any) => {
    onUpdateTeacherData({
      ...teacherData,
      customFunctions: teacherData.customFunctions.map(cf => 
        cf.id === id ? { ...cf, [field]: value } : cf
      )
    });
  };

  const handleDeleteCustomFunction = (id: string) => {
    onUpdateTeacherData({
      ...teacherData,
      customFunctions: teacherData.customFunctions.filter(cf => cf.id !== id)
    });
  };

  const filteredSpecialFunctions = specialFunctions.filter(sf => 
    sf.allowedRoles === 'Alle' || sf.allowedRoles === teacherData.role
  );

  const maxLessons = teacherData.role === 'KLP' ? 26 : 28;

  return (
    <div className="p-4 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in">
      
      {/* LEFT COLUMN: Compact Inputs */}
      <div className="lg:col-span-7 space-y-4">
        
        {/* 1. Person & Municipality Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4 text-gray-800">
             <User size={18} className="text-red-600" />
             <h2 className="font-semibold text-sm uppercase tracking-wide">Personaldaten</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
             <div className="sm:col-span-4 md:col-span-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Gemeinde</label>
                <div className="relative">
                  <select
                    value={teacherData.municipality}
                    onChange={(e) => onUpdateTeacherData({...teacherData, municipality: e.target.value as Municipality})}
                    className="w-full pl-2 pr-8 py-2 border border-gray-200 rounded text-sm font-medium bg-gray-50 focus:bg-white focus:border-red-500 outline-none transition-colors appearance-none"
                  >
                    <option value="Glarus">Glarus</option>
                    <option value="Glarus Nord">Glarus Nord</option>
                    <option value="Glarus Süd">Glarus Süd</option>
                  </select>
                  <Building2 size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                </div>
             </div>
             <div className="sm:col-span-4 md:col-span-3 grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Name</label>
                  <input 
                    type="text" 
                    value={teacherData.lastName}
                    onChange={(e) => onUpdateTeacherData({...teacherData, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:border-red-500 outline-none"
                    placeholder="Nachname"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Vorname</label>
                  <input 
                    type="text" 
                    value={teacherData.firstName}
                    onChange={(e) => onUpdateTeacherData({...teacherData, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:border-red-500 outline-none"
                    placeholder="Vorname"
                  />
                </div>
                 <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Jahrgang</label>
                  <input 
                    type="number" 
                    value={teacherData.birthYear}
                    onChange={(e) => onUpdateTeacherData({...teacherData, birthYear: parseInt(e.target.value) || 1980})}
                    className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:border-red-500 outline-none text-center"
                    placeholder="YYYY"
                  />
                </div>
             </div>
          </div>
        </div>

        {/* 2. Role & Lessons Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
           <div className="flex items-center gap-2 mb-4 text-gray-800">
             <Clock size={18} className="text-red-600" />
             <h2 className="font-semibold text-sm uppercase tracking-wide">Funktion & Lektionen</h2>
          </div>

          <div className="space-y-6">
            {/* Role Switcher */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Funktion</label>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                {(['KLP', 'FLP', 'SHP'] as RoleType[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => handleRoleChange(role)}
                    className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                      teacherData.role === role 
                        ? 'bg-white text-red-700 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {role === 'KLP' ? 'Klassenlehrperson' : role === 'FLP' ? 'Fachlehrperson' : 'Heilpädagogik'}
                  </button>
                ))}
              </div>
            </div>

            {/* Lessons Slider */}
            <div>
               <div className="flex justify-between items-end mb-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Unterrichtslektionen</label>
                  <span className="text-xl font-bold text-gray-800">
                    {teacherData.teachingLessons} <span className="text-sm text-gray-400 font-normal">/ {maxLessons} WL</span>
                  </span>
               </div>
               <input
                  type="range"
                  min="1"
                  max="32"
                  step="1"
                  value={teacherData.teachingLessons}
                  onChange={(e) => onUpdateTeacherData({...teacherData, teachingLessons: parseInt(e.target.value)})}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                />
               <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                 <span>1 WL</span>
                 <span>100% = {maxLessons} WL</span>
               </div>
            </div>
          </div>
        </div>

        {/* 3. Special Functions & Tasks Grid */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
           <div className="flex items-center justify-between mb-4 text-gray-800">
              <div className="flex items-center gap-2">
                 <LayoutGrid size={18} className="text-red-600" />
                 <h2 className="font-semibold text-sm uppercase tracking-wide">Spezialfunktionen & Aufgaben</h2>
              </div>
              <button 
                onClick={handleAddCustomFunction}
                className="flex items-center gap-1 text-[10px] font-bold uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
              >
                <Plus size={12} />
                Aufgabe
              </button>
          </div>
          
          {/* Standard Functions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {filteredSpecialFunctions.map((func) => {
              const isActive = teacherData.activeSpecialFunctions.includes(func.id);
              const config = teacherData.functionConfig[func.id] || { hours: func.hours };
              
              const inputUnit = func.inputUnit || 'Stunden';
              const displayValue = inputUnit === 'Lektionen' ? (config.hours / 60) : config.hours;
              const isAgeRelief = func.id === 'sf-age';
              const isEditable = isActive && !isAgeRelief;

              return (
                <div 
                  key={func.id}
                  className={`
                    relative border rounded-md p-3 transition-all hover:shadow-md
                    ${isActive ? 'border-red-200 bg-red-50/30' : 'border-gray-200 bg-white'}
                  `}
                >
                   <div className="flex items-start gap-3">
                      <div 
                        onClick={() => {
                            if (func.isStandard || isAgeRelief) return;
                            toggleSpecialFunction(func.id, !isActive)
                        }}
                        className={`
                          mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 cursor-pointer
                          ${isActive ? 'bg-red-600 border-red-600 text-white' : 'border-gray-300 bg-white'}
                          ${(func.isStandard || isAgeRelief) ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        {isActive && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      
                      <div className="flex-1">
                         <div className="flex justify-between items-start">
                             <div className="text-sm font-medium text-gray-800 leading-tight">
                               {func.name}
                               {isAgeRelief && isActive && (
                                 <span className="block text-[10px] text-red-500 font-normal mt-0.5">
                                    Automatisch ({age >= 60 ? '3' : '1'} WL)
                                 </span>
                               )}
                             </div>
                             {isEditable && (
                                <div className="flex items-center gap-1 ml-2">
                                    <input
                                        type="number"
                                        value={displayValue}
                                        onChange={(e) => handleFunctionHourChange(func.id, parseFloat(e.target.value) || 0, inputUnit)}
                                        className="w-12 h-6 text-right text-xs border border-gray-300 rounded focus:border-red-500 outline-none px-1"
                                    />
                                    <span className="text-xs text-gray-500">{inputUnit === 'Lektionen' ? 'WL' : 'h'}</span>
                                </div>
                             )}
                         </div>

                         {func.id === 'sf-shp' && isActive && (
                            <div className="mt-2 flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    id="shp-single-class"
                                    checked={config.meta?.isSingleClass || false}
                                    onChange={(e) => handleSHPSingleClassChange(e.target.checked)}
                                    className="w-3 h-3 text-red-600 rounded border-gray-300 focus:ring-red-500"
                                />
                                <label htmlFor="shp-single-class" className="text-xs text-gray-600 cursor-pointer select-none">
                                    Nur 1 Klasse (max. 60h)
                                </label>
                            </div>
                         )}

                         {!isEditable && !isAgeRelief && (
                             <div className="text-[10px] text-gray-500 mt-1 flex gap-2">
                                <span>{func.hours}h</span>
                             </div>
                         )}
                      </div>
                   </div>
                </div>
              );
            })}
          </div>

          {/* Custom Functions List */}
          {teacherData.customFunctions.length > 0 && (
            <div className="space-y-2 border-t border-gray-100 pt-4">
               <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Eigene Aufgaben</h3>
               {teacherData.customFunctions.map((cf) => (
                 <div key={cf.id} className="flex items-center gap-2 bg-blue-50/50 p-2 rounded border border-blue-100">
                    <input 
                      type="text"
                      value={cf.name}
                      onChange={(e) => handleUpdateCustomFunction(cf.id, 'name', e.target.value)}
                      placeholder="Bezeichnung..."
                      className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:border-blue-500 outline-none"
                    />
                    
                    <div className="flex items-center gap-1">
                       <input 
                        type="number"
                        value={cf.value}
                        onChange={(e) => handleUpdateCustomFunction(cf.id, 'value', parseFloat(e.target.value) || 0)}
                        className="w-12 text-xs text-right border border-gray-200 rounded px-1 py-1 focus:border-blue-500 outline-none"
                      />
                      <select
                        value={cf.unit}
                        onChange={(e) => handleUpdateCustomFunction(cf.id, 'unit', e.target.value)}
                        className="text-xs border border-gray-200 rounded px-1 py-1 focus:border-blue-500 outline-none bg-white"
                      >
                        <option value="Stunden">h</option>
                        <option value="Lektionen">WL</option>
                      </select>
                    </div>

                    <select
                        value={cf.workField}
                        onChange={(e) => handleUpdateCustomFunction(cf.id, 'workField', e.target.value)}
                        className="w-24 text-[10px] border border-gray-200 rounded px-1 py-1 focus:border-blue-500 outline-none bg-white truncate"
                      >
                        <option value="Unterricht und Klasse">Unterricht</option>
                        <option value="Lernende und Schulpartner">Lernende</option>
                        <option value="Schule">Schule</option>
                        <option value="Lehrperson">Lehrperson</option>
                    </select>

                    <button 
                      onClick={() => handleDeleteCustomFunction(cf.id)}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <X size={14} />
                    </button>
                 </div>
               ))}
            </div>
          )}

        </div>

         {/* Remarks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
           <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Bemerkungen</label>
           <textarea 
              value={teacherData.remarks}
              onChange={(e) => onUpdateTeacherData({...teacherData,remarks: e.target.value})}
              className="w-full p-3 border border-gray-200 rounded text-sm focus:border-red-500 outline-none min-h-[80px]"
              placeholder="Besondere Vereinbarungen..."
           />
        </div>

      </div>

      {/* RIGHT COLUMN: Live Results */}
      <div className="lg:col-span-5 space-y-4">
        
        {/* Top Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center py-6">
              <span className="text-xs font-bold text-gray-400 uppercase mb-1">Pensum</span>
              <span className={`text-4xl font-bold ${pensumPercentage > 100 ? 'text-red-600' : 'text-gray-800'}`}>
                {pensumPercentage.toFixed(1)}%
              </span>
           </div>
           <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center py-6">
              <span className="text-xs font-bold text-gray-400 uppercase mb-1">Total Stunden</span>
              <span className="text-4xl font-bold text-gray-800">
                {Math.round(totalHours)}
              </span>
              <span className="text-[10px] text-gray-400 mt-1">von {settings.annualHours}h</span>
           </div>
        </div>

        {/* Distribution Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
           <h3 className="text-xs font-bold text-gray-400 uppercase mb-4">Verteilung</h3>
           <div className="space-y-4">
              {finalDistribution.map((cat) => (
                <ProgressBar 
                  key={cat.name}
                  label={cat.name}
                  value={cat.hours}
                  total={totalHours}
                  colorClass={cat.color}
                />
              ))}
           </div>
        </div>

        {/* Detailed Table Small */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                <tr>
                   <th className="px-4 py-2 text-left font-medium">Bereich</th>
                   <th className="px-4 py-2 text-right font-medium">Std.</th>
                   <th className="px-4 py-2 text-right font-medium">Korr. (+/-)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                 {finalDistribution.map(cat => {
                   const isEditable = cat.name !== 'Unterricht und Klasse';
                   const manualVal = teacherData.manualCorrections[cat.name];
                   const displayVal = manualVal !== undefined ? manualVal : '';
                   
                   return (
                    <tr key={cat.name}>
                        <td className="px-4 py-2.5 text-gray-700">{cat.name}</td>
                        <td className="px-4 py-2.5 text-right font-medium">{Math.round(cat.hours)}</td>
                        <td className="px-4 py-1.5 text-right">
                          {isEditable ? (
                            <input 
                              type="number" 
                              value={displayVal}
                              onChange={(e) => handleManualCorrection(cat.name, e.target.value)}
                              placeholder="0"
                              className="w-16 px-1 py-1 text-right border border-gray-200 rounded text-xs focus:border-red-500 focus:ring-1 focus:ring-red-200 outline-none transition-all bg-gray-50 focus:bg-white"
                            />
                          ) : (
                            <span className="text-gray-300 block py-1">-</span>
                          )}
                        </td>
                    </tr>
                   );
                 })}
                 <tr className="bg-gray-50 font-bold text-gray-800">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-right">{Math.round(totalHours)}</td>
                    <td className="px-4 py-3"></td>
                 </tr>
              </tbody>
            </table>
            <div className="px-4 py-2 text-[10px] text-gray-400 italic bg-gray-50 border-t border-gray-100">
                Hinweis: Manuelle Korrekturen werden direkt zu den Stunden addiert/subtrahiert.
            </div>
        </div>
      </div>
    </div>
  );
};
