import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { Projeto, Unidade } from '../types';
import { Plus, Trash2, MapPin, HardHat } from 'lucide-react';
import { motion } from 'motion/react';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

export default function Projetos({ user }: { user: any }) {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newProj, setNewProj] = useState({ nome: '', unidade_id: '', nrs: '' });

  useEffect(() => {
    const qP = query(collection(db, 'projetos'), where('user_id', '==', user.uid));
    const unsubscribeP = onSnapshot(qP, (snapshot) => {
      setProjetos(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Projeto)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'projetos');
    });

    const qU = query(collection(db, 'unidades'), where('user_id', '==', user.uid));
    const unsubscribeU = onSnapshot(qU, (snapshot) => {
      setUnidades(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Unidade)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'unidades');
    });

    return () => { unsubscribeP(); unsubscribeU(); };
  }, [user.uid]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'projetos'), {
      ...newProj,
      nrs: newProj.nrs.split(',').map(s => s.trim()),
      user_id: user.uid,
      status: 'Ativo',
      createdAt: new Date().toISOString()
    });
    setShowAdd(false);
    setNewProj({ nome: '', unidade_id: '', nrs: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={() => setShowAdd(true)} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-semibold flex items-center gap-2">
          <Plus className="w-5 h-5" /> Novo Projeto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projetos.map(p => (
          <div key={p.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <HardHat className="w-6 h-6" />
              </div>
              <button onClick={() => deleteDoc(doc(db, 'projetos', p.id))} className="text-slate-300 hover:text-red-500">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{p.nome}</h3>
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
              <MapPin className="w-4 h-4" />
              <span>{unidades.find(u => u.id === p.unidade_id)?.nome || 'Unidade não encontrada'}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {p.nrs.map((nr, i) => (
                <span key={i} className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-lg">NR-{nr}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-lg w-full">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Novo Projeto</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <input 
                type="text" placeholder="Nome do Projeto" required
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none"
                value={newProj.nome} onChange={e => setNewProj({...newProj, nome: e.target.value})}
              />
              <select 
                required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none"
                value={newProj.unidade_id} onChange={e => setNewProj({...newProj, unidade_id: e.target.value})}
              >
                <option value="">Selecionar Unidade</option>
                {unidades.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
              <input 
                type="text" placeholder="NRs (ex: 10, 12, 35)" required
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none"
                value={newProj.nrs} onChange={e => setNewProj({...newProj, nrs: e.target.value})}
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
