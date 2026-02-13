import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User, Key, ChevronRight, AlertCircle, ShieldCheck, WifiOff } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      // Check if response is JSON (API might be down and returning HTML 404 from Vite)
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Backend not available (JSON expected)");
      }

      const data = await response.json();

      if (response.ok) {
        login(data.token, data.user);
      } else {
        setError(data.error || 'Falha no login');
      }
    } catch (err) {
      console.warn("Login failed via API, checking for Demo credentials...", err);
      
      // --- PREVIEW / DEMO MODE FALLBACK ---
      // If the backend is not running (e.g. in `vite preview`), allow admin access
      // to demonstrate the UI functionality.
      if (username === 'admin' && password === 'admin123') {
          setTimeout(() => {
              login('DEMO_TOKEN_' + Date.now(), { id: 1, username: 'admin', role: 'ADMIN' });
          }, 800); // Fake delay for realism
          return;
      }
      
      setError('Erro de conexão com o servidor. (Modo Offline falhou)');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0a08] relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(#f59e0b 1px, transparent 1px)', backgroundSize: '30px 30px' }} 
      />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brewery-accent to-transparent opacity-50"></div>

      <div className="w-full max-w-md p-8 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header */}
        <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brewery-accent/10 border border-brewery-accent mb-6 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                <Lock className="text-brewery-accent" size={32} />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase">Industrial Viewport</h1>
            <p className="text-brewery-muted text-sm mt-2 tracking-widest font-mono">Acesso Restrito • Autorização Requerida</p>
        </div>

        {/* Form Card */}
        <div className="bg-[#1a110d] border border-brewery-border rounded-xl p-8 shadow-2xl relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-brewery-accent to-amber-800 rounded-xl opacity-20 blur group-hover:opacity-40 transition duration-1000"></div>
            
            <form onSubmit={handleSubmit} className="relative space-y-6">
                {error && (
                    <div className="bg-rose-950/50 border border-rose-500/50 text-rose-200 p-3 rounded text-sm flex items-center gap-2 animate-pulse">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-brewery-muted ml-1">Usuário / ID</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-brewery-muted" size={18} />
                        <input 
                            type="text" 
                            className="w-full bg-black/40 border border-brewery-border rounded-lg py-3 pl-10 pr-4 text-white focus:border-brewery-accent focus:outline-none transition-colors"
                            placeholder="admin"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-brewery-muted ml-1">Senha</label>
                    <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-brewery-muted" size={18} />
                        <input 
                            type="password" 
                            className="w-full bg-black/40 border border-brewery-border rounded-lg py-3 pl-10 pr-4 text-white focus:border-brewery-accent focus:outline-none transition-colors"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-brewery-accent hover:bg-amber-400 text-black font-bold py-3.5 rounded-lg transition-all flex items-center justify-center gap-2 group/btn disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        'Autenticando...'
                    ) : (
                        <>
                            <ShieldCheck size={18} /> Acessar Sistema <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform"/>
                        </>
                    )}
                </button>
            </form>
        </div>

        <div className="text-center mt-8 text-[10px] text-zinc-600 font-mono flex justify-center items-center gap-2">
            SECURE CONNECTION ESTABLISHED • v2.0.0
        </div>
      </div>
    </div>
  );
};

export default LoginPage;