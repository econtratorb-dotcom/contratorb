import React from 'react';
import { FileText, HardHat, ClipboardCheck, ArrowRight, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import { ModuleType } from '../types';

interface PortalProps {
  onSelectModule: (module: ModuleType) => void;
  user: any;
  onLogout: () => void;
}

export default function Portal({ onSelectModule, user, onLogout }: PortalProps) {
  const modules = [
    { 
      id: 'Contratos' as const, 
      label: 'Gestão de Contratos', 
      icon: FileText, 
      color: 'text-emerald-600', 
      bgColor: 'bg-emerald-50',
      borderColor: 'border-t-emerald-500',
      desc: 'Homologação de fornecedores, geração de minutas, gestão de unidades e dashboard administrativo.',
      action: 'Acessar Painel'
    },
    { 
      id: 'Engenharia' as const, 
      label: 'Engenharia e Projetos', 
      icon: HardHat, 
      color: 'text-blue-600', 
      bgColor: 'bg-blue-50',
      borderColor: 'border-t-blue-500',
      desc: 'Cadastro de projetos (CAPEX/OPEX), escopo técnico, upload de plantas e checklist de NRs obrigatórias.',
      action: 'Acessar Projetos'
    },
    { 
      id: 'Compliance' as const, 
      label: 'Segurança e RH', 
      icon: ClipboardCheck, 
      color: 'text-orange-600', 
      bgColor: 'bg-orange-50',
      borderColor: 'border-t-orange-500',
      desc: 'Ficha de requisitos para fornecedores. Checklist de documentos de empresa e colaboradores (PGR, ASO, NRs).',
      action: 'Gerar Ficha'
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative">
      <button 
        onClick={onLogout} 
        className="absolute top-8 right-8 p-3 bg-white text-slate-400 hover:text-red-500 rounded-2xl shadow-sm transition-all flex items-center gap-2"
      >
        <LogOut className="w-5 h-5" />
        <span className="text-sm font-bold">Sair</span>
      </button>

      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-emerald-900 mb-4">Portal Corporativo GRUPORB</h1>
        <p className="text-slate-500 text-lg">Selecione o módulo de acesso</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl w-full">
        {modules.map((mod, idx) => (
          <motion.div
            key={mod.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`bg-white p-10 rounded-[2rem] border-t-4 ${mod.borderColor} shadow-xl shadow-slate-200/50 flex flex-col h-full`}
          >
            <div className={`${mod.bgColor} w-16 h-16 rounded-2xl flex items-center justify-center mb-8`}>
              <mod.icon className={`w-8 h-8 ${mod.color}`} />
            </div>
            
            <h3 className="text-2xl font-bold text-slate-900 mb-4">{mod.label}</h3>
            <p className="text-slate-500 leading-relaxed mb-8 flex-1">{mod.desc}</p>
            
            <button 
              onClick={() => onSelectModule(mod.id)}
              className={`flex items-center gap-2 font-bold ${mod.color} hover:gap-4 transition-all`}
            >
              {mod.action} <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        ))}
      </div>
      
      <p className="mt-16 text-slate-400 text-sm font-medium">© 2026 GRUPORB - Sistema EcoContract</p>
    </div>
  );
}
