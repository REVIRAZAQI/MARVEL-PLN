import React, { useState, useEffect } from 'react';
import { UserCheck, PenLine, RotateCcw } from 'lucide-react';

interface StaffSelectDropdownProps {
  label: string;
  badge?: string;
  value: string;
  onChange: (val: string) => void;
  options: readonly string[];
  placeholder?: string;
  helperText?: string;
  required?: boolean;
}

export const StaffSelectDropdown: React.FC<StaffSelectDropdownProps> = ({
  label,
  badge = 'Kolom Spreadsheet',
  value,
  onChange,
  options,
  placeholder = '-- Pilih dari Daftar --',
  helperText,
  required = true
}) => {
  // If the initial or current value matches an option, selectedOption is that option.
  // If value is non-empty and not in options, or if isManualMode is explicitly toggled:
  const isValueInOptions = options.some(
    opt => opt.trim().toUpperCase() === (value || '').trim().toUpperCase()
  );

  const [isManualMode, setIsManualMode] = useState<boolean>(() => {
    return Boolean(value && !isValueInOptions);
  });

  // Keep manual mode in sync if value changed externally
  useEffect(() => {
    if (value && !options.some(opt => opt.trim().toUpperCase() === value.trim().toUpperCase())) {
      setIsManualMode(true);
    }
  }, [value, options]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === '__MANUAL__') {
      setIsManualMode(true);
      onChange('');
    } else {
      setIsManualMode(false);
      onChange(selected.toUpperCase());
    }
  };

  const handleManualInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // FORCE UPPERCASE on all manual inputs
    onChange(e.target.value.toUpperCase());
  };

  const handleSwitchToDropdown = () => {
    setIsManualMode(false);
    onChange(options[0] || '');
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>{label}</span>
        </label>
        {badge && (
          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
            {badge}
          </span>
        )}
      </div>

      {!isManualMode ? (
        <div className="space-y-1.5">
          <select
            value={isValueInOptions ? value : ''}
            onChange={handleSelectChange}
            required={required && !isManualMode}
            className="w-full px-4 py-2.5 bg-white rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 font-bold uppercase shadow-2xs cursor-pointer transition-all"
          >
            <option value="" disabled>
              {placeholder}
            </option>
            {options.map(opt => (
              <option key={opt} value={opt} className="font-semibold text-slate-900">
                {opt}
              </option>
            ))}
            <option value="__MANUAL__" className="font-bold text-blue-700 bg-blue-50/50">
              ✍️ [ISI MANUAL] Tulis Nama Lainnya...
            </option>
          </select>
        </div>
      ) : (
        <div className="space-y-1.5 animate-in fade-in duration-150">
          <div className="relative">
            <input
              type="text"
              value={value}
              onChange={handleManualInputChange}
              placeholder="KETIK NAMA MANUAL (OTOMATIS HURUF KAPITAL)..."
              required={required}
              autoFocus
              className="w-full pl-9 pr-24 py-2.5 bg-white rounded-xl border-2 border-blue-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 font-bold uppercase shadow-2xs tracking-wide placeholder:normal-case placeholder:font-normal placeholder:text-slate-400"
            />
            <PenLine className="w-4 h-4 text-blue-600 absolute left-3 top-3 pointer-events-none" />
            <button
              type="button"
              onClick={handleSwitchToDropdown}
              className="absolute right-2 top-2 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 border border-slate-200 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
              title="Kembali memilih dari daftar dropdown"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Daftar</span>
            </button>
          </div>
          <p className="text-[10.5px] text-blue-700 font-medium">
            *Mode Isi Manual aktif: Semua karakter otomatis diformat <strong>HURUF KAPITAL</strong>.
          </p>
        </div>
      )}

      {helperText && !isManualMode && (
        <p className="text-[10.5px] text-slate-400 leading-tight">
          {helperText}
        </p>
      )}
    </div>
  );
};
