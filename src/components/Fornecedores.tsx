import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Fornecedor } from '../types';
import { Search, Plus, Trash2, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { analyzeRisk } from '../services/geminiService';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

export default function Fornecedores({ user }: { user: any }) {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newFornecedor, setNewFornecedor] = useState({ nome: '', cnpj: '', email: '', categoria_id: '' });
  const [analyzing, setAnalyzing] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'fornecedores'), where('user_id', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFornecedores(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Fornecedor)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'fornecedores');
    });
    return () => unsubscribe();
  }, [user.uid]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'fornecedores'), {
      ...newFornecedor,
      user_id: user.uid,
      status: 'Pendente',
      riscos: [],
      createdAt: new Date().toISOString()
    });
    setShowAdd(false);
    setNewFornecedor({ nome: '', cnpj: '', email: '', categoria_id: '' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir este fornecedor?')) {
      await deleteDoc(doc(db, 'fornecedores', id));
    }
  };

  const handleAnalyze = async (f: Fornecedor) => {
    setAnalyzing(f.id);
    const riscos = await analyzeRisk(f.nome, f.categoria_id || "Serviços Gerais");
    await updateDoc(doc(db, 'fornecedores', f.id), { riscos });
    setAnalyzing(null);
  };

  const filtered = fornecedores.filter(f => f.nome.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Buscar fornecedores..." 
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all"
        >
          <Plus className="w-5 h-5" /> Novo Fornecedor
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fornecedor</th>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Riscos (IA)</th>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(f => (
              <tr key={f.id} className="hover:bg-slate-50 transition-all">
                <td className="px-6 py-4">
                  <p className="text-xs font-bold text-slate-900">{f.nome}</p>
                  <p className="text-[10px] text-slate-400">{f.cnpj}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    f.status === 'Homologado' ? 'bg-emerald-100 text-emerald-600' :
                    f.status === 'Pendente' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {f.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {f.riscos?.map((r, i) => (
                      <span key={i} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md">{r}</span>
                    ))}
                    {!f.riscos?.length && (
                      <button 
                        onClick={() => handleAnalyze(f)}
                        disabled={analyzing === f.id}
                        className="text-[10px] text-emerald-600 hover:underline flex items-center gap-1"
                      >
                        <ShieldAlert className={`w-2.5 h-2.5 ${analyzing === f.id ? 'animate-spin' : ''}`} />
                        {analyzing === f.id ? 'Analisando...' : 'Análise de Risco'}
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    <button className="p-1.5 text-slate-400 hover:text-emerald-600 transition-all"><CheckCircle className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(f.id)} className="p-1.5 text-slate-400 hover:text-red-600 transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Add */}
      {showAdd && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-lg w-full"
          >
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Novo Fornecedor</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <input 
                type="text" placeholder="Nome da Empresa" required
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none"
                value={newFornecedor.nome} onChange={e => setNewFornecedor({...newFornecedor, nome: e.target.value})}
              />
              <input 
                type="text" placeholder="CNPJ" required
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none"
                value={newFornecedor.cnpj} onChange={e => setNewFornecedor({...newFornecedor, cnpj: e.target.value})}
              />
              <input 
                type="email" placeholder="E-mail de Contato" required
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none"
                value={newFornecedor.email} onChange={e => setNewFornecedor({...newFornecedor, email: e.target.value})}
              />
              <div className="flex gap-4 mt-8">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-4 text-slate-500 font-semibold">Cancelar</button>
                <button type="submit" className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-semibold shadow-lg shadow-emerald-200">Salvar</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
