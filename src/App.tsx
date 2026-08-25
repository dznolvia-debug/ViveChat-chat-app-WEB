import React, { useEffect, useState } from 'react';
import { ChatProvider, useChat } from './context/ChatContext';
import { CallProvider } from './context/CallContext';
import { Sidebar } from './components/layout/Sidebar';
import { ChatArea } from './components/layout/ChatArea';
import { CallModal } from './components/modals/CallModal';
import { IncomingCallModal } from './components/modals/IncomingCallModal';
import { MediaViewerModal } from './components/chat/MediaViewerModal';
import { SwitchUserModal } from './components/modals/SwitchUserModal';
import { OnboardingScreen } from './components/onboarding/OnboardingScreen';
import { Phone, ArrowRightLeft, Sparkles, ShieldCheck, LogOut, ExternalLink, GraduationCap, Briefcase } from 'lucide-react';

const MainLayout: React.FC = () => {
  const {
    settings,
    currentUser,
    selectedContactPhone,
    selectChatByPhone,
    isRegistered,
    completeOnboarding,
    logoutAndReset,
    switchUser,
    allUsers,
  } = useChat();

  const [isSwitchUserOpen, setIsSwitchUserOpen] = useState(false);

  // Sync dark class with document
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // If user has not registered/onboarded yet, show WhatsApp setup wizard
  if (!isRegistered) {
    return <OnboardingScreen onComplete={completeOnboarding} />;
  }

  // Quick switch between Student (User A) and Professor (User B)
  const isStudent = currentUser.phone.includes('0101') || currentUser.id === 'user_a';
  const targetUser = allUsers.find(u => isStudent ? (u.id === 'user_b' || u.phone.includes('0202')) : (u.id === 'user_a' || u.phone.includes('0101')));

  return (
    <div className="flex flex-col h-screen w-screen bg-[#7c3aed] dark:bg-[#0f0a1c] overflow-hidden text-slate-900 dark:text-purple-50 antialiased font-sans select-none">
      {/* Top Helper & User Switcher Bar */}
      <header className="bg-[#6823d0] dark:bg-[#160e29] border-b border-purple-600/50 dark:border-purple-900/50 text-white px-3 py-1.5 flex items-center justify-between text-xs shadow-sm z-30 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 font-bold tracking-tight">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-xs animate-pulse" />
            <span className="text-white font-semibold">ViveChat</span>
          </div>
          <span className="hidden sm:inline text-purple-200/90 text-[11px] font-normal">
            • Mensajería Real entre Personas (Sin IA)
          </span>
        </div>

        {/* Current Active Account & Switcher Controls */}
        <div className="flex items-center gap-2">
          {/* Active User Badge */}
          <div className="flex items-center gap-1.5 bg-black/25 dark:bg-black/40 px-3 py-1 rounded-full text-[11px] border border-white/10">
            {isStudent ? (
              <GraduationCap className="w-3.5 h-3.5 text-purple-200" />
            ) : (
              <Briefcase className="w-3.5 h-3.5 text-purple-200" />
            )}
            <span className="text-purple-100">
              Sesión: <strong className="font-semibold text-white">{currentUser.name}</strong>
            </span>
            <span className="font-mono text-purple-200 text-[10px]">({currentUser.phone})</span>
          </div>

          {/* Instant Switch between Student & Teacher */}
          {targetUser && (
            <button
              type="button"
              onClick={() => switchUser(targetUser.id)}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full font-medium text-[11px] transition-all border border-white/15 shadow-xs"
              title={`Cambiar a ${targetUser.name}`}
            >
              <ArrowRightLeft className="w-3 h-3" />
              <span className="hidden md:inline">Cambiar a {targetUser.name.split(' ')[0]}</span>
              <span className="md:hidden">Alternar</span>
            </button>
          )}

          {/* User selector modal trigger */}
          <button
            type="button"
            onClick={() => setIsSwitchUserOpen(true)}
            className="p-1 rounded-full hover:bg-white/15 text-purple-200 hover:text-white transition-colors"
            title="Ver todos los perfiles"
          >
            <Phone className="w-3.5 h-3.5" />
          </button>

          {/* Log out / Re-register */}
          <button
            type="button"
            onClick={logoutAndReset}
            className="p-1 rounded-full hover:bg-white/15 text-purple-200 hover:text-white transition-colors"
            title="Cerrar sesión / Registrar otro número"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main WhatsApp Window Container */}
      <div className="flex-1 flex overflow-hidden w-full h-[calc(100vh-36px)] shadow-2xl bg-white dark:bg-[#191024] relative">
        {/* Sidebar (Chat list, tabs, status, calls, contacts) */}
        <div className={`${selectedContactPhone ? 'hidden md:flex' : 'flex'} w-full md:w-[360px] lg:w-[400px] h-full shrink-0 border-r border-slate-200 dark:border-purple-900/40`}>
          <Sidebar />
        </div>

        {/* Chat Area (Conversation window, wallpaper, multimedia, call triggers) */}
        <div className={`${selectedContactPhone ? 'flex' : 'hidden md:flex'} flex-1 h-full bg-[#efe7fd] dark:bg-[#120a1b]`}>
          <ChatArea onBackToSidebar={() => selectChatByPhone('')} />
        </div>
      </div>

      {/* Global Overlays & Modals */}
      <CallModal />
      <IncomingCallModal />
      <MediaViewerModal />
      <SwitchUserModal isOpen={isSwitchUserOpen} onClose={() => setIsSwitchUserOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <ChatProvider>
      <CallProvider>
        <MainLayout />
      </CallProvider>
    </ChatProvider>
  );
}
