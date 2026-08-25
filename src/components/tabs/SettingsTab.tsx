import React from 'react';
import { Moon, Sun, Volume2, VolumeX, Image, Shield, Bell, ArrowRightLeft, User, Phone, Check } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { Avatar } from '../common/Avatar';

interface SettingsTabProps {
  onOpenProfile: () => void;
  onOpenSwitchUser: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ onOpenProfile, onOpenSwitchUser }) => {
  const { currentUser, settings, updateSettings } = useChat();

  const WALLPAPERS = [
    { id: 'purple-doodle', name: 'Doodle Púrpura Clásico' },
    { id: 'deep-violet', name: 'Violeta Profundo' },
    { id: 'soft-lavender', name: 'Lavanda Suave' },
    { id: 'pure-dark', name: 'Noche Oscura' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
      {/* Profile Card Header */}
      <div
        onClick={onOpenProfile}
        className="flex items-center gap-3.5 p-4 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-md cursor-pointer hover:brightness-105 transition-all"
      >
        <Avatar src={currentUser.avatar} name={currentUser.name} size="lg" className="ring-2 ring-white/50" />
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base truncate">{currentUser.name}</h3>
          <p className="text-xs text-purple-200 font-mono flex items-center gap-1 mt-0.5">
            <Phone className="w-3 h-3" />
            <span>{currentUser.phone}</span>
          </p>
          <p className="text-xs text-purple-200/80 truncate mt-1">{currentUser.about}</p>
        </div>
      </div>

      {/* Switch User / Multi-device Test Action */}
      <button
        type="button"
        onClick={onOpenSwitchUser}
        className="flex items-center justify-between p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 hover:bg-purple-100/60 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-gray-900 dark:text-purple-100">
              Cambiar de Usuario / Probar Usuario B
            </h4>
            <p className="text-xs text-purple-700 dark:text-purple-300">
              Alterna entre Usuario A y B para probar chats y llamadas en vivo
            </p>
          </div>
        </div>
        <span className="text-xs text-purple-600 dark:text-purple-400 font-bold">Cambiar →</span>
      </button>

      {/* Settings Options Group */}
      <div className="bg-white dark:bg-[#1f1530] rounded-2xl p-2 border border-purple-100 dark:border-purple-800/50 shadow-sm flex flex-col divide-y divide-purple-100 dark:divide-purple-900/40">
        {/* Theme Setting */}
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300 flex items-center justify-center">
              {settings.theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-900 dark:text-purple-100">Tema de la interfaz</h4>
              <p className="text-xs text-gray-500 dark:text-purple-300/70">
                {settings.theme === 'dark' ? 'Modo Noche Morado' : 'Modo Día Morado'}
              </p>
            </div>
          </div>

          <div className="flex items-center bg-purple-100 dark:bg-purple-950 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => updateSettings({ theme: 'light' })}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                settings.theme === 'light' ? 'bg-purple-600 text-white shadow' : 'text-gray-500 dark:text-purple-300'
              }`}
            >
              Claro
            </button>
            <button
              type="button"
              onClick={() => updateSettings({ theme: 'dark' })}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                settings.theme === 'dark' ? 'bg-purple-600 text-white shadow' : 'text-gray-500 dark:text-purple-300'
              }`}
            >
              Oscuro
            </button>
          </div>
        </div>

        {/* Sound Notifications */}
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300 flex items-center justify-center">
              {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-900 dark:text-purple-100">Efectos de sonido</h4>
              <p className="text-xs text-gray-500 dark:text-purple-300/70">Tonos de mensajes y llamadas</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
              settings.soundEnabled ? 'bg-purple-600 justify-end' : 'bg-gray-300 dark:bg-gray-700 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-md" />
          </button>
        </div>

        {/* Read Receipts */}
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300 flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-900 dark:text-purple-100">Confirmaciones de lectura</h4>
              <p className="text-xs text-gray-500 dark:text-purple-300/70">Doble visto azul/morado</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => updateSettings({ readReceipts: !settings.readReceipts })}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
              settings.readReceipts ? 'bg-purple-600 justify-end' : 'bg-gray-300 dark:bg-gray-700 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-md" />
          </button>
        </div>

        {/* Wallpaper Picker */}
        <div className="p-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300 flex items-center justify-center">
              <Image className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-900 dark:text-purple-100">Fondo de los chats</h4>
              <p className="text-xs text-gray-500 dark:text-purple-300/70">Estilo del tapiz morado</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            {WALLPAPERS.map((wp) => (
              <button
                key={wp.id}
                type="button"
                onClick={() => updateSettings({ wallpaper: wp.id })}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                  settings.wallpaper === wp.id
                    ? 'border-purple-600 bg-purple-100/70 dark:bg-purple-900/60 text-purple-700 dark:text-purple-200'
                    : 'border-purple-100 dark:border-purple-800/40 text-gray-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                }`}
              >
                {wp.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Logout / Re-register button */}
      <button
        type="button"
        onClick={() => {
          if (window.confirm('¿Deseas cerrar sesión y registrar otro número de teléfono?')) {
            window.location.reload();
            localStorage.removeItem('pt_onboarding_completed_v3');
          }
        }}
        className="w-full py-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-300 text-xs font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2 shadow-xs"
      >
        <span>Cerrar sesión / Registrar nuevo número</span>
      </button>
    </div>
  );
};
