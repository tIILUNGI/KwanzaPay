import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, ChevronLeft, Eye, EyeOff, User as UserIcon } from 'lucide-react';
import { type User } from '../types';

interface LoginPageProps {
  onLogin: (user: User) => void;
  onBack: () => void;
}

type AuthMode = 'login' | 'signup';

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onBack }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    if (mode === 'login') {
      if (!email || !password) {
        setError('Por favor, preencha todos os campos.');
        return false;
      }
    } else {
      if (!name || !email || !password || !confirmPassword) {
        setError('Por favor, preencha todos os campos.');
        return false;
      }
      if (password !== confirmPassword) {
        setError('As senhas não coincidem.');
        return false;
      }
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const displayName = mode === 'signup' ? name : email.split('@')[0];

    onLogin({
      id: 'user-' + Math.random().toString(36).substr(2, 9),
      name: displayName,
      email: email,
      avatar: `https://picsum.photos/seed/${email}/100/100`,
    });
    setIsLoading(false);
  };

  const handleSocialLogin = async (provider: string) => {
    setIsLoading(true);
    // Simulate OAuth popup/API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const simulatedEmail = `${provider.toLowerCase()}@example.com`;
    const simulatedName = `${provider} User`;

    onLogin({
      id: `social-${provider}-${Math.random().toString(36).substr(2, 9)}`,
      name: simulatedName,
      email: simulatedEmail,
      avatar: `https://picsum.photos/seed/${provider}/100/100`,
    });
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 font-sans overflow-x-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100"
      >
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-600 mb-8 transition-colors text-sm font-bold uppercase tracking-widest"
        >
          <ChevronLeft size={18} />
          Voltar
        </button>

        <div className="mb-8">
          <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl mb-6 shadow-xl shadow-emerald-200">K</div>
          <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
            {mode === 'login' ? 'Bem-vindo de volta' : 'Criar sua conta'}
          </h2>
          <p className="text-slate-500 font-medium">
            {mode === 'login' ? 'Acesse sua conta para gerenciar suas finanças.' : 'Comece sua jornada financeira hoje mesmo.'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.form 
            key={mode}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            onSubmit={handleSubmit} 
            className="space-y-5 mb-8"
          >
            {error && (
              <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-xs font-bold border border-rose-100 animate-shake">
                {error}
              </div>
            )}

            {mode === 'signup' && (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nome Completo</label>
                <div className="relative group">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium text-slate-700"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">E-mail</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium text-slate-700"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Senha</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-12 py-4 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium text-slate-700"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Confirmar Senha</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium text-slate-700"
                  />
                </div>
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-emerald-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                mode === 'login' ? 'Entrar Agora' : 'Criar Conta'
              )}
            </button>
          </motion.form>
        </AnimatePresence>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-white px-4 text-slate-400 font-black tracking-[0.2em]">Ou continue com</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <SocialButton 
            imageUrl="https://img.lovepik.com/png/20231120/google-internet-icon-vector-Google-system-engineer_642910_wh860.png" 
            label="Google" 
            onClick={() => handleSocialLogin('Google')}
            disabled={isLoading}
          />
          <SocialButton 
            imageUrl="https://tse2.mm.bing.net/th/id/OIP.G2d8flNBlN_KgmRySqAklAHaHa?rs=1&pid=ImgDetMain&o=7&rm=3" 
            label="Apple" 
            onClick={() => handleSocialLogin('Apple')}
            disabled={isLoading}
          />
          <SocialButton 
            imageUrl="https://www.pngmart.com/files/23/Github-Logo-PNG-Photo-1.png" 
            label="GitHub" 
            onClick={() => handleSocialLogin('GitHub')}
            disabled={isLoading}
          />
        </div>

        <p className="mt-10 text-center text-slate-500 text-sm font-medium">
          {mode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'} 
          <button 
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setError('');
            }}
            className="text-emerald-600 font-black hover:underline ml-1"
          >
            {mode === 'login' ? 'Criar agora' : 'Fazer login'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

const SocialButton = ({ imageUrl, label, onClick, disabled }: { imageUrl: string, label: string, onClick: () => void, disabled?: boolean }) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className="flex items-center justify-center p-4 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95 group disabled:opacity-50 disabled:cursor-not-allowed"
    title={label}
  >
    <img 
      src={imageUrl} 
      alt={label} 
      className="w-6 h-6 object-contain transition-all" 
      referrerPolicy="no-referrer"
    />
  </button>
);
