import * as React from 'react';
import { useState } from 'react';
import { AuthProvider, useAuth } from './components/AuthContext';
import { PassengerView } from './components/PassengerView';
import { DriverView } from './components/DriverView';
import { SupportChat } from './components/SupportChat';
import { Button } from './components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Toaster } from './components/ui/sonner';
import { Car, User, LogOut, ShieldCheck, Map as MapIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function Dashboard() {
  const { user, profile, signOut, updateRole } = useAuth();
  const [activeTab, setActiveTab] = useState(profile?.role || 'passenger');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-xl">
            <Car className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-slate-900">Amuvi</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end">
            <p className="text-sm font-bold text-slate-800">{user?.displayName}</p>
            <p className="text-xs text-slate-500 capitalize">{profile?.role}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut} className="text-slate-400 hover:text-red-500">
            <LogOut size={20} />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <Tabs value={activeTab} onValueChange={(v) => {
          setActiveTab(v);
          updateRole(v as 'passenger' | 'driver');
        }} className="space-y-6">
          <div className="flex justify-center">
            <TabsList className="bg-slate-200/50 p-1 h-12 rounded-2xl">
              <TabsTrigger value="passenger" className="rounded-xl px-8 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Passageiro
              </TabsTrigger>
              <TabsTrigger value="driver" className="rounded-xl px-8 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Motorista
              </TabsTrigger>
            </TabsList>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TabsContent value="passenger" className="mt-0">
                <PassengerView />
              </TabsContent>
              <TabsContent value="driver" className="mt-0">
                <DriverView />
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </main>

      <SupportChat />
      <Toaster position="top-center" />
    </div>
  );
}

function Login() {
  const { signIn } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 overflow-hidden relative">
      {/* Background Decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full space-y-8 relative z-10"
      >
        <div className="text-center space-y-4">
          <div className="inline-block bg-blue-600 p-4 rounded-[2rem] shadow-2xl shadow-blue-500/20">
            <Car className="text-white w-12 h-12" />
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter">Amuvi</h1>
          <p className="text-slate-400 text-lg">Sua corrida rápida, segura e inteligente.</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-white/80">
              <ShieldCheck className="text-blue-400" />
              <p className="text-sm">Segurança em primeiro lugar</p>
            </div>
            <div className="flex items-center gap-3 text-white/80">
              <MapIcon className="text-blue-400" />
              <p className="text-sm">Rastreamento em tempo real</p>
            </div>
          </div>

          <Button 
            onClick={signIn}
            className="w-full h-14 text-lg font-bold bg-white text-slate-900 hover:bg-slate-100 rounded-2xl transition-all"
          >
            Entrar com Google
          </Button>
          
          <p className="text-center text-xs text-slate-500">
            Ao entrar, você concorda com nossos Termos de Uso e Política de Privacidade.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-blue-400 font-bold animate-pulse">Carregando Amuvi...</p>
        </div>
      </div>
    );
  }

  return user ? <Dashboard /> : <Login />;
}

