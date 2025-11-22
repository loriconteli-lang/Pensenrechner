
import React, { useState } from 'react';
import { GlobalSettings, SpecialFunction, RoleType, WorkField } from '../types';
import { Plus, Trash2 } from 'lucide-react';

interface SettingsViewProps {
  settings: GlobalSettings;
  onUpdateSettings: (settings: GlobalSettings) => void;
  specialFunctions: SpecialFunction[];
  onUpdateSpecialFunctions: (funcs: SpecialFunction[]) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  specialFunctions,
  onUpdateSpecialFunctions,
}) => {
  const [newFunctionMode, setNewFunctionMode] = useState(false);

  const handleBaseLessonChange = (role: RoleType, val: string) => {
    const num = parseFloat(val) || 0;
    onUpdateSettings({
      ...settings,
      baseLessons: {
        ...settings.baseLessons,
        [role]: num,
      },
    });
  };

  const handleDeleteFunction = (id: string) => {
    onUpdateSpecialFunctions(specialFunctions.filter((f) => f.id !== id));
  };

  const handleAddFunction = () => {
    const newFunc: SpecialFunction = {
      id: `sf-${Date.now()}`,
      name: 'Neue Funktion',
      reliefLessons: 0,
      hours: 0,
      workField: 'Schule',
      allowedRoles: 'Alle',
    };
    onUpdateSpecialFunctions([...specialFunctions, newFunc]);
  };

  const updateFunction = (id: string, field: keyof SpecialFunction, value: any) => {
    onUpdateSpecialFunctions(
      specialFunctions.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Global Parameters Section */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Globale Parameter (100% Pensum)</h2>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Jahresarbeitszeit (Stunden)</label>
            <input
              type="number"
              value={settings.annualHours}
              onChange={(e) => onUpdateSettings({ ...settings, annualHours: parseInt(e.target.value) || 0 })}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-200 focus:border-red-500 outline-none transition-all"
            />
            <p className="text-xs text-gray-400 mt-1">Standard: 1890h</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Basis-Lektionen (WL)</h3>
            {(['KLP', 'FLP', 'SHP', 'DaZ'] as RoleType[]).map((role) => (
              <div key={role} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">
                  {role === 'KLP' ? 'Klassenlehrperson (KLP)' : 
                   role === 'FLP' ? 'Fachlehrperson (FLP)' : 
                   role === 'SHP' ? 'Schulischer Heilpädagoge (SHP)' :
                   'Deutsch als Zweitsprache (DaZ)'}
                </span>
                <input
                  type="number"
                  value={settings.baseLessons[role]}
                  onChange={(e) => handleBaseLessonChange(role, e.target.value)}
                  className="w-20 p-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-red-200 outline-none"
                />
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Special Functions Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">Spezialfunktionen & Entlastungen</h2>
          <button
            onClick={handleAddFunction}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 font-medium text-sm rounded hover:bg-blue-100 transition-colors"
          >
            <Plus size={16} />
            Neu
          </button>
        </div>

        <div className="space-y-4">
          {specialFunctions.map((func) => (
            <div key={func.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              
              <div className="md:col-span-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">Bezeichnung</label>
                <input
                  type="text"
                  value={func.name}
                  onChange={(e) => updateFunction(func.id, 'name', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-sm focus:border-blue-500 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Entlastung (Lekt.)</label>
                <input
                  type="number"
                  step="0.1"
                  value={func.reliefLessons}
                  onChange={(e) => updateFunction(func.id, 'reliefLessons', parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border border-gray-300 rounded text-sm focus:border-blue-500 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Arbeitszeit (h)</label>
                <input
                  type="number"
                  value={func.hours}
                  onChange={(e) => updateFunction(func.id, 'hours', parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border border-gray-300 rounded text-sm focus:border-blue-500 outline-none"
                />
              </div>

              <div className="md:col-span-3 space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Arbeitsfeld</label>
                  <select
                    value={func.workField}
                    onChange={(e) => updateFunction(func.id, 'workField', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-sm bg-white outline-none"
                  >
                    <option value="Unterricht und Klasse">Unterricht und Klasse</option>
                    <option value="Lernende und Schulpartner">Lernende und Schulpartner</option>
                    <option value="Schule">Schule</option>
                    <option value="Lehrperson">Lehrperson</option>
                  </select>
                </div>
                 <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Rolle</label>
                  <select
                    value={func.allowedRoles}
                    onChange={(e) => updateFunction(func.id, 'allowedRoles', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-sm bg-white outline-none"
                  >
                    <option value="Alle">Alle</option>
                    <option value="KLP">Klassenlehrperson (KLP)</option>
                    <option value="FLP">Fachlehrperson (FLP)</option>
                    <option value="SHP">Schulischer Heilpädagoge (SHP)</option>
                    <option value="DaZ">Deutsch als Zweitsprache (DaZ)</option>
                  </select>
                </div>
              </div>

              <div className="md:col-span-1 flex justify-center pb-2">
                 <button 
                    onClick={() => handleDeleteFunction(func.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Löschen"
                 >
                    <Trash2 size={18} />
                 </button>
              </div>

            </div>
          ))}
        </div>

      </section>
    </div>
  );
};