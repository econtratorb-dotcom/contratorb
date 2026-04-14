import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { Unidade } from '../types';
import { Plus, Trash2, Building2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function Unidades({ user }: { user: any }) {
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newUnidade, setNewUnidade] = useState({ nome: '', cnpj: '', endereco: '' });

  useEffect(() => {
    const q = query(collection(db, 'unidades'), where('user_id', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnidades(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Unidade)));
    });
    return () => unsubscribe();
  }, [user.uid]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'unidades'), {
      ...newUnidade,
      user_id: user.uid,
      createdAt: new Date().toISOString()
    });
    setShowAdd(false);
    setNewUnidade({ nome: '', cnpj: '', endereco: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={() => setShowAdd(true)} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-semibold flex items-center gap-2">
          <Plus className="w-5 h-5" /> Nova Unidade
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {unidades.map(u => (
          <div key={u.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <button onClick={() => deleteDoc(doc(db, 'unidades', u.id))} className="text-slate-300 hover:text-red-500">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">{u.nome}</h3>
            <p className="text-xs text-slate-400 mb-4">{u.cnpj}</p>
            <p className="text-sm text-slate-500">{u.endereco}</p>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-lg w-full">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Nova Unidade</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <input 
                type="text" placeholder="Nome da Unidade" required
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none"
                value={newUnidade.nome} onChange={e => setNewUnidade({...newUnidade, nome: e.target.value})}
              />
              <input 
                type="text" placeholder="CNPJ" required
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none"
                value={newUnidade.cnpj} onChange={e => setNewUnidade({...newUnidade, cnpj: e.target.value})}
              />
              <input 
                type="text" placeholder="Endereço Completo" required
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none"
                value={newUnidade.endereco} onChange={e => setNewUnidade({...newUnidade, endereco: e.target.value})}
              />
              <div className="flex gap-4 mt-8">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-4 text-slate-500 font-semibold">Cancelar</button>
                <button type="submit" className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-semibold">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
