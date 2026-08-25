import React, { useState } from 'react';
import {
  X,
  Users,
  Check,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { Avatar } from '../common/Avatar';
import { Contact } from '../../types';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedPhones?: string[];
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  preSelectedPhones,
}) => {
  const { currentUser, contacts, allUsers, createGroupChat } = useChat();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedPhones, setSelectedPhones] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [search, setSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const prevIsOpenRef = React.useRef(isOpen);

  // Pre-populate selected phones only when opened
  React.useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      if (preSelectedPhones && preSelectedPhones.length > 0) {
        setSelectedPhones(preSelectedPhones);
        // If 2 or more already preselected from selection mode, proceed to step 2 directly
        if (preSelectedPhones.length >= 2) {
          setStep(2);
        } else {
          setStep(1);
        }
      } else {
        setSelectedPhones([]);
        setStep(1);
      }
      setGroupName('');
      setGroupDescription('');
      setErrorMsg('');
      setSearch('');
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, preSelectedPhones]);

  if (!isOpen) return null;

  const toggleSelectPhone = (phone: string) => {
    setSelectedPhones(prev => {
      if (prev.includes(phone)) {
        return prev.filter(p => p !== phone);
      } else {
        return [...prev, phone];
      }
    });
  };

  const handleNextStep = () => {
    if (selectedPhones.length < 2) {
      setErrorMsg('Selecciona al menos 2 contactos para formar un grupo.');
      return;
    }
    setErrorMsg('');
    setStep(2);
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setErrorMsg('Ingresa un nombre para el grupo.');
      return;
    }
    if (selectedPhones.length < 2) {
      setErrorMsg('Se requieren al menos 2 participantes para crear el grupo.');
      return;
    }

    const newGroup = createGroupChat(groupName.trim(), selectedPhones, undefined, groupDescription.trim());
    if (newGroup) {
      onClose();
    }
  };

  // Contacts available to select (contacts + registered users)
  const availableContacts = contacts;
  const filteredContacts = availableContacts.filter(
    c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
      <div
        className="bg-white dark:bg-[#1a1128] w-full max-w-md rounded-3xl shadow-2xl border border-purple-200 dark:border-purple-800/80 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {step === 1 ? 'Añadir miembros al grupo' : 'Nuevo Grupo'}
              </h3>
              <p className="text-xs text-purple-200">
                {step === 1
                  ? `${selectedPhones.length} participante(s) seleccionados`
                  : 'Asigna nombre e ícono'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-300 text-xs px-4 py-2 border-b border-red-200 dark:border-red-900 flex items-center justify-between animate-in fade-in">
            <span>{errorMsg}</span>
            <button type="button" onClick={() => setErrorMsg('')}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {step === 1 ? (
          /* STEP 1: Select Members */
          <div className="flex-1 flex flex-col overflow-hidden p-4 gap-3">
            {/* Search Input */}
            <div className="relative shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar contacto..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-[#201533] rounded-xl text-xs border border-slate-200 dark:border-purple-800/60 outline-none text-slate-900 dark:text-purple-100 placeholder-slate-400"
              />
            </div>

            {/* Selected Chips Horizontal Bar */}
            {selectedPhones.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 shrink-0 no-scrollbar">
                {selectedPhones.map(phone => {
                  const c = contacts.find(item => item.phone === phone);
                  const name = c ? c.name : phone;
                  return (
                    <div
                      key={phone}
                      className="flex items-center gap-1.5 bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 animate-in zoom-in-90"
                    >
                      <span className="max-w-[100px] truncate">{name}</span>
                      <button
                        type="button"
                        onClick={() => toggleSelectPhone(phone)}
                        className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Contact List with Checkboxes */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-purple-900/30 border border-slate-100 dark:border-purple-900/30 rounded-2xl p-1">
              {filteredContacts.length > 0 ? (
                filteredContacts.map(c => {
                  const isChecked = selectedPhones.includes(c.phone);
                  return (
                    <div
                      key={c.phone}
                      onClick={() => toggleSelectPhone(c.phone)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-purple-50 dark:bg-purple-950/60'
                          : 'hover:bg-slate-50 dark:hover:bg-purple-900/20'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar src={c.avatar} name={c.name} size="sm" isOnline={c.isRegistered} />
                        <div className="min-w-0">
                          <h4 className="font-semibold text-xs text-slate-800 dark:text-purple-100 truncate">
                            {c.name}
                          </h4>
                          <p className="text-[11px] font-mono text-slate-500 dark:text-purple-300/70 truncate">
                            {c.phone}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                          isChecked
                            ? 'bg-purple-600 border-purple-600 text-white'
                            : 'border-slate-300 dark:border-purple-800'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">
                  {contacts.length === 0
                    ? 'No tienes contactos guardados. Agrega contactos primero.'
                    : 'No se encontraron contactos.'}
                </div>
              )}
            </div>

            {/* Footer with Continue Button */}
            <div className="pt-2 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 dark:text-purple-300/70">
                Mínimo 2 participantes
              </span>
              <button
                type="button"
                onClick={handleNextStep}
                disabled={selectedPhones.length < 2}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:hover:bg-purple-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Siguiente</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* STEP 2: Name and Details */
          <form onSubmit={handleCreateGroup} className="flex-1 flex flex-col p-5 gap-4 overflow-y-auto">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
                <Users className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-purple-200 mb-1">
                  Nombre del grupo *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Ej. Proyecto ViveChat 🚀"
                  maxLength={40}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#201533] rounded-xl text-sm border border-slate-200 dark:border-purple-800/60 outline-none text-slate-900 dark:text-purple-100 placeholder-slate-400 focus:border-purple-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-purple-200 mb-1">
                Descripción del grupo (opcional)
              </label>
              <textarea
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="Escribe el propósito del grupo..."
                rows={2}
                maxLength={120}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#201533] rounded-xl text-xs border border-slate-200 dark:border-purple-800/60 outline-none text-slate-900 dark:text-purple-100 placeholder-slate-400 focus:border-purple-600 resize-none"
              />
            </div>

            {/* Participants Summary */}
            <div className="bg-slate-50 dark:bg-[#201533] p-3 rounded-2xl border border-slate-200/60 dark:border-purple-900/30">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 block mb-2">
                Miembros ({selectedPhones.length + 1})
              </span>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs bg-purple-600 text-white font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                  <span>Tú (Admin)</span>
                </span>
                {selectedPhones.map(phone => {
                  const c = contacts.find(item => item.phone === phone);
                  const name = c ? c.name : phone;
                  return (
                    <span
                      key={phone}
                      className="text-xs bg-white dark:bg-purple-900/60 text-slate-700 dark:text-purple-200 font-medium px-2.5 py-1 rounded-full border border-slate-200 dark:border-purple-800"
                    >
                      {name}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-purple-900/40 text-slate-700 dark:text-purple-200 font-semibold text-xs hover:bg-slate-200 transition-colors"
              >
                Atrás
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Crear Grupo</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
