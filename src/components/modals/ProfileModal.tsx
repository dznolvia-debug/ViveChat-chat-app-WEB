import React, { useState, useRef } from 'react';
import { X, Camera, Check, User, Phone, Info } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { Avatar } from '../common/Avatar';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateCurrentUser } = useChat();
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone);
  const [about, setAbout] = useState(currentUser.about);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateCurrentUser({
      name: name.trim(),
      phone: phone.trim(),
      about: about.trim(),
      avatar,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1e1430] w-full max-w-md rounded-2xl shadow-2xl border border-purple-200 dark:border-purple-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 text-white p-4 flex items-center justify-between shadow">
          <h2 className="font-semibold text-lg">Perfil de Usuario</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 flex flex-col gap-5">
          {/* Avatar Section */}
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <Avatar src={avatar} name={name} size="xl" className="ring-4 ring-purple-500/40" />
              <div className="absolute inset-0 rounded-full bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 mb-1" />
                <span className="text-[10px]">Cambiar foto</span>
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />
            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
              Haz clic para cambiar foto de perfil
            </span>
          </div>

          {/* Name Input */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-purple-200 flex items-center gap-1.5 mb-1">
              <User className="w-3.5 h-3.5 text-purple-600" />
              <span>Tu nombre</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50 dark:bg-purple-950/40 rounded-xl text-sm border border-purple-200 dark:border-purple-800/60 focus:border-purple-500 outline-none text-gray-900 dark:text-purple-100"
            />
          </div>

          {/* Phone Number Input */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-purple-200 flex items-center gap-1.5 mb-1">
              <Phone className="w-3.5 h-3.5 text-purple-600" />
              <span>Tu número de teléfono</span>
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50 dark:bg-purple-950/40 rounded-xl text-sm border border-purple-200 dark:border-purple-800/60 focus:border-purple-500 outline-none font-mono text-gray-900 dark:text-purple-100"
            />
            <span className="text-[10px] text-gray-500 dark:text-purple-300/70 mt-1 block">
              Este es el número que otros usuarios deben agregar para chatear contigo.
            </span>
          </div>

          {/* About / Status Info */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-purple-200 flex items-center gap-1.5 mb-1">
              <Info className="w-3.5 h-3.5 text-purple-600" />
              <span>Info. / Estado</span>
            </label>
            <input
              type="text"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="¡Hola! Estoy usando ViveChat 🟣"
              className="w-full px-3 py-2 bg-purple-50 dark:bg-purple-950/40 rounded-xl text-sm border border-purple-200 dark:border-purple-800/60 focus:border-purple-500 outline-none text-gray-900 dark:text-purple-100"
            />
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold shadow hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            {savedSuccess ? <Check className="w-5 h-5 text-green-300" /> : null}
            <span>{savedSuccess ? '¡Guardado con éxito!' : 'Guardar Cambios'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
