import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User, Key, LayoutDashboard } from 'lucide-react';

const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const success = await login(username, password);
    if (!success) {
        setError('Usuário ou senha incorretos.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-amber-900/10 z-0"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brewery-accent to-transparent opacity-50"></div>

      <div className="w-full max-w-md bg-brewery-card/80 border border-brewery-border backdrop-blur-xl p-8 rounded-2xl shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
        <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-brewery-accent to-amber-700 rounded-xl flex items-center justify-center shadow-lg mb-4 text-black">
                <LayoutDashboard size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Industrial Viewport Pro</h1>
            <p className="text-brewery-muted text-sm mt-1">Acesso Restrito</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-brewery-muted pl-1">Usuário</label>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input 
                        className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-brewery-accent transition-colors"
                        placeholder="Ex: admin"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-brewery-muted pl-1">Senha</label>
                <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input 
                        type="password"
                        className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-brewery-accent transition-colors"
                        placeholder="••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
            </div>

            {error && (
                <div className="p-3 bg-rose-950/50 border border-rose-500/50 rounded-lg text-rose-300 text-sm text-center font-medium animate-in fade-in slide-in-from-top-2">
                    {error}
                </div>
            )}

            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-brewery-accent hover:bg-amber-400 text-black font-bold py-3.5 rounded-lg shadow-lg shadow-amber-900/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {loading ? 'Autenticando...' : 'Entrar no Sistema'}
                {!loading && <Lock size={16} />}
            </button>
        </form>
        
        <div className="mt-8 text-center">
            <p className="text-[10px] text-zinc-600">
                &copy; 2024 Industrial Viewport HMI. Authorized Personnel Only.
            </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;