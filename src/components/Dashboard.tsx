import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Users, Briefcase, FileText, AlertTriangle } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

export default function Dashboard({ user }: { user: any }) {
  const [stats, setStats] = useState({
    fornecedores: 0,
    projetos: 0,
    contratos: 0,
    alertas: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (user.uid === 'offline-user') {
      setStats({
        fornecedores: 12,
        projetos: 5,
        contratos: 28,
        alertas: 2
      });
      setChartData([
        { name: 'Ativo', value: 8 },
        { name: 'Pendente', value: 3 },
        { name: 'Bloqueado', value: 1 }
      ]);
      return;
    }

    const q = query(collection(db, 'fornecedores'), where('user_id', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => d.data());
      setStats(prev => ({ ...prev, fornecedores: snapshot.size }));
      
      const statusCount = docs.reduce((acc: any, curr: any) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
      }, {});

      setChartData(Object.keys(statusCount).map(key => ({
        name: key,
        value: statusCount[key]
      })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'fornecedores');
    });

    return () => unsubscribe();
  }, [user.uid]);

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Fornecedores', value: stats.fornecedores, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Projetos Ativos', value: stats.projetos, icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Contratos', value: stats.contratos, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Alertas Compliance', value: stats.alertas, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Status dos Fornecedores</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {chartData.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                <span className="text-xs text-slate-500">{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Atividades Recentes</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">Novo contrato gerado</p>
                  <p className="text-xs text-slate-400">Fornecedor: Construtora Silva - Há 2 horas</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
