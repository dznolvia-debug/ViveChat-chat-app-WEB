import React, { useState } from 'react';
import { X, Users, ArrowRightLeft, Plus, Phone, Check } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { storage } from '../../utils/storage';
import { Avatar } from '../common/Avatar';

interface SwitchUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SwitchUserModal: React.FC<SwitchUserModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, allUsers, switchUser, updateCurrentUser } = useChat();
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');

  if (!isOpen) return null;

  const handleSelectUser = (userId: string) => {
    switchUser(userId);
    onClose();
  };

  const handleCreateNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserPhone.trim()) return;

    const newId = 'user_custom_' + Date.now();
    const newUser = {
      id: newId,
      name: newUserName.trim(),
      phone: newUserPhone.trim().startsWith('+') ? newUserPhone.trim() : `+1 ${newUserPhone.trim()}`,
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      about: '¡Hola! Estoy usando ViveChat 🟣',
      isOnline: true,
    };

    const updatedUsers = [...allUsers, newUser];
    storage.saveUsers(updatedUsers);
    switchUser(newId);
    setShowAddUser(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1e1430] w-full max-w-md rounded-2xl shadow-2xl border border-purple-200 dark:border-purple-800 overflow-hidden flex flex-col">
        {/* Purple Header */}
        <div className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white p-4 flex items-center justify-between shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-lg leading-tight">Cambiar de Cuenta</h2>
              <p className="text-xs text-purple-200">Prueba tiempo real entre Usuario A y Usuario B</p>
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

        {/* Tip box */}
        <div className="bg-purple-50 dark:bg-purple-950/60 p-3 text-xs text-purple-800 dark:text-purple-200 border-b border-purple-100 dark:border-purple-800/60">
          💡 Puedes abrir esta misma página en una <strong>segunda pestaña o ventana</strong> para chatear y llamarte en vivo entre ambos números sin latencia.
        </div>

        {/* User list */}
        <div className="p-4 flex flex-col gap-2 max-h-80 overflow-y-auto">
          {allUsers.map((user) => {
            const isCurrent = user.id === currentUser.id;
            return (
              <button
                key={user.id}
                type="button"
                onClick={() => handleSelectUser(user.id)}
                className={`flex items-center justify-between p-3 rounded-xl transition-all border text-left ${
                  isCurrent
                    ? 'bg-purple-100/80 dark:bg-purple-900/60 border-purple-400 dark:border-purple-600 shadow-sm'
                    : 'bg-white dark:bg-[#25193d] border-purple-100 dark:border-purple-800/40 hover:bg-purple-50 dark:hover:bg-purple-900/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar src={user.avatar} name={user.name} size="md" isOnline={user.isOnline} />
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-purple-100 flex items-center gap-2">
                      <span>{user.name}</span>
                      {isCurrent && (
                        <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded-full font-bold">
                          Activo
                        </span>
                      )}
                    </h4>
                    <p className="text-xs font-mono text-gray-500 dark:text-purple-300/80 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-purple-500" />
                      <span>{user.phone}</span>
                    </p>
                  </div>
                </div>

                {isCurrent ? (
                  <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                ) : (
                  <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                    Cambiar →
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Add custom phone account toggle */}
        <div className="p-4 border-t border-purple-100 dark:border-purple-800/60 bg-gray-50 dark:bg-purple-950/40">
          {!showAddUser ? (
            <button
              type="button"
              onClick={() => setShowAddUser(true)}
              className="w-full py-2 px-3 rounded-xl border-2 border-dashed border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-100/50 dark:hover:bg-purple-900/40 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Crear otro usuario con nuevo número</span>
            </button>
          ) : (
            <form onSubmit={handleCreateNewUser} className="flex flex-col gap-2.5">
              <span className="text-xs font-semibold text-gray-700 dark:text-purple-200">
                Registrar nuevo número telefónico:
              </span>
              <input
                type="text"
                required
                placeholder="Nombre completo"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="w-full px-3 py-1.5 bg-white dark:bg-purple-900/60 rounded-lg text-xs border border-purple-200 dark:border-purple-700 text-gray-900 dark:text-purple-100 outline-none"
              />
              <input
                type="tel"
                required
                placeholder="+1 555 9999"
                value={newUserPhone}
                onChange={(e) => setNewUserPhone(e.target.value)}
                className="w-full px-3 py-1.5 bg-white dark:bg-purple-900/60 rounded-lg text-xs border border-purple-200 dark:border-purple-700 text-gray-900 dark:text-purple-100 outline-none font-mono"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold"
                >
                  Crear y Activar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
