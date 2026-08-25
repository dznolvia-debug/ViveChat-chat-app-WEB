import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  ShieldCheck,
  ChevronDown,
  Camera,
  ArrowRight,
  Sparkles,
  User as UserIcon,
  CheckCircle2,
  Lock,
  Phone,
  GraduationCap,
  Briefcase,
  Globe,
  AlertTriangle,
  Radio,
  RefreshCw,
  Edit3,
  KeyRound,
  Check,
  Info,
  Smartphone
} from 'lucide-react';
import { User, Contact } from '../../types';
import { storage } from '../../utils/storage';
import { normalizePhone } from '../../context/ChatContext';
import { ALL_COUNTRIES, CountryInfo, detectDeviceCountry, getDefaultCarrierForCountry } from '../../utils/countryCodes';
import { CountryPickerModal } from '../common/CountryPickerModal';

interface OnboardingScreenProps {
  onComplete: (user: User) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
];

// Device SIM Chip configuration
interface DeviceSimCard {
  carrier: string;
  country: CountryInfo;
  phoneNumber: string;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState<'welcome' | 'phone' | 'verify' | 'profile' | 'initializing'>('welcome');
  
  // Default inserted SIM card in this phone with country auto-detection
  const [deviceSim, setDeviceSim] = useState<DeviceSimCard>(() => {
    const autoCountry = detectDeviceCountry();
    const carrier = getDefaultCarrierForCountry(autoCountry.code);
    return {
      carrier,
      country: autoCountry,
      phoneNumber: '9876 5432',
    };
  });

  // Form State
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo>(deviceSim.country);
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [phoneNumberOnly, setPhoneNumberOnly] = useState(deviceSim.phoneNumber);
  
  // Verification states
  const [verificationDigits, setVerificationDigits] = useState(['', '', '', '', '', '']);
  const [activeCodeIndex, setActiveCodeIndex] = useState(0);
  const [receivedSmsCode, setReceivedSmsCode] = useState('749182');
  const [showSimMismatchModal, setShowSimMismatchModal] = useState(false);
  const [showInvalidFormatModal, setShowInvalidFormatModal] = useState<{ title: string; desc: string } | null>(null);
  const [isSimVerifiedAuto, setIsSimVerifiedAuto] = useState(false);
  const [countdown, setCountdown] = useState(45);
  const [simCardSettingOpen, setSimCardSettingOpen] = useState(false);

  // Profile Form
  const [name, setName] = useState('');
  const [about, setAbout] = useState('¡Hola! Estoy usando ViveChat 🟣');
  const [avatar, setAvatar] = useState(PRESET_AVATARS[0]);
  const [userRole, setUserRole] = useState<'student' | 'teacher' | 'custom'>('custom');

  // Quick Preset Selection
  const selectPreset = (type: 'student' | 'teacher') => {
    if (type === 'student') {
      const usCountry = ALL_COUNTRIES.find(c => c.dialCode === '+1') || ALL_COUNTRIES[0];
      setUserRole('student');
      setDeviceSim({
        carrier: 'AT&T / T-Mobile 5G',
        country: usCountry,
        phoneNumber: '555 0101',
      });
      setSelectedCountry(usCountry);
      setPhoneNumberOnly('555 0101');
      setName('Alex (Estudiante)');
      setAvatar(PRESET_AVATARS[0]);
      setAbout('¡Hola! Estoy usando ViveChat 🟣');
    } else {
      const usCountry = ALL_COUNTRIES.find(c => c.dialCode === '+1') || ALL_COUNTRIES[0];
      setUserRole('teacher');
      setDeviceSim({
        carrier: 'Verizon 5G Ultra',
        country: usCountry,
        phoneNumber: '555 0202',
      });
      setSelectedCountry(usCountry);
      setPhoneNumberOnly('555 0202');
      setName('Prof. Carlos Martínez');
      setAvatar(PRESET_AVATARS[1]);
      setAbout('Profesor titular • Horario de consultas 9am - 6pm 📚');
    }
  };

  const getFullPhone = () => {
    const cleaned = phoneNumberOnly.trim();
    return `${selectedCountry.dialCode} ${cleaned}`;
  };

  const getSimFullPhone = () => {
    return `${deviceSim.country.dialCode} ${deviceSim.phoneNumber.trim()}`;
  };

  // Check if entered number matches the physical SIM in this device
  const doesMatchSim = () => {
    const enteredNorm = normalizePhone(getFullPhone());
    const simNorm = normalizePhone(getSimFullPhone());
    return enteredNorm === simNorm;
  };

  // Timer countdown for SMS resend
  useEffect(() => {
    if (step === 'verify' && countdown > 0) {
      const timer = setInterval(() => setCountdown(c => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [step, countdown]);

  // Handle clicking "Siguiente" on Phone registration
  const handleProceedToVerify = () => {
    const digitsOnly = phoneNumberOnly.replace(/\D/g, '');
    
    // 1. Validation: Too short or invalid
    if (digitsOnly.length < 6) {
      setShowInvalidFormatModal({
        title: 'Número no válido',
        desc: `El número «${selectedCountry.dialCode} ${phoneNumberOnly}» es demasiado corto para el país ${selectedCountry.name}. Por favor verifica el número e inténtalo de nuevo.`
      });
      return;
    }

    // 2. Check if SIM matches
    const matched = doesMatchSim();
    if (matched) {
      // SIM matches! Automatic verification like WhatsApp when SIM is in current phone
      setIsSimVerifiedAuto(true);
      setVerificationDigits(['7', '4', '9', '1', '8', '2']);
      setStep('verify');
    } else {
      // SIM MISMATCH! WhatsApp detects the SIM is not in this phone!
      setShowSimMismatchModal(true);
    }
  };

  // User decides to continue with manual SMS code (the chip is in another phone)
  const handleContinueManualSms = () => {
    setShowSimMismatchModal(false);
    setIsSimVerifiedAuto(false);
    setVerificationDigits(['', '', '', '', '', '']);
    setCountdown(45);
    setStep('verify');
  };

  // User decides to use the actual SIM number detected in this device
  const handleUseDetectedSim = () => {
    setSelectedCountry(deviceSim.country);
    setPhoneNumberOnly(deviceSim.phoneNumber);
    setShowSimMismatchModal(false);
  };

  const handleDigitInput = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newDigits = [...verificationDigits];
    newDigits[index] = val.slice(-1);
    setVerificationDigits(newDigits);

    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !verificationDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleAutoFillReceivedSms = () => {
    const digits = receivedSmsCode.split('');
    setVerificationDigits(digits);
  };

  const isCodeComplete = verificationDigits.every(d => d !== '');

  const handleFinishRegistration = () => {
    setStep('initializing');
    const fullPhone = getFullPhone();
    const existingUsers = storage.getUsers();
    
    // Check if user already exists with this phone number
    let targetUser = existingUsers.find(u => normalizePhone(u.phone) === normalizePhone(fullPhone));

    if (!targetUser) {
      targetUser = {
        id: 'user_' + Date.now(),
        name: name.trim() || 'Usuario',
        phone: fullPhone,
        avatar: avatar || PRESET_AVATARS[0],
        about: about.trim() || 'Disponible',
        isOnline: true,
      };
      const updatedUsers = [...existingUsers, targetUser];
      storage.saveUsers(updatedUsers);
      // Ensure empty agenda and no default contacts for brand new registered users
      storage.saveContacts(targetUser.id, []);
    } else {
      // Update existing
      targetUser = {
        ...targetUser,
        name: name.trim() || targetUser.name,
        avatar: avatar || targetUser.avatar,
        about: about.trim() || targetUser.about,
        isOnline: true,
      };
      const updatedUsers = existingUsers.map(u => u.id === targetUser!.id ? targetUser! : u);
      storage.saveUsers(updatedUsers);
    }

    // Set as active session
    storage.setActiveUserId(targetUser.id);
    storage.setCompletedOnboarding(true);

    setTimeout(() => {
      onComplete(targetUser!);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#7c3aed] dark:bg-[#120822] flex items-center justify-center p-3 sm:p-4 select-none overflow-y-auto">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.15),transparent_70%)] pointer-events-none" />

      {/* Onboarding Card */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#1c122c] rounded-3xl shadow-2xl border border-white/20 dark:border-purple-800/60 overflow-hidden flex flex-col min-h-[550px] my-auto">
        {/* Top Purple Gradient Header */}
        <div className="bg-gradient-to-r from-purple-700 to-indigo-700 p-5 text-white text-center flex flex-col items-center relative shadow-md">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg mb-2 ring-4 ring-white/10">
            <MessageSquare className="w-7 h-7 text-white fill-white/20" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">ViveChat</h1>
          <p className="text-xs text-purple-200/90 mt-0.5">Mensajería en tiempo real estilo WhatsApp</p>
        </div>

        {/* Step 1: Welcome Screen */}
        {step === 'welcome' && (
          <div className="flex-1 p-6 flex flex-col items-center justify-between text-center">
            <div className="my-auto flex flex-col items-center gap-3.5 max-w-xs">
              <div className="w-18 h-18 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-300 flex items-center justify-center shadow-inner">
                <Sparkles className="w-9 h-9" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-purple-100">
                Te damos la bienvenida
              </h2>
              <p className="text-xs text-slate-600 dark:text-purple-300/80 leading-relaxed">
                Comunícate con tus contactos mediante número telefónico real con detección de tarjeta SIM (chip) y verificación mundial.
              </p>
              
              <div className="flex items-center gap-1.5 text-[11px] text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/40 px-3 py-1.5 rounded-full border border-purple-200 dark:border-purple-800">
                <Lock className="w-3.5 h-3.5" />
                <span>Cifrado de extremo a extremo sin bots</span>
              </div>
            </div>

            <div className="w-full pt-4">
              <p className="text-[11px] text-slate-400 dark:text-purple-400/70 mb-4 px-2">
                Toca «Aceptar y continuar» para aceptar las Condiciones del servicio y verificar tu tarjeta SIM.
              </p>
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
              >
                <span>Aceptar y continuar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Phone Number & SIM Card Detection */}
        {step === 'phone' && (
          <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold text-slate-800 dark:text-purple-100">
                  Ingresa tu número de teléfono
                </h2>
                <p className="text-xs text-slate-500 dark:text-purple-300/80 mt-0.5">
                  ViveChat verificará si el número coincide con la tarjeta SIM insertada en este teléfono.
                </p>
              </div>

              {/* Physical SIM Card Status on this Phone */}
              <div className="mb-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/70 dark:to-indigo-950/70 p-3 rounded-2xl border border-purple-200 dark:border-purple-800/80 shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-800 dark:text-purple-200">
                    <Radio className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                    <span>Tarjeta SIM (Chip) en este dispositivo:</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSimCardSettingOpen(!simCardSettingOpen)}
                    className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold hover:underline flex items-center gap-0.5"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{simCardSettingOpen ? 'Cerrar' : 'Configurar SIM'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between bg-white dark:bg-[#160d24] p-2.5 rounded-xl border border-purple-100 dark:border-purple-900/60">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg shrink-0">{deviceSim.country.flag}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-purple-100 font-mono leading-tight truncate">
                        {deviceSim.country.dialCode} {deviceSim.phoneNumber}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-purple-300/70 truncate">
                        Operador: {deviceSim.carrier}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCountry(deviceSim.country);
                      setPhoneNumberOnly(deviceSim.phoneNumber);
                    }}
                    className="shrink-0 px-2 py-1 bg-purple-100 dark:bg-purple-900/60 hover:bg-purple-200 text-purple-700 dark:text-purple-200 rounded-lg text-[11px] font-semibold transition-colors"
                  >
                    Usar este chip
                  </button>
                </div>

                {/* Optional: Configure simulated chip on this physical phone */}
                {simCardSettingOpen && (
                  <div className="mt-2.5 pt-2.5 border-t border-purple-200 dark:border-purple-900 flex flex-col gap-2 animate-in fade-in">
                    <span className="text-[11px] text-slate-600 dark:text-purple-300 font-medium">
                      Simular chip insertado en este celular:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const hn = ALL_COUNTRIES.find(c => c.code === 'HN') || ALL_COUNTRIES[0];
                          setDeviceSim({ carrier: 'Tigo 4G LTE', country: hn, phoneNumber: '9876 5432' });
                          setSimCardSettingOpen(false);
                        }}
                        className="text-left text-[11px] p-2 rounded-lg bg-white dark:bg-[#1a0f2b] border border-purple-200 dark:border-purple-800 text-slate-800 dark:text-purple-200 hover:border-purple-500"
                      >
                        🇭🇳 Honduras: +504 9876 5432
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const mx = ALL_COUNTRIES.find(c => c.code === 'MX') || ALL_COUNTRIES[0];
                          setDeviceSim({ carrier: 'Telcel 5G', country: mx, phoneNumber: '55 1234 5678' });
                          setSimCardSettingOpen(false);
                        }}
                        className="text-left text-[11px] p-2 rounded-lg bg-white dark:bg-[#1a0f2b] border border-purple-200 dark:border-purple-800 text-slate-800 dark:text-purple-200 hover:border-purple-500"
                      >
                        🇲🇽 México: +52 55 1234 5678
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const es = ALL_COUNTRIES.find(c => c.code === 'ES') || ALL_COUNTRIES[0];
                          setDeviceSim({ carrier: 'Movistar 5G', country: es, phoneNumber: '612 34 56 78' });
                          setSimCardSettingOpen(false);
                        }}
                        className="text-left text-[11px] p-2 rounded-lg bg-white dark:bg-[#1a0f2b] border border-purple-200 dark:border-purple-800 text-slate-800 dark:text-purple-200 hover:border-purple-500"
                      >
                        🇪🇸 España: +34 612 34 56 78
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const us = ALL_COUNTRIES.find(c => c.code === 'US') || ALL_COUNTRIES[0];
                          setDeviceSim({ carrier: 'AT&T 5G', country: us, phoneNumber: '555 0101' });
                          setSimCardSettingOpen(false);
                        }}
                        className="text-left text-[11px] p-2 rounded-lg bg-white dark:bg-[#1a0f2b] border border-purple-200 dark:border-purple-800 text-slate-800 dark:text-purple-200 hover:border-purple-500"
                      >
                        🇺🇸 EE.UU: +1 555 0101
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Country Selector with Full World Search Modal */}
              <div className="mb-3">
                <label className="block text-xs font-semibold text-slate-600 dark:text-purple-300 mb-1">
                  País o Territorio
                </label>
                <button
                  type="button"
                  onClick={() => setIsCountryModalOpen(true)}
                  className="w-full flex items-center justify-between bg-slate-50 dark:bg-[#231838] border border-slate-200 dark:border-purple-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-purple-100 font-medium hover:border-purple-500 transition-colors shadow-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg">{selectedCountry.flag}</span>
                    <span className="truncate font-semibold">{selectedCountry.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono font-bold text-purple-600 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 rounded-md">
                      {selectedCountry.dialCode}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </div>
                </button>
              </div>

              {/* Phone Input */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-purple-300">
                    Número de teléfono
                  </label>
                  {!doesMatchSim() && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-0.5">
                      <AlertTriangle className="w-3 h-3" />
                      Difiere de la SIM insertada
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCountryModalOpen(true)}
                    className="w-20 bg-slate-100 dark:bg-[#231838] hover:bg-purple-50 dark:hover:bg-purple-900/40 border border-slate-200 dark:border-purple-800 rounded-xl px-2 py-2.5 text-xs text-slate-700 dark:text-purple-200 font-mono font-bold text-center transition-colors shrink-0"
                    title="Cambiar código de país"
                  >
                    {selectedCountry.dialCode}
                  </button>
                  <input
                    type="tel"
                    value={phoneNumberOnly}
                    onChange={(e) => {
                      setPhoneNumberOnly(e.target.value);
                      setUserRole('custom');
                    }}
                    placeholder="9999 9999"
                    className="flex-1 bg-slate-50 dark:bg-[#231838] border border-slate-200 dark:border-purple-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-purple-100 font-mono outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-400"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setStep('welcome')}
                className="px-4 py-3 rounded-xl border border-slate-200 dark:border-purple-800 text-slate-600 dark:text-purple-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-purple-900/30"
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={handleProceedToVerify}
                disabled={!phoneNumberOnly.trim()}
                className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Siguiente</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Verification (Automatic via SIM or Manual SMS Code) */}
        {step === 'verify' && (
          <div className="flex-1 p-6 flex flex-col justify-between text-center">
            <div>
              {isSimVerifiedAuto ? (
                /* Auto SIM Verification Match */
                <div className="flex flex-col items-center animate-in fade-in">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 shadow-inner ring-4 ring-emerald-50 dark:ring-emerald-900/30">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-purple-100">
                    Tarjeta SIM Verificada
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-purple-300/80 mt-1 max-w-xs">
                    El número coincide con la tarjeta SIM insertada en este teléfono. Se ha verificado automáticamente de forma instantánea sin escribir SMS.
                  </p>

                  <div className="my-5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-3.5 w-full max-w-xs text-left">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      <Radio className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Verificación telefónica completada</span>
                    </div>
                    <p className="text-xs font-mono text-emerald-700 dark:text-emerald-200 mt-1 font-semibold">
                      {getFullPhone()}
                    </p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                      Lectura de tarjeta SIM exitosa en este dispositivo.
                    </p>
                  </div>
                </div>
              ) : (
                /* Manual SMS Verification (When SIM is in another phone) */
                <div className="flex flex-col items-center animate-in fade-in">
                  <div className="w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center mb-2.5 shadow-inner">
                    <KeyRound className="w-7 h-7" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-purple-100">
                    Ingresa el código SMS
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-purple-300/80 mt-1 max-w-xs">
                    Como este teléfono no tiene insertada la SIM de este número, enviamos un código de 6 dígitos al celular con la SIM de <strong className="font-mono text-purple-700 dark:text-purple-300">{getFullPhone()}</strong>.
                  </p>

                  {/* SMS Simulation Banner */}
                  <div className="mt-3 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800/70 rounded-2xl p-2.5 text-left w-full max-w-xs shadow-xs">
                    <div className="flex items-center justify-between text-[11px] text-indigo-700 dark:text-indigo-300 font-semibold mb-1">
                      <span>📨 SMS recibido en tu otro teléfono:</span>
                      <button
                        type="button"
                        onClick={handleAutoFillReceivedSms}
                        className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-md hover:bg-indigo-700 transition-colors font-bold"
                      >
                        Autorrellenar {receivedSmsCode}
                      </button>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-indigo-200 font-mono">
                      «Tu código ViveChat es: <strong className="text-indigo-600 dark:text-indigo-300">{receivedSmsCode}</strong>»
                    </p>
                  </div>

                  {/* 6 Digit Inputs */}
                  <div className="my-5 flex justify-center gap-2">
                    {verificationDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-input-${idx}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitInput(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        className="w-10 h-12 text-center rounded-xl bg-purple-50 dark:bg-[#231838] border-2 border-purple-300 dark:border-purple-700 focus:border-purple-600 outline-none font-mono text-lg font-bold text-purple-800 dark:text-purple-100 shadow-xs transition-all"
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between w-full max-w-xs text-xs text-slate-500 dark:text-purple-300/70 px-1">
                    <span>¿No recibiste el código?</span>
                    {countdown > 0 ? (
                      <span className="font-mono font-medium text-purple-600 dark:text-purple-400">
                        Reenviar en {countdown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setCountdown(45);
                          setReceivedSmsCode(String(Math.floor(100000 + Math.random() * 900000)));
                        }}
                        className="text-purple-600 dark:text-purple-400 font-bold hover:underline"
                      >
                        Reenviar SMS
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="px-4 py-3 rounded-xl border border-slate-200 dark:border-purple-800 text-slate-600 dark:text-purple-300 text-xs font-semibold hover:bg-slate-50"
              >
                Editar número
              </button>
              <button
                type="button"
                onClick={() => setStep('profile')}
                disabled={!isSimVerifiedAuto && !isCodeComplete}
                className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Continuar al perfil</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Profile Information */}
        {step === 'profile' && (
          <div className="flex-1 p-6 flex flex-col justify-between">
            <div>
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold text-slate-800 dark:text-purple-100">
                  Información del perfil
                </h2>
                <p className="text-xs text-slate-500 dark:text-purple-300/80 mt-0.5">
                  Ingresa tu nombre y elige una foto de perfil.
                </p>
              </div>

              {/* Avatar Selector */}
              <div className="flex flex-col items-center gap-2 mb-4">
                <div className="relative group">
                  <img
                    src={avatar}
                    alt="Profile Avatar"
                    className="w-20 h-20 rounded-full object-cover shadow-lg ring-4 ring-purple-200 dark:ring-purple-900/60"
                  />
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer">
                    <Camera className="w-6 h-6" />
                  </div>
                </div>

                {/* Avatar presets */}
                <div className="flex items-center gap-1.5 mt-1">
                  {PRESET_AVATARS.map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatar(av)}
                      className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-transform ${
                        avatar === av ? 'border-purple-600 scale-110 shadow-xs' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={av} alt="preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Name Input */}
              <div className="mb-3">
                <label className="block text-xs font-semibold text-slate-600 dark:text-purple-300 mb-1">
                  Tu nombre (se mostrará a tus contactos)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Alex o Prof. Carlos"
                  className="w-full bg-slate-50 dark:bg-[#231838] border border-slate-200 dark:border-purple-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-purple-100 outline-none focus:border-purple-500 font-medium"
                />
              </div>

              {/* Info Status */}
              <div className="mb-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-purple-300 mb-1">
                  Info. / Estado
                </label>
                <input
                  type="text"
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  placeholder="¡Hola! Estoy usando ViveChat 🟣"
                  className="w-full bg-slate-50 dark:bg-[#231838] border border-slate-200 dark:border-purple-800 rounded-xl px-3.5 py-2 text-xs text-slate-700 dark:text-purple-200 outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={handleFinishRegistration}
                disabled={!name.trim()}
                className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
              >
                <span>Comenzar a chatear</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Initializing Screen */}
        {step === 'initializing' && (
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin mb-4" />
            <h3 className="text-base font-bold text-slate-800 dark:text-purple-100 mb-1">
              Iniciando...
            </h3>
            <p className="text-xs text-slate-500 dark:text-purple-300/80 max-w-xs">
              Por favor espera un momento mientras se configuran tus claves de cifrado y tu agenda de contactos.
            </p>
          </div>
        )}
      </div>

      {/* WHATSAPP-STYLE ALERT: SIM CARD MISMATCH MODAL */}
      {showSimMismatchModal && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e1330] w-full max-w-sm rounded-3xl shadow-2xl border border-purple-300 dark:border-purple-700/80 overflow-hidden p-5 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 shadow-inner">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-purple-100 leading-tight">
              ¿No tienes la tarjeta SIM en este teléfono?
            </h3>

            <p className="text-xs text-slate-600 dark:text-purple-200/80 mt-2 leading-relaxed">
              Detectamos que el número que ingresaste (<strong className="font-mono text-purple-700 dark:text-purple-300">{getFullPhone()}</strong>) no coincide con el número del chip insertado en este dispositivo:
            </p>

            {/* Current chip info badge */}
            <div className="w-full my-3 p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-left flex items-center gap-2.5">
              <span className="text-xl">{deviceSim.country.flag}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-purple-900 dark:text-purple-200 font-mono">
                  SIM detectada: {getSimFullPhone()}
                </p>
                <p className="text-[10px] text-purple-600 dark:text-purple-400">
                  {deviceSim.carrier}
                </p>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-purple-300/70 mb-4">
              La verificación automática por SIM no estará disponible. Si continúas con este número, enviaremos un SMS con un código de 6 dígitos que deberás revisar en el teléfono donde tengas puesto ese chip.
            </p>

            <div className="w-full flex flex-col gap-2">
              <button
                type="button"
                onClick={handleUseDetectedSim}
                className="w-full py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Usar número de mi SIM ({deviceSim.phoneNumber})</span>
              </button>

              <button
                type="button"
                onClick={handleContinueManualSms}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-purple-900/50 hover:bg-slate-200 dark:hover:bg-purple-900 text-slate-800 dark:text-purple-200 font-semibold text-xs transition-colors"
              >
                Continuar con código SMS manual
              </button>

              <button
                type="button"
                onClick={() => setShowSimMismatchModal(false)}
                className="w-full py-2 text-slate-400 dark:text-purple-400 hover:text-slate-600 text-xs transition-colors"
              >
                Corregir número
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP-STYLE ALERT: INVALID FORMAT MODAL */}
      {showInvalidFormatModal && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e1330] w-full max-w-xs rounded-2xl shadow-2xl border border-red-200 dark:border-red-900/80 p-5 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950 text-red-600 flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-sm font-bold text-slate-900 dark:text-purple-100">
              {showInvalidFormatModal.title}
            </h3>

            <p className="text-xs text-slate-600 dark:text-purple-200/80 mt-2 mb-4 leading-relaxed">
              {showInvalidFormatModal.desc}
            </p>

            <button
              type="button"
              onClick={() => setShowInvalidFormatModal(null)}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all"
            >
              Revisar número
            </button>
          </div>
        </div>
      )}

      {/* Complete World Country Picker Modal */}
      <CountryPickerModal
        isOpen={isCountryModalOpen}
        onClose={() => setIsCountryModalOpen(false)}
        selectedCountryCode={selectedCountry.dialCode}
        onSelectCountry={(country) => setSelectedCountry(country)}
      />
    </div>
  );
};
