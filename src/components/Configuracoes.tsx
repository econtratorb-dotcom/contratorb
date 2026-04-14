import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { AppConfig } from '../types';
import { Save, Upload, Palette, Type } from 'lucide-react';

export default function Configuracoes({ user, config }: { user: any, config: AppConfig | null }) {
  const [formData, setFormData] = useState<Partial<AppConfig>>(config || {
    empresa_nome: 'GRUPORB',
    cor_primaria: '#059669',
    rodape_texto: '© 2026 GRUPORB - Sistema E-Contratado',
    logo_base64: ''
  });

  const handleSave = async () => {
    await setDoc(doc(db, 'configuracoes', user.uid), {
      ...formData,
      user_id: user.uid
    });
    alert('Configurações salvas!');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo_base64: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <Settings className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">Configurações do Sistema</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-500">
              <Type className="w-4 h-4" /> Nome da Empresa
            </label>
            <input 
              type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none"
              value={formData.empresa_nome} onChange={e => setFormData({...formData, empresa_nome: e.target.value})}
            />
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-500">
              <Palette className="w-4 h-4" /> Cor Primária
            </label>
            <div className="flex gap-4">
              <input 
                type="color" className="w-16 h-14 bg-slate-50 border border-slate-100 rounded-2xl outline-none cursor-pointer"
                value={formData.cor_primaria} onChange={e => setFormData({...formData, cor_primaria: e.target.value})}
              />
              <input 
                type="text" className="flex-1 p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none"
                value={formData.cor_primaria} onChange={e => setFormData({...formData, cor_primaria: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-4 md:col-span-2">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-500">
              <Upload className="w-4 h-4" /> Logotipo da Empresa
            </label>
            <div className="flex items-center gap-6 p-6 border-2 border-dashed border-slate-100 rounded-[2rem]">
              <div className="w-24 h-24 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100">
                {formData.logo_base64 ? <img src={formData.logo_base64} className="w-full h-full object-contain" alt="Logo" /> : <Upload className="text-slate-300" />}
              </div>
              <div className="flex-1">
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="logo-up" />
                <label htmlFor="logo-up" className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold cursor-pointer hover:bg-emerald-700 transition-all">
                  Alterar Logo
                </label>
                <p className="text-xs text-slate-400 mt-2">Recomendado: PNG ou SVG transparente</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 md:col-span-2">
            <label className="text-sm font-bold text-slate-500">Texto do Rodapé (PDF/Sistema)</label>
            <textarea 
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none min-h-[100px]"
              value={formData.rodape_texto} onChange={e => setFormData({...formData, rodape_texto: e.target.value})}
            />
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 flex justify-end">
          <button 
            onClick={handleSave}
            className="bg-emerald-600 text-white px-12 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-200 hover:scale-105 transition-all"
          >
            <Save className="w-5 h-5" /> Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
}

import { Settings } from 'lucide-react';
