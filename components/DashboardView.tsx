
import React, { useState } from 'react';
import { Folder as FolderIcon, Plus, Trash2, Edit, FileText, Download, Search, Users, PieChart, GraduationCap, ArrowRightLeft, X, Filter } from 'lucide-react';
import { SavedAgreement, Folder, RoleType } from '../types';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface DashboardViewProps {
  folders: Folder[];
  agreements: SavedAgreement[];
  onLoadAgreement: (agreement: SavedAgreement) => void;
  onDeleteAgreement: (id: string) => void;
  onCreateFolder: (name: string) => void;
  onDeleteFolder: (id: string) => void;
  onMoveAgreement: (agreementId: string, targetFolderId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  folders,
  agreements,
  onLoadAgreement,
  onDeleteAgreement,
  onCreateFolder,
  onDeleteFolder,
  onMoveAgreement,
}) => {
  const [activeFolderId, setActiveFolderId] = useState<string>('all');
  const [newFolderName, setNewFolderName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<RoleType | 'all'>('all');
  
  // Move Modal State
  const [moveModal, setMoveModal] = useState<{ isOpen: boolean; agreementId: string | null }>({
    isOpen: false,
    agreementId: null
  });

  // Filter Logic
  const filteredAgreements = agreements.filter(a => {
    const matchesFolder = activeFolderId === 'all' || a.folderId === activeFolderId;
    const matchesRole = filterRole === 'all' || a.data.role === filterRole;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      a.data.lastName.toLowerCase().includes(searchLower) || 
      a.data.firstName.toLowerCase().includes(searchLower);
    return matchesFolder && matchesRole && matchesSearch;
  });

  // Stats Calculation
  const totalFTE = filteredAgreements.reduce((acc, curr) => acc + curr.cachedPensumPercentage, 0);
  const totalLessons = filteredAgreements.reduce((acc, curr) => acc + curr.cachedTotalLessons, 0);
  const totalHours = filteredAgreements.reduce((acc, curr) => acc + curr.cachedTotalHours, 0);

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName('');
    }
  };

  const activeFolderName = activeFolderId === 'all' 
    ? 'Alle Vereinbarungen' 
    : folders.find(f => f.id === activeFolderId)?.name || 'Unbekannt';

  const openMoveModal = (id: string) => {
    setMoveModal({ isOpen: true, agreementId: id });
  };

  const handleMoveConfirm = (folderId: string) => {
    if (moveModal.agreementId) {
        onMoveAgreement(moveModal.agreementId, folderId);
        setMoveModal({ isOpen: false, agreementId: null });
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.setTextColor(185, 28, 28); // Red-700
    doc.text('Gesamtübersicht Pensen', 14, 22);
    
    // Subtitle
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`${activeFolderName} ${filterRole !== 'all' ? `(${filterRole})` : ''}`, 14, 30);
    doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-CH')}`, 14, 36);

    // Stats Area
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(`Total Stellenprozente: ${totalFTE.toFixed(1)}%`, 14, 46);
    doc.text(`Total Lektionen: ${totalLessons.toFixed(1)} WL`, 80, 46);
    doc.text(`Anzahl Lehrpersonen: ${filteredAgreements.length}`, 140, 46);

    // Table
    const tableColumn = ["Name", "Gemeinde", "Funktion", "Lektionen", "Stunden", "Pensum"];
    const tableRows = filteredAgreements.map(a => [
      `${a.data.lastName} ${a.data.firstName}`,
      a.data.municipality,
      a.data.role,
      a.cachedTotalLessons.toFixed(1),
      Math.round(a.cachedTotalHours).toString(),
      `${a.cachedPensumPercentage.toFixed(1)}%`
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 55,
      headStyles: { fillColor: [185, 28, 28] }, // Red header
      theme: 'grid',
      styles: { fontSize: 9 },
    });

    doc.save(`pensen_uebersicht_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#f3f4f6] overflow-hidden relative">
      
      {/* Move Modal Overlay */}
      {moveModal.isOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Verschieben nach...</h3>
                    <button onClick={() => setMoveModal({ isOpen: false, agreementId: null })} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>
                <p className="text-sm text-gray-500 mb-4">Wählen Sie den Zielordner für diese Vereinbarung:</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {folders.map(folder => (
                        <button
                            key={folder.id}
                            onClick={() => handleMoveConfirm(folder.id)}
                            className="w-full flex items-center gap-3 p-3 rounded hover:bg-gray-100 text-left transition-colors border border-transparent hover:border-gray-200"
                        >
                            <FolderIcon size={18} className="text-gray-500" />
                            <span className="text-sm font-medium text-gray-800">{folder.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* SIDEBAR (Hidden on Print) */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col print:hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Ordner</h2>
          <nav className="space-y-1">
            <button
              onClick={() => setActiveFolderId('all')}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeFolderId === 'all' ? 'bg-red-50 text-red-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FolderIcon size={16} />
              Alle Vereinbarungen
            </button>
            
            {folders.map(folder => (
              <div key={folder.id} className="group flex items-center justify-between pr-2 rounded-md hover:bg-gray-100 transition-colors">
                <button
                  onClick={() => setActiveFolderId(folder.id)}
                  className={`flex-1 flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md text-left ${
                    activeFolderId === folder.id ? 'bg-red-50 text-red-700' : 'text-gray-700'
                  }`}
                >
                  <FolderIcon size={16} className={activeFolderId === folder.id ? 'fill-red-200' : ''} />
                  <span className="truncate">{folder.name}</span>
                </button>
                {folder.id !== 'default' && (
                  <button 
                    onClick={() => onDeleteFolder(folder.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-opacity"
                    title="Ordner löschen"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </nav>
        </div>
        
        <div className="p-4 mt-auto bg-gray-50 border-t border-gray-200">
           <form onSubmit={handleCreateFolder} className="flex gap-2">
             <input 
                type="text" 
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Neuer Ordner..."
                className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded focus:border-red-500 outline-none"
             />
             <button 
                type="submit"
                disabled={!newFolderName.trim()}
                className="bg-white border border-gray-300 p-1.5 rounded hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-50 transition-colors"
             >
               <Plus size={16} />
             </button>
           </form>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible">
        
        {/* Header & Actions */}
        <div className="flex justify-between items-end mb-8 print:hidden">
          <div>
             <h1 className="text-2xl font-bold text-gray-900">{activeFolderName}</h1>
             <p className="text-gray-500 text-sm mt-1">{filteredAgreements.length} Datensätze gefunden</p>
          </div>
          <div className="flex gap-4 items-end">
             
             {/* Role Filter */}
             <div className="relative">
                 <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                 <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value as RoleType | 'all')}
                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none shadow-sm bg-white appearance-none cursor-pointer hover:bg-gray-50"
                 >
                    <option value="all">Alle Funktionen</option>
                    <option value="KLP">Klassenlehrperson</option>
                    <option value="FLP">Fachlehrperson</option>
                    <option value="SHP">Heilpädagogik</option>
                    <option value="DaZ">Deutsch als Zweitsprache</option>
                 </select>
             </div>

             <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Suchen..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none w-64 shadow-sm"
                />
             </div>
             <button 
               onClick={handleExportPDF}
               className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
             >
               <Download size={18} />
               <span>PDF Export</span>
             </button>
          </div>
        </div>

        {/* Print Header (Visible only on print - Fallback if user tries browser print) */}
        <div className="hidden print:block mb-8 border-b-4 border-red-600 pb-4">
           <h1 className="text-2xl font-bold text-gray-900">Gesamtübersicht Pensen</h1>
           <div className="flex justify-between mt-2 text-sm text-gray-600">
             <span>{activeFolderName} {filterRole !== 'all' ? `(${filterRole})` : ''}</span>
             <span>{new Date().toLocaleDateString('de-CH')}</span>
           </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 print:mb-6">
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4 print:border-gray-300">
              <div className="p-3 bg-blue-50 rounded-lg text-blue-600 print:hidden">
                 <PieChart size={24} />
              </div>
              <div>
                 <p className="text-xs font-bold text-gray-400 uppercase">Total Stellenprozente</p>
                 <p className="text-3xl font-bold text-gray-900">{totalFTE.toFixed(1)}%</p>
              </div>
           </div>
           
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4 print:border-gray-300">
              <div className="p-3 bg-purple-50 rounded-lg text-purple-600 print:hidden">
                 <GraduationCap size={24} />
              </div>
              <div>
                 <p className="text-xs font-bold text-gray-400 uppercase">Total Lektionen (WL)</p>
                 <p className="text-3xl font-bold text-gray-900">{totalLessons.toFixed(1)}</p>
              </div>
           </div>

           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4 print:border-gray-300">
              <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600 print:hidden">
                 <Users size={24} />
              </div>
              <div>
                 <p className="text-xs font-bold text-gray-400 uppercase">Anzahl Lehrpersonen</p>
                 <p className="text-3xl font-bold text-gray-900">{filteredAgreements.length}</p>
              </div>
           </div>
        </div>

        {/* List Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:shadow-none print:border-gray-300">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 print:px-2">Name</th>
                <th className="px-6 py-3 print:px-2">Gemeinde</th>
                <th className="px-6 py-3 print:px-2">Funktion</th>
                <th className="px-6 py-3 text-right print:px-2">Lektionen</th>
                <th className="px-6 py-3 text-right print:px-2">Stunden</th>
                <th className="px-6 py-3 text-right print:px-2">Pensum</th>
                <th className="px-6 py-3 text-right print:hidden">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAgreements.length > 0 ? (
                filteredAgreements.map((agreement) => (
                  <tr key={agreement.id} className="hover:bg-gray-50 transition-colors print:break-inside-avoid">
                    <td className="px-6 py-4 font-medium text-gray-900 print:px-2 print:py-2">
                      {agreement.data.lastName} {agreement.data.firstName}
                    </td>
                    <td className="px-6 py-4 text-gray-600 print:px-2 print:py-2">
                      {agreement.data.municipality}
                    </td>
                    <td className="px-6 py-4 text-gray-600 print:px-2 print:py-2">
                       <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700 border border-gray-200 print:border-0 print:bg-transparent print:p-0">
                         {agreement.data.role}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-gray-700 print:px-2 print:py-2">
                      {agreement.cachedTotalLessons.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-gray-700 print:px-2 print:py-2">
                      {Math.round(agreement.cachedTotalHours)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900 print:px-2 print:py-2">
                      {agreement.cachedPensumPercentage.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 text-right print:hidden">
                       <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => openMoveModal(agreement.id)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="In anderen Ordner verschieben"
                          >
                            <ArrowRightLeft size={16} />
                          </button>
                          <button 
                            onClick={() => onLoadAgreement(agreement)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Öffnen/Bearbeiten"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => onDeleteAgreement(agreement.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Löschen"
                          >
                            <Trash2 size={16} />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 italic">
                    Keine Vereinbarungen in diesem Ordner gefunden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
};