import React, { useEffect, useRef, useState } from 'react';
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
import { api } from '../services/api';

function isUploadedIcon(icon: string): boolean {
  return icon.startsWith('/') || icon.startsWith('http://') || icon.startsWith('https://');
}

function mapIconName(icon: string): string {
  if (isUploadedIcon(icon)) return icon;
  if (icon === 'Wallet') return 'Lock';
  if (icon === 'CloudLightning') return 'Flame';
  if (icon === 'MoreVertical') return 'AlertTriangle';
  if (icon === 'CarCrash') return 'Car';
  return icon;
}

export const EmergencyTypesPage: React.FC = () => {
  const [types, setTypes] = useState<EmergencyTypeItem[]>([]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<EmergencyTypeItem | null>(null);
  const [typeName, setTypeName] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [iconFileName, setIconFileName] = useState('');
  const iconInputRef = useRef<HTMLInputElement | null>(null);

  const resetIconState = () => {
    setIconUrl('');
    setIconFileName('');
    if (iconInputRef.current) iconInputRef.current.value = '';
  };

  const loadTypes = async () => {
    const rows = await api.getEmergencyTypes();
    setTypes(
      rows.map((row) => ({
        id: row.id,
        name: row.label,
        iconName: mapIconName(row.icon),
      })),
    );
  };

  useEffect(() => {
    loadTypes().catch(() => setTypes([]));
  }, []);

  const renderIcon = (name: string) => {
    if (isUploadedIcon(name)) {
      return <img src={name} alt="" className="w-8 h-8 object-contain" />;
    }
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

  const handleIconFile = async (file?: File) => {
    if (!file) return;
    try {
      const uploaded = await api.uploadImages([file]);
      const url = uploaded.files[0]?.url;
      if (!url) return;
      setIconUrl(url);
      setIconFileName(file.name);
    } catch {
      // Keep the existing modal so the admin can retry.
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeName.trim()) return;
    try {
      await api.createEmergencyType({
        label: typeName.trim(),
        ...(iconUrl ? { icon: iconUrl } : {}),
      });
      await loadTypes();
      setTypeName('');
      resetIconState();
      setIsAddModalOpen(false);
    } catch {
      // Keep the existing modal so the admin can retry.
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingType || !typeName.trim()) return;
    try {
      await api.updateEmergencyType(editingType.id, {
        label: typeName.trim(),
        ...(iconUrl ? { icon: iconUrl } : {}),
      });
      await loadTypes();
      setEditingType(null);
      setTypeName('');
      resetIconState();
    } catch {
      // Keep the existing modal so the admin can retry.
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteEmergencyType(id);
      await loadTypes();
    } catch {
      await loadTypes();
    }
  };

  return (
    <div className="space-y-6">
      <input
        ref={iconInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          handleIconFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {/* Top Header & Add Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-gray-900 tracking-tight">
          Emergency Type
        </h2>

        <button
          onClick={() => {
            setTypeName('');
            resetIconState();
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shrink-0"
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
                    if (isUploadedIcon(t.iconName)) {
                      setIconUrl(t.iconName);
                      setIconFileName('Icon uploaded');
                    } else {
                      resetIconState();
                    }
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl border border-gray-200 shadow-2xl w-full max-w-sm overflow-y-auto max-h-[90dvh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm">Add Type</h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetIconState();
                }}
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
              <div
                className="border border-gray-200 border-dashed rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => iconInputRef.current?.click()}
              >
                <span className="text-xs text-gray-400 truncate pr-2">{iconFileName || 'Upload Icon'}</span>
                <UploadCloud className="w-4 h-4 text-gray-400 shrink-0" />
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl border border-gray-200 shadow-2xl w-full max-w-sm overflow-y-auto max-h-[90dvh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm">Edit Type</h3>
              <button
                onClick={() => {
                  setEditingType(null);
                  resetIconState();
                }}
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
              <div
                className="border border-gray-200 border-dashed rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => iconInputRef.current?.click()}
              >
                <span className="text-xs text-gray-400 truncate pr-2">{iconFileName || 'Upload Icon'}</span>
                <UploadCloud className="w-4 h-4 text-gray-400 shrink-0" />
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
