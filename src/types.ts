import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type RecurrenceType = 'Nenhuma' | 'Diário' | 'Semanal' | 'Mensal' | 'Anual';
export type StatusType = 'Pendente' | 'Pago' | 'Atrasado';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Settings {
  theme: 'light' | 'dark';
  language: 'pt' | 'en';
}

export interface Account {
  id: string;
  empresa: string;
  categoria: string;
  descricao: string;
  itens: string;
  valor: number;
  vencimento: string; // ISO date
  status: StatusType;
  isAssinatura: boolean;
  recorrencia: RecurrenceType;
}

export interface HistoryItem {
  idPagamento: string;
  idConta: string;
  empresa: string;
  valorPago: number;
  dataPagamento: string;
  vencimentoOriginal: string;
  categoria: string;
}
