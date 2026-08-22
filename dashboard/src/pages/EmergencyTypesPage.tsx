import React, { useState } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  UploadCloud,
  ShieldAlert,
  HeartPulse,
  Flame,
  Car,
  Eye,
  Activity,
  AlertTriangle,
  Brain,
  Baby,
  MoreVertical,
  Lock
} from 'lucide-react';
import { EmergencyTypeItem } from '../types';

export const EmergencyTypesPage: React.FC = () => {
  const [types, setTypes] = useState<EmergencyTypeItem[]>([
    { id: 'et-1', name: 'Assault', iconName: 'ShieldAlert' },
    { id: 'et-2', name: 'Medical', iconName: 'HeartPulse' },
    { id: 'et-3', name: 'Fire', iconName: 'Flame' },
    { id: 'et-4', name: 'Accident', iconName: 'Car' },
    { id: 'et-5', name: 'Theft', iconName: 'Lock' },
    { id: 'et-6', name: 'Stalking', iconName: 'Eye' },
    { id: 'et-7', name: 'Natural Disaster', iconName: 'Flame' },
    { id: 'et-8', name: 'Mental Health', iconName: 'Brain' },
    { id: 'et-9', name: 'Child in Danger', iconName: 'Baby' },
    { id: 'et-10', name: "I don't feel safe", iconName: 'AlertTriangle' },
  ]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<EmergencyTypeItem | null>(null);
  const [typeName, setTypeName] = useState('');

  const renderIcon = (name: string) => {
    switch (name) {
      case 'ShieldAlert':
        return <ShieldAlert className="w-8 h-8 text-gray-800" strokeWidth={1.5} />;
      case 'HeartPulse':
        return <HeartPulse className="w-8 h-8 text-gray-800" strokeWidth={1.5} />;
      case 'Flame':
        return <Flame className="w-8 h-8 text-gray-800" strokeWidth={1.5} />;
      case 'Car':
        return <Car className="w-8 h-8 text-gray-800" strokeWidth={1.5} />;
      case 'Lock':
        return <Lock className="w-8 h-8 text-gray-800" strokeWidth={1.5} />;
      case 'Eye':
        return <Eye className="w-8 h-8 text-gray-800" strokeWidth={1.5} />;
      case 'Brain':
        return <Brain className="w-8 h-8 text-gray-800" strokeWidth={1.5} />;
      case 'Baby':
        return <Baby className="w-8 h-8 text-gray-800" strokeWidth={1.5} />;
      default:
        return <AlertTriangle className="w-8 h-8 text-gray-800" strokeWidth={1.5} />;
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeName.trim()) return;
    setTypes([
      ...types,
      {
        id: `et-${Date.now()}`,
        name: typeName.trim(),
        iconName: 'ShieldAlert',
      },
    ]);
    setTypeName('');
    setIsAddModalOpen(false);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingType || !typeName.trim()) return;
    setTypes(
      types.map((t) => (t.id === editingType.id ? { ...t, name: typeName.trim() } : t))
    );
    setEditingType(null);
    setTypeName('');
  };

  const handleDelete = (id: string) => {
    setTypes(types.filter((t) => t.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Add Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 tracking-tight">
          Emergency Type
        </h2>

        <button
          onClick={() => {
            setTypeName('');
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:scale-102"
        >
          <Plus className="w-4 h-4" />
          Add Type
        </button>
      </div>

      {/* Grid of Emergency Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
        {types.map((t) => {
          const isHighlight = t.name === 'Theft';
          return (
            <div
              key={t.id}
              className={`figma-card p-6 flex flex-col items-center justify-between min-h-[160px] figma-card-hover ${
                isHighlight ? 'border-blue-300 bg-blue-50/20' : ''
              }`}
            >
              <div className="flex flex-col items-center mt-2">
                <div className="mb-3">{renderIcon(t.iconName)}</div>
                <h3 className="text-xs font-bold text-gray-800 text-center">
                  {t.name}
                </h3>
              </div>

              {/* Bottom Actions: Edit (Blue) & Delete (Red) */}
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100/80 w-full justify-center">
                <button
                  onClick={() => {
                    setEditingType(t);
                    setTypeName(t.name);
                  }}
                  className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
                  title="Edit Type"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="p-1 text-red-500 hover:text-red-600 transition-colors"
                  title="Delete Type"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Frame 2147230177: Add Type Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-sm overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm">Add Type</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <input
                  type="text"
                  required
                  placeholder="Emergency type name"
                  value={typeName}
                  onChange={(e) => setTypeName(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 shadow-sm"
                />
              </div>

              {/* Upload Icon Box */}
              <div className="border border-gray-200 border-dashed rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors">
                <span className="text-xs text-gray-400">Upload Icon</span>
                <UploadCloud className="w-4 h-4 text-gray-400" />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md mt-2"
              >
                Add Emergency Type
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Frame 2147230178: Edit Type Modal */}
      {editingType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-sm overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm">Edit Type</h3>
              <button
                onClick={() => setEditingType(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <input
                  type="text"
                  required
                  placeholder="Emergency type name"
                  value={typeName}
                  onChange={(e) => setTypeName(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 shadow-sm"
                />
              </div>

              {/* Upload Icon Box */}
              <div className="border border-gray-200 border-dashed rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors">
                <span className="text-xs text-gray-400">Upload Icon</span>
                <UploadCloud className="w-4 h-4 text-gray-400" />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md mt-2"
              >
                Update Emergency Type
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
