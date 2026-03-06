import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Shield, Zap, BarChart3, Globe } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-6">
              <Zap size={14} />
              Gestão Financeira Inteligente
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6">
              Domine suas finanças com o <span className="text-emerald-600">KwanzaPay</span>
            </h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10">
              A solução definitiva para gestão de contas a pagar, recorrências e dashboards inteligentes. Simples, potente e feito para você.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={onStart}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-200"
              >
                Começar Agora
                <ChevronRight size={20} />
              </button>
              <button className="w-full sm:w-auto bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-8 py-4 rounded-2xl font-bold text-lg transition-all">
                Ver Demonstração
              </button>
            </div>
          </motion.div>
        </div>

        {/* Floating Elements (Visual) */}
        <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl -z-10" />
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <FeatureCard 
              icon={<Shield className="text-emerald-600" size={32} />}
              title="Segurança Total"
              description="Seus dados financeiros protegidos com criptografia de ponta a ponta."
            />
            <FeatureCard 
              icon={<BarChart3 className="text-blue-600" size={32} />}
              title="Dashboards Reais"
              description="Visualize seus gastos em tempo real com gráficos interativos e precisos."
            />
            <FeatureCard 
              icon={<Globe className="text-amber-600" size={32} />}
              title="Acesso Global"
              description="Gerencie suas contas de qualquer lugar, em qualquer dispositivo."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-400 text-sm">
          © 2026 KwanzaPay. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm"
  >
    <div className="mb-6">{icon}</div>
    <h3 className="text-xl font-bold text-slate-800 mb-3">{title}</h3>
    <p className="text-slate-500 leading-relaxed">{description}</p>
  </motion.div>
);
