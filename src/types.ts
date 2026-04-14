/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Fornecedor {
  id: string;
  user_id: string;
  nome: string;
  cnpj: string;
  email: string;
  status: 'Pendente' | 'Homologado' | 'Reprovado';
  categoria_id: string;
  riscos: string[];
  createdAt: string;
}

export interface Projeto {
  id: string;
  user_id: string;
  nome: string;
  unidade_id: string;
  nrs: string[];
  status: string;
  createdAt: string;
}

export interface Unidade {
  id: string;
  user_id: string;
  nome: string;
  cnpj: string;
  endereco: string;
  createdAt: string;
}

export interface Categoria {
  id: string;
  user_id: string;
  nome: string;
  createdAt: string;
}

export interface Contrato {
  id: string;
  user_id: string;
  fornecedor_id: string;
  projeto_id: string;
  valor_estimado?: number;
  createdAt: string;
  [key: string]: any;
}

export interface AppConfig {
  id: string;
  user_id: string;
  empresa_nome: string;
  logo_base64: string;
  cor_primaria: string;
  rodape_texto: string;
}

export type ModuleType = 'Engenharia' | 'Compliance' | 'Contratos' | null;
