import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MaterialItem } from '../types/warehouse';
import { getNormalisasiCode, getSatuan } from '../utils/suratJalanHelper';
import { Search, X, ChevronDown, Check, AlertTriangle, Package, Hash } from 'lucide-react';

interface MaterialRowSearchSelectorProps {
  materials: MaterialItem[];
  selectedMaterialId: string;
  onSelectMaterial: (material: MaterialItem) => void;
  normColSpan?: string; // e.g. "sm:col-span-3"
  nameColSpan?: string; // e.g. "sm:col-span-6"
  isIncoming?: boolean; // For Penerimaan, stock check has different meaning
}

export const MaterialRowSearchSelector: React.FC<MaterialRowSearchSelectorProps> = ({
  materials,
  selectedMaterialId,
  onSelectMaterial,
  normColSpan = "sm:col-span-3",
  nameColSpan = "sm:col-span-6",
  isIncoming = false
}) => {
  const selectedMaterial = useMemo(() => {
    return materials.find(m => m.id === selectedMaterialId) || materials[0] || null;
  }, [materials, selectedMaterialId]);

  const selectedNorm = useMemo(() => {
    if (!selectedMaterial) return '';
    return getNormalisasiCode(selectedMaterial.name) || selectedMaterial.code || '';
  }, [selectedMaterial]);

  // Search states for Normalisasi input
  const [normInput, setNormInput] = useState('');
  const [isNormOpen, setIsNormOpen] = useState(false);
  const [normHighlightedIndex, setNormHighlightedIndex] = useState(0);
  const normContainerRef = useRef<HTMLDivElement>(null);
  const normInputRef = useRef<HTMLInputElement>(null);

  // Search states for Nama Material input
  const [nameInput, setNameInput] = useState('');
  const [isNameOpen, setIsNameOpen] = useState(false);
  const [nameHighlightedIndex, setNameHighlightedIndex] = useState(0);
  const nameContainerRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Sync inputs with selected material when it changes externally
  useEffect(() => {
    if (selectedMaterial) {
      setNormInput(selectedNorm);
      setNameInput(selectedMaterial.name);
    }
  }, [selectedMaterial, selectedNorm]);

  // Click outside listener for Normalisasi dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (normContainerRef.current && !normContainerRef.current.contains(e.target as Node)) {
        setIsNormOpen(false);
        // Reset input to current selected
        setNormInput(selectedNorm);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedNorm]);

  // Click outside listener for Nama Material dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (nameContainerRef.current && !nameContainerRef.current.contains(e.target as Node)) {
        setIsNameOpen(false);
        // Reset input to current selected
        if (selectedMaterial) setNameInput(selectedMaterial.name);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedMaterial]);

  // Normalisasi Filtered List
  const filteredByNorm = useMemo(() => {
    const query = normInput.trim().toLowerCase().replace(/^0+/, '');
    if (!query) return materials;

    return materials.filter(m => {
      const norm = (getNormalisasiCode(m.name) || m.code || '').toLowerCase().replace(/^0+/, '');
      const rawCode = (m.code || '').toLowerCase();
      const rawName = (m.name || '').toLowerCase();
      return norm.includes(query) || rawCode.includes(query) || rawName.includes(query);
    });
  }, [materials, normInput]);

  // Nama Material Filtered List
  const filteredByName = useMemo(() => {
    const query = nameInput.trim().toLowerCase();
    if (!query) return materials;

    const terms = query.split(/\s+/).filter(Boolean);
    return materials.filter(m => {
      const norm = (getNormalisasiCode(m.name) || m.code || '').toLowerCase();
      const name = m.name.toLowerCase();
      const cat = (m.category || '').toLowerCase();
      // Match all search terms in either name, norm code, or category
      return terms.every(term => name.includes(term) || norm.includes(term) || cat.includes(term));
    });
  }, [materials, nameInput]);

  const handleSelect = (mat: MaterialItem) => {
    onSelectMaterial(mat);
    const norm = getNormalisasiCode(mat.name) || mat.code || '';
    setNormInput(norm);
    setNameInput(mat.name);
    setIsNormOpen(false);
    setIsNameOpen(false);
  };

  // Keyboard navigation for Normalisasi
  const handleNormKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isNormOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsNormOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setNormHighlightedIndex(prev => (prev < filteredByNorm.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setNormHighlightedIndex(prev => (prev > 0 ? prev - 1 : filteredByNorm.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredByNorm[normHighlightedIndex]) {
        handleSelect(filteredByNorm[normHighlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsNormOpen(false);
      setNormInput(selectedNorm);
    }
  };

  // Keyboard navigation for Nama Material
  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isNameOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsNameOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setNameHighlightedIndex(prev => (prev < filteredByName.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setNameHighlightedIndex(prev => (prev > 0 ? prev - 1 : filteredByName.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredByName[nameHighlightedIndex]) {
        handleSelect(filteredByName[nameHighlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsNameOpen(false);
      if (selectedMaterial) setNameInput(selectedMaterial.name);
    }
  };

  return (
    <>
      {/* Kolom 8: NORMALISASI (Searchable Combobox) */}
      <div ref={normContainerRef} className={`${normColSpan} space-y-1 relative ${isNormOpen ? 'z-40' : 'z-10'}`}>
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
            <Hash className="w-3 h-3 text-blue-600" />
            <span>NORMALISASI</span>
          </label>
          <span className="text-[9.5px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
            Kolom 8
          </span>
        </div>

        <div className="relative">
          <input
            ref={normInputRef}
            type="text"
            value={normInput}
            onChange={e => {
              setNormInput(e.target.value);
              setIsNormOpen(true);
              setNormHighlightedIndex(0);
            }}
            onFocus={() => {
              setIsNormOpen(true);
              normInputRef.current?.select();
            }}
            onKeyDown={handleNormKeyDown}
            placeholder="Ketik kode (mis: 3200018)..."
            title="Ketik nomor normalisasi untuk mencari material otomatis"
            className="w-full pl-3 pr-8 py-2 bg-white rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-xs sm:text-sm font-mono font-black text-slate-800 transition-all shadow-2xs"
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {normInput && normInput !== selectedNorm && (
              <button
                type="button"
                onClick={() => {
                  setNormInput('');
                  setIsNormOpen(true);
                  normInputRef.current?.focus();
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
                title="Hapus pencarian"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setIsNormOpen(!isNormOpen);
                normInputRef.current?.focus();
              }}
              className="text-slate-400 hover:text-slate-600 p-0.5"
            >
              <Search className="w-3.5 h-3.5 text-blue-600" />
            </button>
          </div>
        </div>

        {/* Dropdown Options for Normalisasi */}
        {isNormOpen && (
          <div className="absolute z-50 left-0 top-full mt-1 w-[320px] sm:w-[380px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-600">
              <span className="flex items-center gap-1">
                <Search className="w-3 h-3 text-blue-600" />
                Pilih Kode Normalisasi
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {filteredByNorm.length} ditemukan
              </span>
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 text-xs">
              {filteredByNorm.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs">
                  Tidak ditemukan kode normalisasi &quot;{normInput}&quot;
                </div>
              ) : (
                filteredByNorm.map((mat, i) => {
                  const norm = getNormalisasiCode(mat.name) || mat.code;
                  const isSelected = mat.id === selectedMaterialId;
                  const isHighlighted = i === normHighlightedIndex;
                  return (
                    <button
                      key={mat.id}
                      type="button"
                      onClick={() => handleSelect(mat)}
                      className={`w-full text-left p-2.5 flex items-start gap-2.5 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/80 text-blue-950 font-medium'
                          : isHighlighted
                          ? 'bg-slate-100/80 text-slate-900'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="font-mono font-black text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded text-[11px] shrink-0 border border-blue-200">
                        {norm}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-xs font-semibold text-slate-800">
                          {mat.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10.5px] text-slate-500">
                          <span>Stok: <strong className="text-emerald-700 font-mono">{mat.currentStock} {mat.unit}</strong></span>
                          <span>•</span>
                          <span className="truncate">{mat.category}</span>
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Kolom 9: Nama Material (Searchable Combobox) */}
      <div ref={nameContainerRef} className={`${nameColSpan} space-y-1 relative ${isNameOpen ? 'z-40' : 'z-10'}`}>
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
            <Package className="w-3 h-3 text-blue-600" />
            <span>Nama Material</span>
          </label>
          <span className="text-[9.5px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
            Kolom 9 · Cari & Pilih
          </span>
        </div>

        <div className="relative">
          <input
            ref={nameInputRef}
            type="text"
            value={nameInput}
            onChange={e => {
              setNameInput(e.target.value);
              setIsNameOpen(true);
              setNameHighlightedIndex(0);
            }}
            onFocus={() => {
              setIsNameOpen(true);
              nameInputRef.current?.select();
            }}
            onKeyDown={handleNameKeyDown}
            placeholder="Ketik nama material (mis: MCB, Fuse, KWH)..."
            title="Ketik nama atau jenis material untuk mencari"
            className="w-full pl-3 pr-16 py-2 bg-white rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-xs sm:text-sm text-slate-800 font-medium transition-all shadow-2xs"
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {nameInput && selectedMaterial && nameInput !== selectedMaterial.name && (
              <button
                type="button"
                onClick={() => {
                  setNameInput('');
                  setIsNameOpen(true);
                  nameInputRef.current?.focus();
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
                title="Hapus teks"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setIsNameOpen(!isNameOpen);
                nameInputRef.current?.focus();
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
              title="Tampilkan semua daftar"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isNameOpen ? 'rotate-180 text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Dropdown Options for Nama Material */}
        {isNameOpen && (
          <div className="absolute z-50 left-0 top-full mt-1 w-full min-w-[300px] sm:min-w-[460px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-600">
              <span className="flex items-center gap-1">
                <Search className="w-3 h-3 text-blue-600" />
                Daftar Material Gudang PLN ({filteredByName.length} material)
              </span>
              <span className="text-[10px] text-slate-400">
                Pilih atau tekan Enter
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
              {filteredByName.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs">
                  Tidak ditemukan material dengan kata kunci &quot;{nameInput}&quot;. Coba kata kunci lain seperti MCB, FUSE, KWH, atau KABEL.
                </div>
              ) : (
                filteredByName.map((mat, i) => {
                  const norm = getNormalisasiCode(mat.name) || mat.code;
                  const isSelected = mat.id === selectedMaterialId;
                  const isHighlighted = i === nameHighlightedIndex;
                  const isOutOfStock = !isIncoming && mat.currentStock <= 0;
                  const isLowStock = !isIncoming && mat.currentStock > 0 && mat.currentStock <= mat.minSafetyStock;

                  return (
                    <button
                      key={mat.id}
                      type="button"
                      onClick={() => handleSelect(mat)}
                      className={`w-full text-left p-3 flex items-start justify-between gap-3 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/80 text-blue-950 font-medium'
                          : isHighlighted
                          ? 'bg-slate-100/80 text-slate-900'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded text-[10.5px] border border-blue-200">
                            {norm}
                          </span>
                          <span className="text-[10.5px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {mat.category || 'Material Gudang'}
                          </span>
                        </div>
                        <div className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                          {mat.name}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>Lokasi: <strong>{mat.rackLocation || 'Gudang Utama'}</strong></span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex flex-col items-end gap-1">
                        <div
                          className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold font-mono border ${
                            isOutOfStock
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : isLowStock
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          Stok: {mat.currentStock} {mat.unit}
                        </div>

                        {isSelected && (
                          <span className="flex items-center gap-0.5 text-[10px] text-blue-600 font-bold">
                            <Check className="w-3.5 h-3.5" />
                            Dipilih
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

interface MaterialSearchInputProps {
  materials: MaterialItem[];
  selectedMaterialId: string;
  onSelectMaterial: (material: MaterialItem) => void;
  className?: string;
  placeholder?: string;
}

export const MaterialSearchInput: React.FC<MaterialSearchInputProps> = ({
  materials,
  selectedMaterialId,
  onSelectMaterial,
  className = '',
  placeholder = 'Ketik kode normalisasi atau nama material...'
}) => {
  const selectedMaterial = useMemo(() => {
    return materials.find(m => m.id === selectedMaterialId) || null;
  }, [materials, selectedMaterialId]);

  const [inputVal, setInputVal] = useState(selectedMaterial?.name || '');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedMaterial) {
      setInputVal(selectedMaterial.name);
    }
  }, [selectedMaterial]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        if (selectedMaterial) setInputVal(selectedMaterial.name);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedMaterial]);

  const filteredMaterials = useMemo(() => {
    const q = inputVal.trim().toLowerCase();
    if (!q) return materials;

    return materials.filter(m => {
      const norm = (getNormalisasiCode(m.name) || m.code || '').toLowerCase();
      const name = m.name.toLowerCase();
      return name.includes(q) || norm.includes(q);
    });
  }, [materials, inputVal]);

  const handleSelect = (mat: MaterialItem) => {
    onSelectMaterial(mat);
    setInputVal(mat.name);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < filteredMaterials.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : filteredMaterials.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredMaterials[highlightedIndex]) {
        handleSelect(filteredMaterials[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      if (selectedMaterial) setInputVal(selectedMaterial.name);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={e => {
            setInputVal(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => {
            setIsOpen(true);
            inputRef.current?.select();
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-8 pr-8 py-2 bg-white rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-xs sm:text-sm text-slate-800 transition-all font-medium"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        {inputVal && (
          <button
            type="button"
            onClick={() => {
              setInputVal('');
              setIsOpen(true);
              inputRef.current?.focus();
            }}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md absolute right-2 top-1/2 -translate-y-1/2 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 left-0 top-full mt-1 w-full min-w-[300px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in duration-150">
          <div className="p-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-600">
            <span>Daftar Material ({filteredMaterials.length})</span>
            <span className="text-[10px] text-slate-400">Pilih atau tekan Enter</span>
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs">
            {filteredMaterials.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs">
                Tidak ada material yang sesuai
              </div>
            ) : (
              filteredMaterials.map((mat, idx) => {
                const norm = getNormalisasiCode(mat.name) || mat.code;
                const isSelected = mat.id === selectedMaterialId;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <button
                    key={mat.id}
                    type="button"
                    onClick={() => handleSelect(mat)}
                    className={`w-full text-left p-2.5 flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/80 text-blue-950 font-bold'
                        : isHighlighted
                        ? 'bg-slate-100/80 text-slate-900'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10.5px] font-black text-blue-700 bg-blue-100/70 px-1.5 py-0.2 rounded border border-blue-200">
                          {norm}
                        </span>
                        <span className="truncate text-xs font-semibold text-slate-800">
                          {mat.name}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-700 font-bold shrink-0">
                      Stok: {mat.currentStock} {mat.unit}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
