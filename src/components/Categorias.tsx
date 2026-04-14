import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { Categoria } from '../types';
import { Plus, Trash2, Tags } from 'lucide-react';
import { motion } from 'motion/react';

export default function Categorias({ user }: { user: any }) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newCat, setNewCat] = useState({ nome: '' });

  useEffect(() => {
    const q = query(collection(db, 'categorias'), where('user_id', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCategorias(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Categoria)));
    });
    return () => unsubscribe();
  }, [user.uid]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'categorias'), {
      ...newCat,
      user_id: user.uid,
      createdAt: new Date().toISOString()
    });
    setShowAdd(false);
    setNewCat({ nome: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={() => setShowAdd(true)} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-semibold flex items-center gap-2">
          <Plus className="w-5 h-5" /> Nova Categoria
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {categorias.map(c => (
          <div key={c.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                <Tags className="w-5 h-5" />
              </div>
              <span className="font-bold text-slate-900">{c.nome}</span>
            </div>
            <button onClick={() => deleteDoc(doc(db, 'categorias', c.id))} className="text-slate-300 hover:text-red-500">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Nova Categoria</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <input 
                type="text" placeholder="Nome da Categoria" required
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none"
                value={newCat.nome} onChange={e => setNewCat({ nome: e.target.value })}
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
