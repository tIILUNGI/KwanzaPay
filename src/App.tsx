/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  History, 
  Settings, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  FileText, 
  Info,
  Download,
  ChevronRight,
  ChevronLeft,
  Trash2,
  TrendingUp,
  DollarSign,
  Calendar,
  Code
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { format, addDays, addWeeks, addMonths, addYears, isAfter, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QRCodeCanvas } from 'qrcode.react';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { cn, type Account, type HistoryItem, type StatusType, type RecurrenceType, type User, type Settings as UserSettings } from './types';

// Initial Mock Data
const INITIAL_ACCOUNTS: Account[] = [
  {
    id: '1',
    empresa: 'Unitel',
    categoria: 'Telecomunicações',
    descricao: 'Plano Mensal Internet',
    itens: 'Internet 50GB',
    valor: 15000,
    vencimento: format(addDays(new Date(), -2), 'yyyy-MM-dd'),
    status: 'Pendente',
    isAssinatura: true,
    recorrencia: 'Mensal',
  },
  {
    id: '2',
    empresa: 'ENDE',
    categoria: 'Energia',
    descricao: 'Consumo Residencial',
    itens: 'Energia Elétrica',
    valor: 8500,
    vencimento: format(addDays(new Date(), 5), 'yyyy-MM-dd'),
    status: 'Pendente',
    isAssinatura: false,
    recorrencia: 'Mensal',
  },
  {
    id: '3',
    empresa: 'ZAP',
    categoria: 'Entretenimento',
    descricao: 'Pacote Premium',
    itens: 'TV por Cabo',
    valor: 12000,
    vencimento: format(addDays(new Date(), 10), 'yyyy-MM-dd'),
    status: 'Pendente',
    isAssinatura: true,
    recorrencia: 'Mensal',
  },
];

const CATEGORIES = ['Telecomunicações', 'Energia', 'Água', 'Aluguel', 'Entretenimento', 'Alimentação', 'Outros'];

export default function App() {
  const [view, setView] = useState<'landing' | 'login' | 'app'>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<UserSettings>({ theme: 'light', language: 'pt' });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'contas' | 'historico' | 'lista' | 'about' | 'config' | 'excel'>('dashboard');
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [paymentCooldowns, setPaymentCooldowns] = useState<Record<string, number>>({});
  const [categories, setCategories] = useState<string[]>(CATEGORIES);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const exportToExcel = () => {
    const data = history.map(h => ({
      Empresa: h.empresa,
      Categoria: h.categoria,
      'Valor Pago (Kz)': h.valorPago,
      'Data Pagamento': format(parseISO(h.dataPagamento), 'dd/MM/yyyy'),
      'Vencimento Original': format(parseISO(h.vencimentoOriginal), 'dd/MM/yyyy'),
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Histórico");
    XLSX.writeFile(workbook, `Relatorio_KwanzaPay_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const qrCanvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
    const qrDataUrl = qrCanvas ? qrCanvas.toDataURL('image/png') : null;

    // Header / Branding
    doc.setFillColor(16, 185, 129); // Emerald-600
    doc.rect(0, 0, 210, 40, 'F');
    
    // Seal
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(14, 10, 12, 12, 3, 3, 'F');
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(10);
    doc.text("K", 18, 19);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text("KwanzaPay", 30, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text("Gestão Financeira Inteligente", 30, 27);

    // QR Code
    if (qrDataUrl) {
      doc.addImage(qrDataUrl, 'PNG', 170, 5, 30, 30);
      doc.setFontSize(7);
      doc.text("Acesse o App", 173, 38);
    }

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text("Relatório de Pagamentos", 14, 55);
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 62);
    doc.text(`Usuário: ${user?.name || 'Visitante'}`, 14, 67);
    
    const tableData = history.map(h => [
      h.empresa,
      h.categoria,
      formatCurrency(h.valorPago),
      format(parseISO(h.dataPagamento), 'dd/MM/yyyy'),
      format(parseISO(h.vencimentoOriginal), 'dd/MM/yyyy')
    ]);
    
    autoTable(doc, {
      head: [['Empresa', 'Categoria', 'Valor', 'Data Pagto', 'Venc. Orig.']],
      body: tableData,
      startY: 75,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 8 },
    });
    
    doc.save(`Relatorio_KwanzaPay_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  // Auto-update status to 'Atrasado'
  useEffect(() => {
    const today = new Date();
    setAccounts(prev => prev.map(acc => {
      if (acc.status === 'Pendente' && isAfter(today, parseISO(acc.vencimento))) {
        return { ...acc, status: 'Atrasado' };
      }
      return acc;
    }));
  }, []);

  const handlePay = (account: Account) => {
    // Cooldown check (30 minutes = 1800000 ms)
    const now = Date.now();
    const lastPayment = paymentCooldowns[account.id];
    if (lastPayment && now - lastPayment < 1800000) {
      const remaining = Math.ceil((1800000 - (now - lastPayment)) / 60000);
      alert(settings.language === 'pt' 
        ? `Esta conta foi paga recentemente. Aguarde ${remaining} minutos para pagar novamente.` 
        : `This account was paid recently. Wait ${remaining} minutes to pay again.`);
      return;
    }

    const today = new Date();
    
    // 1. Add to history
    const historyItem: HistoryItem = {
      idPagamento: Math.random().toString(36).substr(2, 9),
      idConta: account.id,
      empresa: account.empresa,
      valorPago: account.valor,
      dataPagamento: format(today, 'yyyy-MM-dd HH:mm:ss'),
      vencimentoOriginal: account.vencimento,
      categoria: account.categoria,
    };
    setHistory(prev => [historyItem, ...prev]);

    // 2. Remove current account from pending list
    setAccounts(prev => prev.filter(a => a.id !== account.id));
    
    // 3. Set cooldown
    setPaymentCooldowns(prev => ({ ...prev, [account.id]: now }));

    // 4. If recurring, create next one
    if (account.recorrencia !== 'Nenhuma') {
      let nextVencimento = parseISO(account.vencimento);
      switch (account.recorrencia) {
        case 'Diário': nextVencimento = addDays(nextVencimento, 1); break;
        case 'Semanal': nextVencimento = addWeeks(nextVencimento, 1); break;
        case 'Mensal': nextVencimento = addMonths(nextVencimento, 1); break;
        case 'Anual': nextVencimento = addYears(nextVencimento, 1); break;
      }

      const nextAccount: Account = {
        ...account,
        id: Math.random().toString(36).substr(2, 9),
        vencimento: format(nextVencimento, 'yyyy-MM-dd'),
        status: 'Pendente',
      };
      // Add next account after a small delay to avoid confusion or just add it
      setAccounts(prev => [...prev, nextAccount]);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm(settings.language === 'pt' ? 'Tem certeza que deseja limpar todo o histórico?' : 'Are you sure you want to clear all history?')) {
      setHistory([]);
    }
  };

  const handleDeleteAccount = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este gasto?')) {
      setAccounts(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setIsAddingAccount(true);
  };

  const allExpenses = useMemo(() => {
    const active = accounts.map(a => ({
      id: a.id,
      empresa: a.empresa,
      categoria: a.categoria,
      valor: a.valor,
      data: a.vencimento,
      status: a.status,
      itens: a.itens,
      tipo: 'Conta'
    }));
    const past = history.map(h => ({
      id: h.idPagamento,
      empresa: h.empresa,
      categoria: h.categoria,
      valor: h.valorPago,
      data: h.dataPagamento,
      status: 'Pago' as StatusType,
      itens: '', // History items might not have detailed items in this mock, but we can add it if needed
      tipo: 'Histórico'
    }));
    return [...active, ...past].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [accounts, history]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const stats = useMemo(() => {
    const today = new Date();
    const start = startOfMonth(today);
    const end = endOfMonth(today);

    const pendente = accounts.filter(a => a.status === 'Pendente').reduce((sum, a) => sum + a.valor, 0);
    const atrasado = accounts.filter(a => a.status === 'Atrasado').reduce((sum, a) => sum + a.valor, 0);
    const pagoNoMes = history
      .filter(h => isWithinInterval(parseISO(h.dataPagamento), { start, end }))
      .reduce((sum, h) => sum + h.valorPago, 0);
    
    const projecao = pendente + atrasado + pagoNoMes;

    return { pendente, atrasado, pagoNoMes, projecao };
  }, [accounts, history]);

  const chartData = useMemo(() => {
    const data: Record<string, number> = {};
    [...accounts, ...history.map(h => ({ categoria: h.categoria, valor: h.valorPago }))].forEach(item => {
      data[item.categoria] = (data[item.categoria] || 0) + ('valor' in item ? item.valor : item.valorPago);
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [accounts, history]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(settings.language === 'pt' ? 'pt-AO' : 'en-US', { 
      style: 'currency', 
      currency: settings.language === 'pt' ? 'AOA' : 'USD' 
    }).format(val).replace('AOA', 'Kz');
  };

  if (view === 'landing') {
    return <LandingPage onStart={() => setView('login')} />;
  }

  if (view === 'login') {
    return <LoginPage onLogin={(u) => { setUser(u); setView('app'); }} onBack={() => setView('landing')} />;
  }

  return (
    <div className={cn(
      "min-h-screen flex font-sans transition-colors duration-300 relative",
      settings.theme === 'dark' ? "bg-slate-900 text-slate-100" : "bg-[#F8F9FA] text-slate-900"
    )}>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 w-64 border-r flex flex-col transition-all duration-300 z-50",
        settings.theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">K</div>
            <h1 className={cn(
              "text-xl font-bold tracking-tight",
              settings.theme === 'dark' ? "text-white" : "text-slate-800"
            )}>KwanzaPay</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-600">
            <ChevronLeft size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <NavItem 
            active={activeTab === 'dashboard'} 
            onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} 
            icon={<LayoutDashboard size={20} />} 
            label={settings.language === 'pt' ? "Dashboard" : "Dashboard"} 
            theme={settings.theme}
          />
          <NavItem 
            active={activeTab === 'contas'} 
            onClick={() => { setActiveTab('contas'); setIsSidebarOpen(false); }} 
            icon={<Receipt size={20} />} 
            label={settings.language === 'pt' ? "Contas a Pagar" : "Accounts Payable"} 
            theme={settings.theme}
          />
          <NavItem 
            active={activeTab === 'historico'} 
            onClick={() => { setActiveTab('historico'); setIsSidebarOpen(false); }} 
            icon={<History size={20} />} 
            label={settings.language === 'pt' ? "Histórico" : "History"} 
            theme={settings.theme}
          />
          <NavItem 
            active={activeTab === 'lista'} 
            onClick={() => { setActiveTab('lista'); setIsSidebarOpen(false); }} 
            icon={<FileText size={20} />} 
            label={settings.language === 'pt' ? "Lista de Gastos" : "Expense List"} 
            theme={settings.theme}
          />
          <div className="pt-4 pb-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recursos</div>
          <NavItem 
            active={activeTab === 'about'} 
            onClick={() => { setActiveTab('about'); setIsSidebarOpen(false); }} 
            icon={<Info size={20} />} 
            label={settings.language === 'pt' ? "Sobre o Sistema" : "About System"} 
            theme={settings.theme}
          />
          <NavItem 
            active={activeTab === 'config'} 
            onClick={() => { setActiveTab('config'); setIsSidebarOpen(false); }} 
            icon={<Settings size={20} />} 
            label={settings.language === 'pt' ? "Configurações" : "Settings"} 
            theme={settings.theme}
          />
          <NavItem 
            active={activeTab === 'excel'} 
            onClick={() => { setActiveTab('excel'); setIsSidebarOpen(false); }} 
            icon={<Code size={20} />} 
            label={settings.language === 'pt' ? "Guia Excel/VBA" : "Excel/VBA Guide"} 
            theme={settings.theme}
          />
        </nav>

        <div className="p-4 border-t border-slate-100">
          {user && (
            <div className={cn(
              "mb-4 p-3 rounded-xl flex items-center gap-3",
              settings.theme === 'dark' ? "bg-slate-700/50" : "bg-slate-50"
            )}>
              <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" referrerPolicy="no-referrer" />
              <div className="overflow-hidden">
                <p className={cn("text-xs font-bold truncate", settings.theme === 'dark' ? "text-white" : "text-slate-800")}>{user.name}</p>
                <button onClick={() => setView('login')} className="text-[10px] text-emerald-600 font-bold hover:underline">Sair</button>
              </div>
            </div>
          )}
          <div className={cn(
            "rounded-xl p-4",
            settings.theme === 'dark' ? "bg-emerald-900/20" : "bg-emerald-50"
          )}>
            <p className={cn("text-xs font-semibold mb-1", settings.theme === 'dark' ? "text-emerald-400" : "text-emerald-800")}>Status do Sistema</p>
            <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-medium">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Sincronizado
            </div>
            <p className="text-[9px] text-slate-400 mt-2 italic">Desenvolvido por Ebenezer Vilola</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full">
        <header className={cn(
          "h-16 border-b px-4 sm:px-8 flex items-center justify-between sticky top-0 z-10 transition-colors duration-300",
          settings.theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
        )}>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500"
            >
              <LayoutDashboard size={20} />
            </button>
            <h2 className={cn(
              "text-base sm:text-lg font-semibold capitalize truncate max-w-[150px] sm:max-w-none",
              settings.theme === 'dark' ? "text-white" : "text-slate-800"
            )}>
            {activeTab === 'dashboard' ? (settings.language === 'pt' ? 'Visão Geral' : 'Overview') : 
             activeTab === 'contas' ? (settings.language === 'pt' ? 'Contas a Pagar' : 'Accounts Payable') : 
             activeTab === 'historico' ? (settings.language === 'pt' ? 'Histórico de Pagamentos' : 'Payment History') : 
             activeTab === 'lista' ? (settings.language === 'pt' ? 'Lista Geral de Gastos' : 'General Expense List') :
             activeTab === 'about' ? (settings.language === 'pt' ? 'Sobre o Sistema' : 'About System') :
             activeTab === 'config' ? (settings.language === 'pt' ? 'Configurações' : 'Settings') : (settings.language === 'pt' ? 'Especialista Excel' : 'Excel Specialist')}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 p-1 rounded-lg gap-1">
              <button 
                onClick={exportToExcel}
                className="p-2 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600 flex items-center gap-2 text-xs font-semibold"
                title="Exportar Excel"
              >
                <Download size={14} />
                Excel
              </button>
              <button 
                onClick={exportToPDF}
                className="p-2 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600 flex items-center gap-2 text-xs font-semibold"
                title="Exportar PDF"
              >
                <FileText size={14} />
                PDF
              </button>
            </div>
            <button 
              onClick={() => setIsAddingAccount(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
            >
              <Plus size={18} />
              Nova Conta
            </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard 
                    title="Total Pendente" 
                    value={formatCurrency(stats.pendente)} 
                    icon={<Clock className="text-amber-500" />} 
                    color="amber"
                    theme={settings.theme}
                  />
                  <StatCard 
                    title="Total Atrasado" 
                    value={formatCurrency(stats.atrasado)} 
                    icon={<AlertCircle className="text-rose-500" />} 
                    color="rose"
                    theme={settings.theme}
                  />
                  <StatCard 
                    title="Pago no Mês" 
                    value={formatCurrency(stats.pagoNoMes)} 
                    icon={<CheckCircle2 className="text-emerald-500" />} 
                    color="emerald"
                    theme={settings.theme}
                  />
                  <StatCard 
                    title="Projeção Mensal" 
                    value={formatCurrency(stats.projecao)} 
                    icon={<TrendingUp className="text-blue-500" />} 
                    color="blue"
                    theme={settings.theme}
                  />
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className={cn(
                    "lg:col-span-2 p-6 rounded-2xl border shadow-sm",
                    settings.theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
                  )}>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Gastos por Categoria</h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={settings.theme === 'dark' ? '#334155' : '#f1f5f9'} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                          <Tooltip 
                            contentStyle={{ 
                              borderRadius: '12px', 
                              border: 'none', 
                              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                              backgroundColor: settings.theme === 'dark' ? '#1e293b' : '#ffffff',
                              color: settings.theme === 'dark' ? '#ffffff' : '#000000'
                            }}
                            formatter={(value: number) => formatCurrency(value)}
                          />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][index % 6]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className={cn(
                    "p-6 rounded-2xl border shadow-sm",
                    settings.theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
                  )}>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Distribuição de Status</h3>
                    <div className="h-[300px] flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Pendente', value: accounts.filter(a => a.status === 'Pendente').length },
                              { name: 'Atrasado', value: accounts.filter(a => a.status === 'Atrasado').length },
                              { name: 'Pago', value: history.length },
                            ]}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            <Cell fill="#f59e0b" />
                            <Cell fill="#ef4444" />
                            <Cell fill="#10b981" />
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              borderRadius: '12px', 
                              border: 'none', 
                              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                              backgroundColor: settings.theme === 'dark' ? '#1e293b' : '#ffffff',
                              color: settings.theme === 'dark' ? '#ffffff' : '#000000'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Pendente</span>
                        <span className="font-bold text-amber-600">{accounts.filter(a => a.status === 'Pendente').length}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Atrasado</span>
                        <span className="font-bold text-rose-600">{accounts.filter(a => a.status === 'Atrasado').length}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Pago</span>
                        <span className="font-bold text-emerald-600">{history.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'contas' && (
              <motion.div 
                key="contas"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                  "rounded-2xl border shadow-sm overflow-hidden",
                  settings.theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
                )}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className={cn(
                        "border-b",
                        settings.theme === 'dark' ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200"
                      )}>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Empresa</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Itens</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Categoria</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vencimento</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valor</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className={cn(
                      "divide-y",
                      settings.theme === 'dark' ? "divide-slate-700" : "divide-slate-100"
                    )}>
                      {accounts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">Nenhuma conta pendente.</td>
                        </tr>
                      ) : (
                        accounts.sort((a, b) => new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime()).map(account => (
                          <tr key={account.id} className={cn(
                            "transition-colors group",
                            settings.theme === 'dark' ? "hover:bg-slate-700/50" : "hover:bg-slate-50"
                          )}>
                            <td className="px-6 py-4">
                              <div className={cn("font-semibold", settings.theme === 'dark' ? "text-white" : "text-slate-800")}>{account.empresa}</div>
                              <div className="text-xs text-slate-400">{account.descricao}</div>
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-500">{account.itens || '-'}</td>
                            <td className="px-6 py-4">
                              <span className={cn(
                                "text-xs px-2 py-1 rounded-md font-medium",
                                settings.theme === 'dark' ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"
                              )}>{account.categoria}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <Calendar size={14} className="text-slate-400" />
                                {format(parseISO(account.vencimento), 'dd/MM/yyyy')}
                              </div>
                            </td>
                            <td className={cn("px-6 py-4 font-bold", settings.theme === 'dark' ? "text-white" : "text-slate-800")}>
                              {formatCurrency(account.valor)}
                            </td>
                            <td className="px-6 py-4">
                              <StatusBadge status={account.status} />
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => handleEditAccount(account)}
                                  className="text-slate-400 hover:text-blue-600 p-2 rounded-lg transition-all"
                                  title="Editar"
                                >
                                  <Code size={18} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteAccount(account.id)}
                                  className="text-slate-400 hover:text-rose-600 p-2 rounded-lg transition-all"
                                  title="Excluir"
                                >
                                  <Trash2 size={18} />
                                </button>
                                {account.status !== 'Pago' && (
                                  <button 
                                    onClick={() => handlePay(account)}
                                    className="bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white p-2 rounded-lg transition-all"
                                    title="Marcar como Pago"
                                  >
                                    <CheckCircle2 size={18} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'historico' && (
              <motion.div 
                key="historico"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className={cn(
                  "p-4 rounded-2xl border flex justify-between items-center",
                  settings.theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
                )}>
                  <h3 className={cn("font-bold", settings.theme === 'dark' ? "text-white" : "text-slate-700")}>
                    {settings.language === 'pt' ? 'Histórico de Pagamentos' : 'Payment History'}
                  </h3>
                  <button 
                    onClick={handleClearHistory}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-rose-50 transition-all"
                  >
                    <Trash2 size={14} />
                    {settings.language === 'pt' ? 'Limpar Histórico' : 'Clear History'}
                  </button>
                </div>

                <div className={cn(
                  "rounded-2xl border shadow-sm overflow-hidden",
                  settings.theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
                )}>
                  <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className={cn(
                        "border-b",
                        settings.theme === 'dark' ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200"
                      )}>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Empresa</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data Pagamento</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Venc. Original</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valor Pago</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Categoria</th>
                      </tr>
                    </thead>
                    <tbody className={cn(
                      "divide-y",
                      settings.theme === 'dark' ? "divide-slate-700" : "divide-slate-100"
                    )}>
                      {history.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">Nenhum pagamento registrado.</td>
                        </tr>
                      ) : (
                        history.map(item => (
                          <tr key={item.idPagamento} className={cn(
                            "transition-colors",
                            settings.theme === 'dark' ? "hover:bg-slate-700/50" : "hover:bg-slate-50"
                          )}>
                            <td className="px-6 py-4 font-semibold text-slate-800 dark:text-white">{item.empresa}</td>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                              {item.dataPagamento.includes(' ') 
                                ? format(parseISO(item.dataPagamento.split(' ')[0]), 'dd/MM/yyyy') + ' ' + item.dataPagamento.split(' ')[1]
                                : format(parseISO(item.dataPagamento), 'dd/MM/yyyy')}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-400">{format(parseISO(item.vencimentoOriginal), 'dd/MM/yyyy')}</td>
                            <td className="px-6 py-4 font-bold text-emerald-600">{formatCurrency(item.valorPago)}</td>
                            <td className="px-6 py-4">
                              <span className={cn(
                                "text-xs px-2 py-1 rounded-md font-medium",
                                settings.theme === 'dark' ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"
                              )}>{item.categoria}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'lista' && (
              <motion.div 
                key="lista"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                  "rounded-2xl border shadow-sm overflow-hidden",
                  settings.theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
                )}
              >
                <div className={cn(
                  "p-6 border-b flex justify-between items-center",
                  settings.theme === 'dark' ? "bg-slate-900/50 border-slate-700" : "bg-slate-50/50 border-slate-100"
                )}>
                  <h3 className={cn("font-bold", settings.theme === 'dark' ? "text-white" : "text-slate-700")}>Todos os Lançamentos</h3>
                  <div className="text-xs text-slate-400 font-medium">
                    Total de registros: {allExpenses.length}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className={cn(
                        "border-b",
                        settings.theme === 'dark' ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200"
                      )}>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Empresa</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Itens</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Categoria</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valor</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                      </tr>
                    </thead>
                    <tbody className={cn(
                      "divide-y",
                      settings.theme === 'dark' ? "divide-slate-700" : "divide-slate-100"
                    )}>
                      {allExpenses.map((item, idx) => (
                        <tr key={idx} className={cn(
                          "transition-colors",
                          settings.theme === 'dark' ? "hover:bg-slate-700/50" : "hover:bg-slate-50"
                        )}>
                          <td className={cn("px-6 py-4 font-semibold", settings.theme === 'dark' ? "text-white" : "text-slate-800")}>{item.empresa}</td>
                          <td className="px-6 py-4 text-xs text-slate-500">{(item as any).itens || '-'}</td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "text-xs px-2 py-1 rounded-md font-medium",
                              settings.theme === 'dark' ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"
                            )}>{item.categoria}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{format(parseISO(item.data), 'dd/MM/yyyy')}</td>
                          <td className={cn(
                            "px-6 py-4 font-bold",
                            item.status === 'Pago' ? "text-emerald-600" : (settings.theme === 'dark' ? "text-white" : "text-slate-800")
                          )}>{formatCurrency(item.valor)}</td>
                          <td className="px-6 py-4">
                            <StatusBadge status={item.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'about' && (
              <motion.div 
                key="about"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl space-y-8"
              >
                <div className={cn(
                  "p-10 rounded-3xl border shadow-sm",
                  settings.theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
                )}>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-xl shadow-emerald-200">K</div>
                    <div>
                      <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">Sobre o KwanzaPay</h3>
                      <p className="text-emerald-600 font-bold">Sua liberdade financeira começa aqui.</p>
                      <p className="text-xs text-slate-400 mt-1 font-medium italic">Desenvolvido por Ebenezer Vilola</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <h4 className="text-xl font-bold text-slate-800 dark:text-slate-200">O que é?</h4>
                      <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                        O KwanzaPay é um ecossistema inteligente de gestão financeira desenvolvido para simplificar o controle de obrigações, assinaturas e fluxos de caixa. Focado na experiência do usuário, ele transforma dados complexos em insights visuais claros.
                      </p>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-xl font-bold text-slate-800 dark:text-slate-200">Como funciona?</h4>
                      <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                        Através de algoritmos de automação, o sistema monitora vencimentos, gera recorrências automáticas e consolida históricos de pagamentos. Tudo o que você precisa fazer é cadastrar suas contas e o KwanzaPay cuida do resto.
                      </p>
                    </div>
                  </div>

                  <div className="mt-12 p-8 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                    <h4 className="text-lg font-bold text-emerald-800 dark:text-emerald-400 mb-4">Por que é importante?</h4>
                    <p className="text-emerald-700 dark:text-emerald-300 leading-relaxed">
                      A falta de controle financeiro é a principal causa de estresse e dívidas. O KwanzaPay elimina a "névoa mental" sobre seus gastos, permitindo que você tome decisões baseadas em dados, economize tempo e evite multas por atraso.
                    </p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <QRCodeCanvas id="qr-code-canvas" value={window.location.href} size={128} />
                    <p className="text-[10px] text-center mt-2 font-bold text-slate-400 uppercase tracking-widest">Link do Aplicativo</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'config' && (
              <motion.div 
                key="config"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-2xl space-y-6"
              >
                <div className={cn(
                  "p-8 rounded-2xl border shadow-sm",
                  settings.theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
                )}>
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Settings size={20} className="text-emerald-600" />
                    Preferências do Sistema
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-700 dark:text-slate-200">Tema Visual</p>
                        <p className="text-xs text-slate-400">Alternar entre modo claro e escuro</p>
                      </div>
                      <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
                        <button 
                          onClick={() => setSettings(s => ({ ...s, theme: 'light' }))}
                          className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", settings.theme === 'light' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400")}
                        >Claro</button>
                        <button 
                          onClick={() => setSettings(s => ({ ...s, theme: 'dark' }))}
                          className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", settings.theme === 'dark' ? "bg-slate-900 text-emerald-400 shadow-sm" : "text-slate-400")}
                        >Escuro</button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-700 dark:text-slate-200">Idioma / Moeda</p>
                        <p className="text-xs text-slate-400">Configuração regional do sistema</p>
                      </div>
                      <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
                        <button 
                          onClick={() => setSettings(s => ({ ...s, language: 'pt' }))}
                          className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", settings.language === 'pt' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400")}
                        >Português (Kz)</button>
                        <button 
                          onClick={() => setSettings(s => ({ ...s, language: 'en' }))}
                          className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", settings.language === 'en' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400")}
                        >English (USD)</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={cn(
                  "p-8 rounded-2xl border shadow-sm",
                  settings.theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
                )}>
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Settings size={20} className="text-emerald-600" />
                    Categorias de Gastos
                  </h3>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <input 
                        id="new-category"
                        placeholder="Nova categoria..."
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                      <button 
                        onClick={() => {
                          const input = document.getElementById('new-category') as HTMLInputElement;
                          if (input.value) {
                            setCategories(prev => [...prev, input.value]);
                            input.value = '';
                          }
                        }}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-colors"
                      >
                        Adicionar
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(cat => (
                        <div key={cat} className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600">
                          {cat}
                          <button 
                            onClick={() => setCategories(prev => prev.filter(c => c !== cat))}
                            className="text-slate-400 hover:text-rose-500"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'excel' && (
              <motion.div 
                key="excel"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">Guia de Implementação Excel & VBA</h3>
                      <p className="text-sm text-slate-500">Como replicar este sistema inteligente no Excel</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <section className="space-y-4">
                      <h4 className="font-bold text-slate-700 flex items-center gap-2">
                        <span className="w-6 h-6 bg-slate-800 text-white rounded-full flex items-center justify-center text-xs">1</span>
                        Estrutura de Tabelas
                      </h4>
                      <div className="bg-slate-50 p-4 rounded-xl text-sm space-y-2">
                        <p><strong>Planilha 'Contas':</strong> Formate como Tabela (Ctrl+T). Colunas A-J.</p>
                        <p><strong>Planilha 'Histórico':</strong> Colunas A-G. Mesma formatação.</p>
                        <p><strong>Planilha 'Configurações':</strong> Listas para Validação de Dados.</p>
                      </div>
                      
                      <h4 className="font-bold text-slate-700 flex items-center gap-2">
                        <span className="w-6 h-6 bg-slate-800 text-white rounded-full flex items-center justify-center text-xs">2</span>
                        Fórmulas do Dashboard
                      </h4>
                      <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-x-auto">
                        <p className="mb-2"># Total Pendente</p>
                        <p>=SOMASE(Contas[Status]; "Pendente"; Contas[Valor])</p>
                        <p className="mt-4 mb-2"># Total Atrasado</p>
                        <p>=SOMASE(Contas[Status]; "Atrasado"; Contas[Valor])</p>
                        <p className="mt-4 mb-2"># Pago no Mês Atual</p>
                        <p>=SOMASES(Histórico[Valor]; Histórico[Data]; "&gt;="&amp;DATA(ANO(HOJE());MES(HOJE());1))</p>
                        <p className="mt-4 mb-2"># Projeção Mensal</p>
                        <p>=[Total Pendente] + [Total Atrasado] + [Pago no Mês]</p>
                      </div>
                    </section>

                    <section className="space-y-4">
                      <h4 className="font-bold text-slate-700 flex items-center gap-2">
                        <span className="w-6 h-6 bg-slate-800 text-white rounded-full flex items-center justify-center text-xs">3</span>
                        Código VBA (Automação)
                      </h4>
                      <div className="bg-slate-900 text-slate-300 p-4 rounded-xl text-[10px] font-mono overflow-x-auto h-[300px]">
                        <pre>{`Sub RegistrarPagamento()
    Dim wsContas As Worksheet, wsHist As Worksheet
    Dim row As Long, nextRow As Long
    Set wsContas = Sheets("Contas")
    Set wsHist = Sheets("Histórico")
    
    row = ActiveCell.Row
    If wsContas.Cells(row, 8).Value <> "Pago" Then
        ' 1. Mover para Histórico
        nextRow = wsHist.Cells(Rows.Count, 1).End(xlUp).Row + 1
        wsHist.Cells(nextRow, 1).Value = wsContas.Cells(row, 1).Value ' ID
        wsHist.Cells(nextRow, 3).Value = wsContas.Cells(row, 2).Value ' Empresa
        wsHist.Cells(nextRow, 4).Value = wsContas.Cells(row, 6).Value ' Valor
        wsHist.Cells(nextRow, 5).Value = Date ' Data Hoje
        
        ' 2. Lógica de Recorrência
        If wsContas.Cells(row, 9).Value = "Sim" Then
            Dim newDate As Date
            newDate = DateAdd("m", 1, wsContas.Cells(row, 7).Value)
            ' Criar nova linha...
            wsContas.Cells(row, 7).Value = newDate
            wsContas.Cells(row, 8).Value = "Pendente"
        Else
            wsContas.Rows(row).Delete
        End If
    End If
End Sub`}</pre>
                      </div>
                      <button className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors">
                        <Download size={18} />
                        Baixar Template Excel (Simulado)
                      </button>
                    </section>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Add Account Modal */}
      {isAddingAccount && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              "rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto",
              settings.theme === 'dark' ? "bg-slate-800 text-white" : "bg-white text-slate-800"
            )}
          >
            <h3 className="text-xl font-bold mb-6">
              {editingAccount ? 'Editar Gasto' : 'Nova Conta a Pagar'}
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const accountData: Account = {
                id: editingAccount ? editingAccount.id : Math.random().toString(36).substr(2, 9),
                empresa: formData.get('empresa') as string,
                categoria: formData.get('categoria') as string,
                descricao: formData.get('descricao') as string,
                itens: formData.get('itens') as string,
                valor: Number(formData.get('valor')),
                vencimento: formData.get('vencimento') as string,
                status: editingAccount ? editingAccount.status : 'Pendente',
                isAssinatura: formData.get('recorrencia') !== 'Nenhuma',
                recorrencia: formData.get('recorrencia') as RecurrenceType,
              };
              
              if (editingAccount) {
                setAccounts(prev => prev.map(a => a.id === editingAccount.id ? accountData : a));
              } else {
                setAccounts(prev => [...prev, accountData]);
              }
              
              setIsAddingAccount(false);
              setEditingAccount(null);
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Empresa</label>
                <input name="empresa" defaultValue={editingAccount?.empresa} required className={cn(
                  "w-full border rounded-xl px-4 py-2 outline-none transition-all",
                  settings.theme === 'dark' ? "bg-slate-900 border-slate-700 focus:ring-emerald-500/20" : "bg-slate-50 border-slate-200 focus:ring-emerald-500/20"
                )} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Descrição</label>
                  <input name="descricao" defaultValue={editingAccount?.descricao} className={cn(
                    "w-full border rounded-xl px-4 py-2 outline-none transition-all",
                    settings.theme === 'dark' ? "bg-slate-900 border-slate-700 focus:ring-emerald-500/20" : "bg-slate-50 border-slate-200 focus:ring-emerald-500/20"
                  )} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Itens</label>
                  <input name="itens" defaultValue={editingAccount?.itens} placeholder="ex: 50GB, Pacote TV" className={cn(
                    "w-full border rounded-xl px-4 py-2 outline-none transition-all",
                    settings.theme === 'dark' ? "bg-slate-900 border-slate-700 focus:ring-emerald-500/20" : "bg-slate-50 border-slate-200 focus:ring-emerald-500/20"
                  )} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Categoria</label>
                  <select name="categoria" defaultValue={editingAccount?.categoria} className={cn(
                    "w-full border rounded-xl px-4 py-2 outline-none transition-all",
                    settings.theme === 'dark' ? "bg-slate-900 border-slate-700 focus:ring-emerald-500/20" : "bg-slate-50 border-slate-200 focus:ring-emerald-500/20"
                  )}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Valor ({settings.language === 'pt' ? 'Kz' : '$'})</label>
                  <input name="valor" type="number" defaultValue={editingAccount?.valor} required className={cn(
                    "w-full border rounded-xl px-4 py-2 outline-none transition-all",
                    settings.theme === 'dark' ? "bg-slate-900 border-slate-700 focus:ring-emerald-500/20" : "bg-slate-50 border-slate-200 focus:ring-emerald-500/20"
                  )} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Vencimento</label>
                <input name="vencimento" type="date" defaultValue={editingAccount?.vencimento} required className={cn(
                  "w-full border rounded-xl px-4 py-2 outline-none transition-all",
                  settings.theme === 'dark' ? "bg-slate-900 border-slate-700 focus:ring-emerald-500/20" : "bg-slate-50 border-slate-200 focus:ring-emerald-500/20"
                )} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Recorrência</label>
                <select name="recorrencia" defaultValue={editingAccount?.recorrencia || 'Nenhuma'} className={cn(
                  "w-full border rounded-xl px-4 py-2 outline-none transition-all",
                  settings.theme === 'dark' ? "bg-slate-900 border-slate-700 focus:ring-emerald-500/20" : "bg-slate-50 border-slate-200 focus:ring-emerald-500/20"
                )}>
                  <option value="Nenhuma">Nenhuma</option>
                  <option value="Diário">Diário</option>
                  <option value="Semanal">Semanal</option>
                  <option value="Mensal">Mensal</option>
                  <option value="Anual">Anual</option>
                </select>
              </div>
              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <button 
                  type="button"
                  onClick={() => {
                    setIsAddingAccount(false);
                    setEditingAccount(null);
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 font-bold py-3 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-emerald-200 dark:shadow-none"
                >
                  {editingAccount ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function NavItem({ active, onClick, icon, label, theme }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, theme?: 'light' | 'dark' }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
        active 
          ? (theme === 'dark' ? "bg-emerald-900/40 text-emerald-400" : "bg-emerald-50 text-emerald-700") 
          : (theme === 'dark' ? "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700")
      )}
    >
      {icon}
      {label}
      {active && <ChevronRight size={16} className="ml-auto" />}
    </button>
  );
}

function StatCard({ title, value, icon, color, theme }: { title: string, value: string, icon: React.ReactNode, color: string, theme?: 'light' | 'dark' }) {
  const colorClasses: Record<string, string> = {
    amber: theme === 'dark' ? "bg-amber-900/20 text-amber-500" : "bg-amber-50 text-amber-700",
    rose: theme === 'dark' ? "bg-rose-900/20 text-rose-500" : "bg-rose-50 text-rose-700",
    emerald: theme === 'dark' ? "bg-emerald-900/20 text-emerald-500" : "bg-emerald-50 text-emerald-700",
    blue: theme === 'dark' ? "bg-blue-900/20 text-blue-500" : "bg-blue-50 text-blue-700",
  };

  return (
    <div className={cn(
      "p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all",
      theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-2 rounded-lg", colorClasses[color])}>
          {icon}
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Este Mês</span>
      </div>
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</h4>
      <p className={cn("text-2xl font-bold tracking-tight", theme === 'dark' ? "text-white" : "text-slate-800")}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: StatusType }) {
  const configs = {
    Pendente: { bg: 'bg-amber-50', text: 'text-amber-700', icon: <Clock size={12} /> },
    Pago: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: <CheckCircle2 size={12} /> },
    Atrasado: { bg: 'bg-rose-50', text: 'text-rose-700', icon: <AlertCircle size={12} /> },
  };

  const config = configs[status];

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", config.bg, config.text)}>
      {config.icon}
      {status}
    </span>
  );
}
