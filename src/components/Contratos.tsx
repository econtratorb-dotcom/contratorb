import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Fornecedor, Projeto, Contrato, AppConfig } from '../types';
import { 
  Plus, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Download, 
  X, 
  Check, 
  Save, 
  Paperclip, 
  Upload,
  UserPlus,
  ShieldCheck,
  FileText,
  Edit2,
  Trash2,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateClause } from '../services/geminiService';
import { generateContractPDF, mergePDFs } from '../services/pdfService';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

export default function Contratos({ user, config }: { user: any, config: AppConfig | null }) {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [step, setStep] = useState(1);
  const [loadingIA, setLoadingIA] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<{ [key: string]: File | null }>({});

  const initialFormData = {
    fornecedor_id: '',
    projeto_id: '',
    numero_pedido: '',
    local_prestacao: '',
    contrato_social: false,
    pesquisas_serasa: false,
    objeto_fornecimento: '',
    descricao_escopo: '',
    responsavel_tecnico: { nome: '', cpf: '' },
    assinantes: [{ nome: '', carga: '', cpf: '', email: '' }],
    inclui_materiais: false,
    materiais_detalhes: '',
    inclui_equipamentos: false,
    equipamentos_detalhes: '',
    incluir_localizacao: false,
    localizacao_detalhes: '',
    inclui_comodato: false,
    comodato_detalhes: '',
    valor_estimado: 0,
    data_inicio: '',
    data_termino: '',
    forma_protecao: '',
    cronograma_faturamento: '',
    cap_limite: 'Não aplicável',
    indice_reajuste: 'Não aplicável',
    garantias: 'Não aplicável',
    aspectos_juridicos: {},
    documentos_obrigatorios: {},
    clausulas: ['']
  };

  const [formData, setFormData] = useState<any>(initialFormData);

  useEffect(() => {
    if (user.uid === 'offline-user') {
      setFornecedores([
        { id: 'f1', nome: 'Construtora Silva Ltda', cnpj: '12.345.678/0001-90', status: 'Ativo', user_id: 'offline-user' },
        { id: 'f2', nome: 'Logística Express S.A.', cnpj: '98.765.432/0001-10', status: 'Pendente', user_id: 'offline-user' }
      ]);
      setProjetos([
        { id: 'p1', nome: 'Expansão Planta Industrial', status: 'Em Andamento', user_id: 'offline-user' },
        { id: 'p2', nome: 'Manutenção Preventiva Q3', status: 'Planejado', user_id: 'offline-user' }
      ]);
      setContratos([
        { id: 'c1', fornecedor_id: 'f1', projeto_id: 'p1', valor_estimado: 150000, createdAt: new Date().toISOString(), user_id: 'offline-user' }
      ]);
      return;
    }

    const qC = query(collection(db, 'contratos'), where('user_id', '==', user.uid));
    const unsubscribeC = onSnapshot(qC, (snapshot) => {
      setContratos(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Contrato)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'contratos');
    });

    const qF = query(collection(db, 'fornecedores'), where('user_id', '==', user.uid), where('status', '==', 'Homologado'));
    const unsubscribeF = onSnapshot(qF, (snapshot) => {
      setFornecedores(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Fornecedor)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'fornecedores');
    });

    const qP = query(collection(db, 'projetos'), where('user_id', '==', user.uid));
    const unsubscribeP = onSnapshot(qP, (snapshot) => {
      setProjetos(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Projeto)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'projetos');
    });

    return () => { unsubscribeC(); unsubscribeF(); unsubscribeP(); };
  }, [user.uid]);

  const handleGenerateClause = async () => {
    setLoadingIA(true);
    const clause = await generateClause(formData);
    setFormData({ ...formData, clausulas: [...formData.clausulas, clause] });
    setLoadingIA(false);
  };

  const handleFinish = async () => {
    const fornecedor = fornecedores.find(f => f.id === formData.fornecedor_id);
    const projeto = projetos.find(p => p.id === formData.projeto_id);
    
    if (!fornecedor || !projeto || !config) return;

    const pdfBytes = await generateContractPDF(formData, fornecedor, projeto, config);
    let finalBlob: Blob;

    const attachmentFiles = Object.values(attachments).filter(f => f !== null) as File[];
    if (attachmentFiles.length > 0) {
      finalBlob = await mergePDFs(pdfBytes, attachmentFiles);
    } else {
      finalBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    }

    if (user.uid !== 'offline-user') {
      if (editingId) {
        await updateDoc(doc(db, 'contratos', editingId), {
          ...formData,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'contratos'), {
          ...formData,
          user_id: user.uid,
          createdAt: new Date().toISOString()
        });
      }
    } else {
      if (editingId) {
        setContratos(prev => prev.map(c => c.id === editingId ? { ...formData, id: editingId, updatedAt: new Date().toISOString() } : c));
      } else {
        setContratos(prev => [...prev, { ...formData, id: Date.now().toString(), createdAt: new Date().toISOString(), user_id: user.uid }]);
      }
    }

    const url = URL.createObjectURL(finalBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Contrato_${fornecedor.nome}.pdf`;
    a.click();

    setShowWizard(false);
    setStep(1);
    setEditingId(null);
    setFormData(initialFormData);
    setAttachments({});
  };

  const handleEdit = (contrato: any) => {
    setFormData(contrato);
    setEditingId(contrato.id);
    setShowWizard(true);
    setStep(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este contrato?')) return;
    
    try {
      if (user.uid !== 'offline-user') {
        await deleteDoc(doc(db, 'contratos', id));
      } else {
        setContratos(prev => prev.filter(c => c.id !== id));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `contratos/${id}`);
    }
  };

  const handleDownload = async (contrato: any) => {
    const fornecedor = fornecedores.find(f => f.id === contrato.fornecedor_id);
    const projeto = projetos.find(p => p.id === contrato.projeto_id);
    
    if (!fornecedor || !projeto || !config) return;

    try {
      const pdfBytes = await generateContractPDF(contrato, fornecedor, projeto, config);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Contrato_${fornecedor.nome}_${contrato.id.slice(-4)}.pdf`;
      a.click();
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
    }
  };

  const steps = [
    { id: 1, label: '& PROJETO' },
    { id: 2, label: 'JURÍDICO' },
    { id: 3, label: 'ESCOPO' },
    { id: 4, label: 'EQUIPE' },
    { id: 5, label: 'RECURSOS' },
    { id: 6, label: 'FINANCEIRO' },
    { id: 7, label: 'ANÁLISE DE RISCO' },
    { id: 8, label: 'DOC. OBRIGATÓRIOS' },
    { id: 9, label: 'ANEXOS' },
    { id: 10, label: 'REVISÃO' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contratos e Solicitações</h1>
          <p className="text-sm text-slate-500">Gestão e emissão de minutas contratuais</p>
        </div>
        <button 
          onClick={() => setShowWizard(true)} 
          className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all text-sm"
        >
          <Plus className="w-5 h-5" /> Lista de verificação Novo
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50">
          <h2 className="text-sm font-bold text-slate-700">Histórico de Solicitações ( {contratos.length} )</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dados / ID</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fornecedor</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Objeto</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Valor Total</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {contratos.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-6 py-4">
                    <div className="text-xs font-bold text-slate-900">
                      {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="text-[10px] text-slate-400">Ref.: {c.id.slice(-6)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-slate-100 rounded-lg text-slate-400">
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 uppercase">
                        {fornecedores.find(f => f.id === c.fornecedor_id)?.nome || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-slate-500 truncate max-w-[200px]">
                      {c.objeto_fornecimento || projetos.find(p => p.id === c.projeto_id)?.nome || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-bold text-emerald-600">
                      $ {c.valor_estimado?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold border border-amber-100">
                      Rascunho
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button 
                        onClick={() => handleDownload(c)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEdit(c)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(c.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Wizard Modal */}
      <AnimatePresence>
        {showWizard && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[3rem] shadow-2xl max-w-6xl w-full max-h-[95vh] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-extrabold text-slate-900 mb-0.5">Checklist de Contrato</h3>
                  <p className="text-emerald-600 font-bold text-[10px] tracking-widest uppercase">GRUPO RESINAS BRASIL • SISTEMA ECOCONTRACT</p>
                </div>
                <button onClick={() => setShowWizard(false)} className="p-1.5 text-slate-300 hover:text-slate-900 transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Stepper */}
              <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 overflow-x-auto scrollbar-hide">
                <div className="flex justify-between min-w-[700px]">
                  {steps.map((s) => (
                    <div key={s.id} className="flex flex-col items-center gap-1.5 flex-1 relative">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all z-10 ${
                        step === s.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 
                        step > s.id ? 'bg-emerald-100 text-emerald-600' : 'bg-white border border-slate-200 text-slate-300'
                      }`}>
                        {step > s.id ? <Check className="w-4 h-4" /> : s.id}
                      </div>
                      <span className={`text-[8px] font-bold uppercase tracking-tighter text-center leading-none ${step === s.id ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
                {step === 1 && (
                  <div className="space-y-6 max-w-3xl mx-auto">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">CNPJ</label>
                      <select 
                        className="w-full p-4 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all appearance-none text-sm"
                        value={formData.fornecedor_id} onChange={e => setFormData({...formData, fornecedor_id: e.target.value})}
                      >
                        <option value="">Selecione um fornecedor...</option>
                        {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome} - {f.cnpj}</option>)}
                      </select>
                    </div>

                    <div className="p-6 bg-blue-50/30 border border-blue-100 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
                        <Paperclip className="w-3.5 h-3.5" /> Vincular Projeto de Engenharia
                      </div>
                      <select 
                        className="w-full p-4 bg-white border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none text-sm"
                        value={formData.projeto_id} onChange={e => setFormData({...formData, projeto_id: e.target.value})}
                      >
                        <option value="">Nenhum projeto selecionado</option>
                        {projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nº DO PEDIDO</label>
                        <input 
                          type="text" className="w-full p-4 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
                          value={formData.numero_pedido} onChange={e => setFormData({...formData, numero_pedido: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">LOCAL DE PRESTAÇÃO</label>
                        <select 
                          className="w-full p-4 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all appearance-none text-sm"
                          value={formData.local_prestacao} onChange={e => setFormData({...formData, local_prestacao: e.target.value})}
                        >
                          <option value="">Selecione...</option>
                          <option value="Unidade 1">Unidade 1</option>
                          <option value="Unidade 2">Unidade 2</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6 max-w-3xl mx-auto">
                    <h4 className="text-xl font-bold text-slate-900">2. Documentação Legal</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center gap-4 p-6 bg-white border border-slate-100 rounded-2xl cursor-pointer hover:border-emerald-500 transition-all shadow-sm">
                        <input 
                          type="checkbox" className="w-6 h-6 rounded-lg border-slate-200 text-emerald-600 focus:ring-emerald-500"
                          checked={formData.contrato_social} onChange={e => setFormData({...formData, contrato_social: e.target.checked})}
                        />
                        <div>
                          <p className="font-bold text-slate-900 text-sm">Contrato Social?</p>
                          <p className="text-[10px] text-slate-400">Verifique se está.</p>
                        </div>
                      </label>
                      <label className="flex items-center gap-4 p-6 bg-white border border-slate-100 rounded-2xl cursor-pointer hover:border-emerald-500 transition-all shadow-sm">
                        <input 
                          type="checkbox" className="w-6 h-6 rounded-lg border-slate-200 text-emerald-600 focus:ring-emerald-500"
                          checked={formData.pesquisas_serasa} onChange={e => setFormData({...formData, pesquisas_serasa: e.target.checked})}
                        />
                        <div>
                          <p className="font-bold text-slate-900 text-sm">Possui Pesquisas Serasa?</p>
                          <p className="text-[10px] text-slate-400">Certificados e consultas financeiras</p>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6 max-w-3xl mx-auto">
                    <h4 className="text-xl font-bold text-slate-900">3. Escopo</h4>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">OBJETO DO FORNECIMENTO</label>
                        <input 
                          type="text" className="w-full p-4 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
                          value={formData.objeto_fornecimento} onChange={e => setFormData({...formData, objeto_fornecimento: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">DESCRIÇÃO PRIVILEGIADA DO ESCOPO</label>
                        <textarea 
                          className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all min-h-[200px] text-sm"
                          value={formData.descricao_escopo} onChange={e => setFormData({...formData, descricao_escopo: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-6 max-w-3xl mx-auto">
                    <h4 className="text-xl font-bold text-slate-900">4. Equipe e Assinantes</h4>
                    
                    <div className="p-6 bg-emerald-50/30 border border-emerald-100 rounded-3xl space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-emerald-700 uppercase text-xs">Responsável Técnico (ART/RRT)</p>
                          <p className="text-[9px] text-emerald-600 font-bold">ESTE NOME SAIRÁ EM DESTAQUE NO PDF</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <input 
                          type="text" placeholder="NOME COMPLETO" className="w-full p-4 bg-white border border-emerald-100 rounded-xl outline-none text-sm"
                          value={formData.responsavel_tecnico.nome} onChange={e => setFormData({...formData, responsavel_tecnico: {...formData.responsavel_tecnico, nome: e.target.value}})}
                        />
                        <input 
                          type="text" placeholder="CPF" className="w-full p-4 bg-white border border-emerald-100 rounded-xl outline-none text-sm"
                          value={formData.responsavel_tecnico.cpf} onChange={e => setFormData({...formData, responsavel_tecnico: {...formData.responsavel_tecnico, cpf: e.target.value}})}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assinantes do Contrato (Prepostos)</h5>
                        <button 
                          onClick={() => setFormData({...formData, assinantes: [...formData.assinantes, { nome: '', carga: '', cpf: '', email: '' }]})}
                          className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" /> Iniciador
                        </button>
                      </div>
                      {formData.assinantes.map((a: any, i: number) => (
                        <div key={i} className="p-6 bg-slate-50/50 border border-slate-100 rounded-2xl grid grid-cols-4 gap-3 relative">
                          <input 
                            type="text" placeholder="NOME COMPLETO" className="w-full p-3 bg-white border border-slate-100 rounded-lg text-[10px]"
                            value={a.nome} onChange={e => {
                              const newAssinantes = [...formData.assinantes];
                              newAssinantes[i].nome = e.target.value;
                              setFormData({...formData, assinantes: newAssinantes});
                            }}
                          />
                          <input 
                            type="text" placeholder="CARGA" className="w-full p-3 bg-white border border-slate-100 rounded-lg text-[10px]"
                            value={a.carga} onChange={e => {
                              const newAssinantes = [...formData.assinantes];
                              newAssinantes[i].carga = e.target.value;
                              setFormData({...formData, assinantes: newAssinantes});
                            }}
                          />
                          <input 
                            type="text" placeholder="CPF" className="w-full p-3 bg-white border border-slate-100 rounded-lg text-[10px]"
                            value={a.cpf} onChange={e => {
                              const newAssinantes = [...formData.assinantes];
                              newAssinantes[i].cpf = e.target.value;
                              setFormData({...formData, assinantes: newAssinantes});
                            }}
                          />
                          <input 
                            type="text" placeholder="E-MAIL" className="w-full p-3 bg-white border border-slate-100 rounded-lg text-[10px]"
                            value={a.email} onChange={e => {
                              const newAssinantes = [...formData.assinantes];
                              newAssinantes[i].email = e.target.value;
                              setFormData({...formData, assinantes: newAssinantes});
                            }}
                          />
                          {i > 0 && (
                            <button 
                              onClick={() => {
                                const newAssinantes = formData.assinantes.filter((_: any, idx: number) => idx !== i);
                                setFormData({...formData, assinantes: newAssinantes});
                              }}
                              className="absolute -top-1.5 -right-1.5 bg-white text-slate-300 hover:text-red-500 p-1 rounded-full shadow-sm"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-6 max-w-3xl mx-auto">
                    <h4 className="text-xl font-bold text-slate-900">5. Recursos Envolvidos</h4>
                    <div className="space-y-4">
                      {[
                        { label: 'INCLUI MATERIAIS ?', key: 'inclui_materiais', detailKey: 'materiais_detalhes' },
                        { label: 'INCLUI EQUIPAMENTOS ?', key: 'inclui_equipamentos', detailKey: 'equipamentos_detalhes' },
                        { label: 'INCLUIR LOCALIZAÇÃO ?', key: 'incluir_localizacao', detailKey: 'localizacao_detalhes' },
                        { label: 'INCLUI COMODATO ?', key: 'inclui_comodato', detailKey: 'comodato_detalhes' }
                      ].map((item, i) => (
                        <div key={i} className="space-y-3">
                          <label className="flex items-center gap-4 p-6 bg-white border border-slate-100 rounded-2xl cursor-pointer hover:border-emerald-500 transition-all shadow-sm">
                            <input 
                              type="checkbox" className="w-6 h-6 rounded-lg border-slate-200 text-emerald-600 focus:ring-emerald-500"
                              checked={formData[item.key]} 
                              onChange={e => setFormData({...formData, [item.key]: e.target.checked})}
                            />
                            <span className="font-bold text-slate-900 uppercase tracking-widest text-xs">{item.label}</span>
                          </label>
                          <AnimatePresence>
                            {formData[item.key] && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <textarea
                                  placeholder={`Descreva quais ${item.label.toLowerCase().replace('inclui ', '').replace(' ?', '')}...`}
                                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
                                  value={formData[item.detailKey]}
                                  onChange={e => setFormData({...formData, [item.detailKey]: e.target.value})}
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {step === 6 && (
                  <div className="space-y-6 max-w-3xl mx-auto">
                    <h4 className="text-xl font-bold text-slate-900">6. Financeiro</h4>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="col-span-2 p-8 bg-emerald-50/30 border border-emerald-100 rounded-3xl space-y-2">
                        <label className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">VALOR TOTAL ESTIMADO (R$)</label>
                        <div className="text-4xl font-black text-emerald-900 flex items-baseline gap-2">
                          <span className="text-xl">R$</span>
                          <input 
                            type="number" className="bg-transparent outline-none w-full"
                            value={formData.valor_estimado} onChange={e => setFormData({...formData, valor_estimado: Number(e.target.value)})}
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">DADOS</label>
                          <input 
                            type="date" className="w-full bg-transparent font-bold outline-none text-xs"
                            value={formData.data_inicio} onChange={e => setFormData({...formData, data_inicio: e.target.value})}
                          />
                        </div>
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">DATA TERMINO</label>
                          <input 
                            type="date" className="w-full bg-transparent font-bold outline-none text-xs"
                            value={formData.data_termino} onChange={e => setFormData({...formData, data_termino: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">FORMA DE PROTEÇÃO</label>
                        <input 
                          type="text" className="w-full p-4 bg-white border border-slate-100 rounded-2xl outline-none text-sm"
                          value={formData.forma_protecao} onChange={e => setFormData({...formData, forma_protecao: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">CRONOGRAMA FATURAMENTO</label>
                        <input 
                          type="text" className="w-full p-4 bg-white border border-slate-100 rounded-2xl outline-none text-sm"
                          value={formData.cronograma_faturamento} onChange={e => setFormData({...formData, cronograma_faturamento: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {['CAP / LIMITE', 'ÍNDICE DE REAJUSTE', 'GARANTIAS'].map((label, i) => (
                        <div key={i} className="p-4 bg-white border border-slate-100 rounded-2xl space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                            <ShieldCheck className="w-2.5 h-2.5" /> {label}
                          </label>
                          <select 
                            className="w-full bg-transparent font-bold outline-none text-xs"
                            value={formData[label.toLowerCase().replace(/ /g, '_').replace(/\//g, '').trim()]}
                            onChange={e => setFormData({...formData, [label.toLowerCase().replace(/ /g, '_').replace(/\//g, '').trim()]: e.target.value})}
                          >
                            <option>Não aplicável</option>
                            <option>Aplicável</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {step === 7 && (
                  <div className="space-y-6 max-w-3xl mx-auto">
                    <h4 className="text-xl font-bold text-slate-900">7. Análise de Risco & Jurídico</h4>
                    <div className="p-8 bg-blue-50/30 border border-blue-100 rounded-3xl space-y-6">
                      <div className="flex items-center gap-2.5 text-blue-900 font-bold text-sm">
                        <FileText className="w-5 h-5" /> ASPECTOS JURÍDICOS E DE RISCO
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          'Minuta', 'Minutas', 'Cláusulas de confidencialidade', 'Cláusulas de rescisão e deliberações',
                          'Garantias Ordinárias (desempenho, entrega)', 'Contagem da garantia (entrega/execução)',
                          'Obrigações pós-encerramento (sigilo)', 'Interação com órgãos públicos'
                        ].map((label, i) => (
                          <label key={i} className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-xl cursor-pointer hover:border-blue-500 transition-all">
                            <input 
                              type="checkbox" className="w-5 h-5 rounded-md border-slate-200 text-blue-600 focus:ring-blue-500"
                              checked={formData.aspectos_juridicos[label]}
                              onChange={e => setFormData({...formData, aspectos_juridicos: {...formData.aspectos_juridicos, [label]: e.target.checked}})}
                            />
                            <span className="font-bold text-slate-700 text-[10px]">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {step === 8 && (
                  <div className="space-y-6 max-w-3xl mx-auto">
                    <h4 className="text-xl font-bold text-slate-900">8. Doc. Obrigatórios</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        'Acordo Comercial', 'Pedido de Compra (PO)', 'Termo de Conformidade', 'Óleo do',
                        'Registro no sistema de gestão', 'Relatório de avaliação', 'Documentos fiscais validados',
                        'Documentos de segurança do trabalho', 'certificados de pacotes'
                      ].map((label, i) => (
                        <label key={i} className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-xl cursor-pointer hover:border-emerald-500 transition-all">
                          <input 
                            type="checkbox" className="w-5 h-5 rounded-md border-slate-200 text-emerald-600 focus:ring-emerald-500"
                            checked={formData.documentos_obrigatorios[label]}
                            onChange={e => setFormData({...formData, documentos_obrigatorios: {...formData.documentos_obrigatorios, [label]: e.target.checked}})}
                          />
                          <span className="font-bold text-slate-700 text-[10px]">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {step === 9 && (
                  <div className="space-y-6 max-w-4xl mx-auto">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-xl font-bold text-slate-900">9. Documentos Anexos</h4>
                        <p className="text-[10px] text-slate-400 font-bold">Arquivos em PDF.</p>
                      </div>
                      <div className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5">
                        <Paperclip className="w-3.5 h-3.5" /> {Object.values(attachments).filter(v => v !== null).length} Arquivos
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {[
                        'PEDIDO DE COMPRA', 'CONTRATO SOCIAL', 'CND FEDERAL (CERTIDÃO FEDERAL)',
                        'CND ESTADUAL (CERTIFICAÇÃO ESTADUAL)', 'CND MUNICIPAL (CERTIDÃO MUNICIPAL)',
                        'CND TRABALHISTA (CERTIDÃO TRABALHISTA)'
                      ].map((label, i) => (
                        <div key={i} className="p-6 bg-white border border-slate-100 rounded-2xl flex items-center justify-between shadow-sm">
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</p>
                            <p className="text-xs font-bold text-slate-300 truncate max-w-[150px]">{attachments[label] ? attachments[label]?.name : 'Vazio'}</p>
                          </div>
                          <label className="p-2.5 bg-slate-50 text-slate-400 hover:text-emerald-600 rounded-lg cursor-pointer transition-all">
                            <Upload className="w-4 h-4" />
                            <input 
                              type="file" accept=".pdf" className="hidden"
                              onChange={e => setAttachments({...attachments, [label]: e.target.files?.[0] || null})}
                            />
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {step === 10 && (
                  <div className="space-y-6 max-w-3xl mx-auto text-center py-8">
                    <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <FileText className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h4 className="text-2xl font-bold text-slate-900">Tudo pronto para gerar!</h4>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">Revise as informações antes de finalizar. O sistema irá mesclar todos os anexos em um único documento PDF.</p>
                    
                    <div className="grid grid-cols-2 gap-3 max-w-md mx-auto mt-8">
                      <div className="p-4 bg-slate-50 rounded-2xl text-left">
                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Fornecedor</p>
                        <p className="text-sm font-bold text-slate-900">{fornecedores.find(f => f.id === formData.fornecedor_id)?.nome || 'Não selecionado'}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl text-left">
                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Valor</p>
                        <p className="text-sm font-bold text-emerald-600">R$ {formData.valor_estimado.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-100 flex justify-between items-center bg-slate-50/30">
                <button 
                  onClick={() => step > 1 ? setStep(step - 1) : setShowWizard(false)}
                  className="px-6 py-3 text-slate-400 font-bold flex items-center gap-2 hover:text-slate-900 transition-all rounded-2xl text-sm"
                >
                  <ChevronLeft className="w-5 h-5" /> Voltar
                </button>
                
                <div className="flex gap-3">
                  <button className="bg-emerald-50 text-emerald-600 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-emerald-100 transition-all text-sm">
                    <Save className="w-4 h-4" /> Lista de verificação Salvar
                  </button>
                  <button 
                    onClick={() => step < 10 ? setStep(step + 1) : handleFinish()}
                    className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-slate-200 hover:scale-105 transition-all text-sm"
                  >
                    {step === 10 ? 'Finalizar e Gerar' : 'Próximo Passo'} <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
