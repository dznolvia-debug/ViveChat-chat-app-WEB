import React, { useState } from 'react';
import { X, UserPlus, Phone, Search, CheckCircle2, AlertCircle, Copy, Check, ChevronDown, Globe, MessageSquare } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { arePhonesMatching } from '../../utils/phoneMatcher';
import { Avatar } from '../common/Avatar';
import { ALL_COUNTRIES, CountryInfo } from '../../utils/countryCodes';
import { CountryPickerModal } from '../common/CountryPickerModal';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, allUsers, contacts, addContactByPhone, selectChatByPhone } = useChat();
  const [activeTab, setActiveTab] = useState<'contacts' | 'new_number'>('contacts');
  const [searchQuery, setSearchQuery] = useState('');
  
  // New Number form
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo>(ALL_COUNTRIES[0]);
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [contactName, setContactName] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copiedMyNumber, setCopiedMyNumber] = useState(false);

  // Filter existing registered contacts & all registered users
  const otherRegisteredUsers = allUsers.filter(u => !arePhonesMatching(u.phone, currentUser.phone));

  const allAvailablePeople = React.useMemo(() => {
    const map = new Map<string, any>();
    otherRegisteredUsers.forEach(u => {
      map.set(u.phone, {
        id: u.id,
        name: u.name,
        phone: u.phone,
        avatar: u.avatar,
        about: u.about || 'Disponible',
        isRegistered: true,
      });
    });
    contacts.forEach(c => {
      let matchedKey = c.phone;
      for (const k of map.keys()) {
        if (arePhonesMatching(k, c.phone)) {
          matchedKey = k;
          break;
        }
      }
      const existing = map.get(matchedKey);
      if (existing) {
        map.set(matchedKey, { ...existing, ...c, isRegistered: true });
      } else {
        map.set(c.phone, c);
      }
    });
    return Array.from(map.values());
  }, [otherRegisteredUsers, contacts]);

  if (!isOpen) return null;

  const handleCopyMyNumber = () => {
    navigator.clipboard?.writeText(currentUser.phone);
    setCopiedMyNumber(true);
    setTimeout(() => setCopiedMyNumber(false), 2000);
  };

  const handleAddNewContact = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const fullPhone = `${selectedCountry.dialCode} ${phoneNumber.trim()}`;
    const result = addContactByPhone(fullPhone, contactName.trim());

    if (result.success) {
      setStatusMessage({ text: result.message, type: 'success' });
      setPhoneNumber('');
      setContactName('');
      setTimeout(() => {
        if (result.contact) {
          selectChatByPhone(result.contact.phone);
          onClose();
        }
      }, 1000);
    } else {
      setStatusMessage({ text: result.message, type: 'error' });
    }
  };

  const filteredContacts = allAvailablePeople.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1f1530] w-full max-w-md rounded-2xl shadow-2xl border border-purple-200 dark:border-purple-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Purple Header */}
        <div className="bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 text-white p-4 flex items-center justify-between shadow shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-lg leading-tight">Nuevo Chat</h2>
              <p className="text-xs text-purple-200">Comunícate mediante número telefónico</p>
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

        {/* My Phone Number Banner */}
        <div className="bg-purple-50 dark:bg-purple-950/60 px-4 py-2.5 border-b border-purple-100 dark:border-purple-800/60 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200">
            <Phone className="w-3.5 h-3.5 text-purple-600" />
            <span>Tu número: <strong className="font-mono text-purple-700 dark:text-purple-300">{currentUser.phone}</strong></span>
          </div>
          <button
            type="button"
            onClick={handleCopyMyNumber}
            className="p-1 rounded text-purple-600 dark:text-purple-300 hover:bg-purple-200/60 dark:hover:bg-purple-800/60 transition-colors flex items-center gap-1"
            title="Copiar mi número"
          >
            {copiedMyNumber ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="text-[11px]">{copiedMyNumber ? 'Copiado' : 'Copiar'}</span>
          </button>
        </div>

        {/* Subtabs: Contactos Guardados / Agregar por Número */}
        <div className="flex border-b border-purple-100 dark:border-purple-800/60 bg-white dark:bg-[#1a1128] shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('contacts')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === 'contacts'
                ? 'border-purple-600 text-purple-700 dark:text-purple-300 bg-purple-50/50 dark:bg-purple-950/30'
                : 'border-transparent text-gray-500 hover:text-purple-600'
            }`}
          >
            Mis Contactos ({contacts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('new_number')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === 'new_number'
                ? 'border-purple-600 text-purple-700 dark:text-purple-300 bg-purple-50/50 dark:bg-purple-950/30'
                : 'border-transparent text-gray-500 hover:text-purple-600'
            }`}
          >
            + Escribir Número
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'contacts' ? (
            <div className="flex flex-col gap-3">
              {/* Search contacts input */}
              <div className="relative">
                <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre o número..."
                  className="w-full pl-9 pr-3 py-2 bg-purple-50 dark:bg-purple-950/40 rounded-xl text-sm border border-purple-200 dark:border-purple-800/60 focus:border-purple-500 outline-none text-gray-900 dark:text-purple-100"
                />
              </div>

              {/* Contacts List */}
              <div className="flex flex-col divide-y divide-purple-100 dark:divide-purple-900/40">
                {filteredContacts.length > 0 ? (
                  filteredContacts.map((contact) => (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => {
                        selectChatByPhone(contact.phone);
                        onClose();
                      }}
                      className="flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/40 text-left transition-colors group"
                    >
                      <Avatar src={contact.avatar} name={contact.name} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900 dark:text-purple-100 text-sm truncate group-hover:text-purple-600 transition-colors">
                            {contact.name}
                          </h4>
                          {contact.isRegistered && (
                            <span className="text-[10px] font-medium bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
                              En ViveChat
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-mono text-gray-500 dark:text-purple-300/70">
                          {contact.phone}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-purple-400/60 truncate mt-0.5">
                          {contact.about}
                        </p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400 dark:text-purple-300/60 text-sm">
                    No se encontraron contactos en tu agenda.
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Add Contact by Phone Form */
            <form onSubmit={handleAddNewContact} className="flex flex-col gap-3.5">
              <p className="text-xs text-gray-600 dark:text-purple-200">
                Para chatear con alguien, ingresa su número de teléfono con el código de país de cualquier parte del mundo.
              </p>

              {/* Status banner */}
              {statusMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    statusMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {statusMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
              )}

              {/* Name Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-purple-200 mb-1">
                  Nombre o apodo del contacto (Opcional)
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Ej. Profesor Carlos o Sofia"
                  className="w-full px-3 py-2 bg-purple-50 dark:bg-purple-950/40 rounded-xl text-sm border border-purple-200 dark:border-purple-800/60 focus:border-purple-500 outline-none text-gray-900 dark:text-purple-100"
                />
              </div>

              {/* Country selector button */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-purple-200 mb-1">
                  País del contacto
                </label>
                <button
                  type="button"
                  onClick={() => setIsCountryModalOpen(true)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-purple-50 dark:bg-purple-950/40 rounded-xl text-xs border border-purple-200 dark:border-purple-800/60 hover:border-purple-500 transition-colors text-slate-800 dark:text-purple-100"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg">{selectedCountry.flag}</span>
                    <span className="font-semibold truncate">{selectedCountry.name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="font-mono font-bold text-purple-600 dark:text-purple-300">
                      {selectedCountry.dialCode}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </div>
                </button>
              </div>

              {/* Phone Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-purple-200 mb-1">
                  Número de teléfono móvil *
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCountryModalOpen(true)}
                    className="w-20 bg-purple-100/70 dark:bg-purple-900/50 hover:bg-purple-200 border border-purple-200 dark:border-purple-800 rounded-xl px-2 py-2 text-xs font-mono font-bold text-center text-purple-700 dark:text-purple-200 shrink-0"
                    title="Cambiar país"
                  >
                    {selectedCountry.dialCode}
                  </button>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="9999 9999"
                    className="flex-1 px-3 py-2 bg-purple-50 dark:bg-purple-950/40 rounded-xl text-sm border border-purple-200 dark:border-purple-800/60 focus:border-purple-500 outline-none font-mono text-gray-900 dark:text-purple-100"
                  />
                </div>
              </div>

              {/* Quick suggestions for active users online */}
              <div className="mt-1">
                <span className="text-[11px] font-semibold text-gray-500 dark:text-purple-300 block mb-1">
                  Personas y teléfonos en línea:
                </span>
                <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
                  {allUsers
                    .filter(u => !arePhonesMatching(u.phone, currentUser.phone))
                    .map(u => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          selectChatByPhone(u.phone);
                          onClose();
                        }}
                        className="text-xs bg-purple-100/70 hover:bg-purple-200 dark:bg-purple-900/50 dark:hover:bg-purple-800 text-purple-900 dark:text-purple-100 px-3 py-2 rounded-xl transition-all flex items-center justify-between group border border-purple-200/60 dark:border-purple-700/60"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar src={u.avatar} name={u.name} size="sm" />
                          <span className="font-semibold text-xs">{u.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] text-purple-700 dark:text-purple-300">{u.phone}</span>
                          <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                            <MessageSquare className="w-2.5 h-2.5" /> Chatear
                          </span>
                        </div>
                      </button>
                    ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="mt-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium shadow hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Guardar e iniciar chat</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* World Countries Modal */}
      <CountryPickerModal
        isOpen={isCountryModalOpen}
        onClose={() => setIsCountryModalOpen(false)}
        selectedCountryCode={selectedCountry.dialCode}
        onSelectCountry={(country) => setSelectedCountry(country)}
      />
    </div>
  );
};
