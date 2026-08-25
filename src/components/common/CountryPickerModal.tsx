import React, { useState, useMemo } from 'react';
import { X, Search, Check, Globe } from 'lucide-react';
import { ALL_COUNTRIES, CountryInfo } from '../../utils/countryCodes';

interface CountryPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCountry: (country: CountryInfo) => void;
  selectedCountryCode?: string;
}

export const CountryPickerModal: React.FC<CountryPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectCountry,
  selectedCountryCode,
}) => {
  const [search, setSearch] = useState('');

  const filteredCountries = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return ALL_COUNTRIES;

    return ALL_COUNTRIES.filter(c => {
      const nameMatch = c.name.toLowerCase().includes(query);
      const codeMatch = c.code.toLowerCase().includes(query);
      const dialClean = c.dialCode.replace('+', '');
      const queryClean = query.replace('+', '');
      const dialMatch = c.dialCode.includes(query) || dialClean.startsWith(queryClean);

      return nameMatch || codeMatch || dialMatch;
    });
  }, [search]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#1f1530] w-full max-w-md rounded-2xl shadow-2xl border border-purple-200 dark:border-purple-800/80 overflow-hidden flex flex-col h-[520px] max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white p-4 flex items-center justify-between shrink-0 shadow">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-purple-200" />
            <div>
              <h3 className="font-bold text-base leading-tight">Elige un país</h3>
              <p className="text-xs text-purple-200">Todos los códigos telefónicos del mundo</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-purple-100 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-950/30 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar país o código (ej. Honduras, +504, México, España)..."
              className="w-full pl-9 pr-8 py-2 bg-white dark:bg-[#160d24] rounded-xl text-sm border border-purple-200 dark:border-purple-800/60 focus:border-purple-500 outline-none text-slate-900 dark:text-purple-100 placeholder-slate-400 dark:placeholder-purple-400/50"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-purple-200 text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Countries Scrollable List */}
        <div className="flex-1 overflow-y-auto divide-y divide-purple-50 dark:divide-purple-900/30">
          {filteredCountries.length > 0 ? (
            filteredCountries.map((c) => {
              const isSelected = selectedCountryCode === c.dialCode;
              return (
                <button
                  key={`${c.code}-${c.name}-${c.dialCode}`}
                  type="button"
                  onClick={() => {
                    onSelectCountry(c);
                    onClose();
                  }}
                  className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors hover:bg-purple-50/70 dark:hover:bg-purple-900/40 ${
                    isSelected ? 'bg-purple-100/60 dark:bg-purple-900/60 text-purple-700 dark:text-purple-200' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0" role="img" aria-label={c.name}>
                      {c.flag}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-900 dark:text-purple-100 truncate">
                        {c.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-purple-300/70">
                        {c.code}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono font-bold text-sm text-purple-700 dark:text-purple-300 bg-purple-100/80 dark:bg-purple-950/80 px-2.5 py-1 rounded-lg border border-purple-200 dark:border-purple-800">
                      {c.dialCode}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-400 dark:text-purple-300/70 text-sm">
              No se encontraron países para &quot;{search}&quot;
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
