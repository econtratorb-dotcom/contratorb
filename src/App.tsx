import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Building2, 
  Tags, 
  FileText, 
  Settings, 
  Menu, 
  ChevronLeft,
  LogOut,
  ShieldCheck,
  HardHat,
  FileSignature
} from 'lucide-react';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, onAuthStateChanged, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { ModuleType, AppConfig } from './types';
import { motion, AnimatePresence } from 'motion/react';

// Components
import Dashboard from './components/Dashboard';
import Fornecedores from './components/Fornecedores';
import Projetos from './components/Projetos';
import Unidades from './components/Unidades';
import Categorias from './components/Categorias';
import Contratos from './components/Contratos';
import { handleFirestoreError, OperationType } from './lib/firestoreErrorHandler';
import Configuracoes from './components/Configuracoes';
import Portal from './components/Portal';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState<ModuleType>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth State Changed:", user ? { uid: user.uid, email: user.email } : "No user");
      if (!isOffline) {
        setUser(user);
        setLoading(false);
        if (user) {
          onSnapshot(doc(db, 'configuracoes', user.uid), (doc) => {
            if (doc.exists()) {
              setConfig(doc.data() as AppConfig);
            }
          }, (error) => {
            handleFirestoreError(error, OperationType.GET, `configuracoes/${user.uid}`);
          });
        }
      }
    });
    return () => unsubscribe();
  }, [isOffline]);

  const handleOfflineLogin = () => {
    setIsOffline(true);
    setUser({
      uid: 'offline-user',
      displayName: 'Usuário Offline',
      email: 'offline@gruporb.com.br',
      photoURL: 'https://ui-avatars.com/api/?name=Offline+User&background=059669&color=fff'
    });
    setConfig({
      empresa_nome: 'GRUPORB (OFFLINE)',
      cor_primaria: '#059669',
      logo_base64: '',
      rodape_texto: 'Sistema operando em modo de demonstração offline.'
    });
    setLoading(false);
  };

  const handleLogin = async () => {
    try {
      setIsOffline(false);
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleEmailLogin = async () => {
    try {
      setIsOffline(false);
      await signInWithEmailAndPassword(auth, 'fecampos120@gmail.com', '@adm2026');
    } catch (error) {
      console.error("Email login error:", error);
      alert("Erro ao entrar: Verifique se o provedor 'E-mail/Senha' está ativo no Console do Firebase.");
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setUser(null);
    setIsOffline(false);
    setActiveModule(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-12 h-12 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">E-Contratado</h1>
          <p className="text-slate-500 mb-8">Sistema de Gestão GRUPORB</p>
          
          <div className="space-y-4">
            <button 
              onClick={handleEmailLogin}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              Entrar como Administrador
            </button>
            <button 
              onClick={handleOfflineLogin}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              Entrar em Modo Offline
            </button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400">Ou use Google</span></div>
            </div>
            <button 
              onClick={handleLogin}
              className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
              Entrar com Google
            </button>
          </div>
          <p className="mt-8 text-xs text-slate-400">© 2026 GRUPORB - Todos os direitos reservados</p>
        </motion.div>
      </div>
    );
  }

  if (!activeModule) {
    return <Portal onSelectModule={setActiveModule} user={user} onLogout={handleLogout} />;
  }

  const menuItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'fornecedores', label: 'Fornecedores', icon: Users },
    { id: 'projetos', label: 'Projetos', icon: Briefcase },
    { id: 'unidades', label: 'Unidades', icon: Building2 },
    { id: 'categorias', label: 'Categorias', icon: Tags },
    { id: 'contratos', label: 'Contratos', icon: FileText },
    { id: 'configuracoes', label: 'Configurações', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <motion.aside 
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="bg-emerald-900 border-r border-emerald-800 flex flex-col transition-all duration-300 overflow-hidden"
      >
        <div className="p-6 flex items-center gap-4">
          <div className="w-10 h-10 bg-white rounded-xl flex-shrink-0 flex items-center justify-center text-emerald-900 font-bold">
            {config?.logo_base64 ? <img src={config.logo_base64} className="w-full h-full object-contain rounded-xl" alt="Logo" /> : 'RB'}
          </div>
          {sidebarOpen && <span className="font-bold text-white truncate">{config?.empresa_nome || 'GRUPORB'}</span>}
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-white/10 text-white font-semibold' 
                  : 'text-emerald-100/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10 space-y-1">
          <button 
            onClick={() => setActiveModule(null)}
            className="w-full flex items-center gap-3 p-3 text-emerald-100/70 hover:bg-white/5 hover:text-white rounded-xl transition-all text-sm"
          >
            <ChevronLeft className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Voltar ao Portal</span>}
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all text-sm"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
        <header className="h-16 bg-white border-b border-slate-100 px-8 flex items-center justify-between flex-shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-500 transition-all">
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
              {menuItems.find(i => i.id === activeTab)?.label}
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {activeModule}
              </span>
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-900">{user.displayName || user.email}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{user.email}</p>
            </div>
            <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} className="w-10 h-10 rounded-xl border-2 border-white shadow-md" alt="Avatar" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-[1600px] mx-auto w-full"
            >
              {activeTab === 'dashboard' && <Dashboard user={user} />}
              {activeTab === 'fornecedores' && <Fornecedores user={user} />}
              {activeTab === 'projetos' && <Projetos user={user} />}
              {activeTab === 'unidades' && <Unidades user={user} />}
              {activeTab === 'categorias' && <Categorias user={user} />}
              {activeTab === 'contratos' && <Contratos user={user} config={config} />}
              {activeTab === 'configuracoes' && <Configuracoes user={user} config={config} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
