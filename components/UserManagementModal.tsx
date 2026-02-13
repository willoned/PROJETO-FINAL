import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Trash2, UserPlus, Shield, ShieldAlert, X } from 'lucide-react';
import { UserRole } from '../types';

interface Props {
    onClose: () => void;
}

interface UserData {
    id: number;
    username: string;
    role: UserRole;
    created_at: string;
}

const UserManagementModal: React.FC<Props> = ({ onClose }) => {
    const { token, user: currentUser } = useAuth();
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Form State
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState<UserRole>('OPERATOR');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const isDemo = token?.startsWith('DEMO_TOKEN');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        // MOCK DATA FOR DEMO MODE
        if (isDemo) {
            setUsers([
                { id: 1, username: 'admin', role: 'ADMIN', created_at: new Date().toISOString() },
                { id: 2, username: 'operador_demo', role: 'OPERATOR', created_at: new Date().toISOString() },
                { id: 3, username: 'supervisor', role: 'OPERATOR', created_at: new Date().toISOString() }
            ]);
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // MOCK CREATE FOR DEMO
        if (isDemo) {
            setTimeout(() => {
                const newUser: UserData = {
                    id: Math.floor(Math.random() * 1000),
                    username: newUsername,
                    role: newRole,
                    created_at: new Date().toISOString()
                };
                setUsers([...users, newUser]);
                setSuccess(`[DEMO] Usuário ${newUsername} simulado com sucesso!`);
                setNewUsername('');
                setNewPassword('');
            }, 500);
            return;
        }

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: newUsername, password: newPassword, role: newRole })
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(`Usuário ${newUsername} criado com sucesso!`);
                setNewUsername('');
                setNewPassword('');
                fetchUsers();
            } else {
                setError(data.error || 'Erro ao criar usuário');
            }
        } catch (e) {
            setError('Erro de conexão');
        }
    };

    const handleDelete = async (id: number) => {
        if(!confirm('Tem certeza que deseja remover este usuário?')) return;

        // MOCK DELETE FOR DEMO
        if (isDemo) {
            setUsers(users.filter(u => u.id !== id));
            return;
        }

        try {
            const res = await fetch(`/api/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                fetchUsers();
            } else {
                const data = await res.json();
                alert(data.error);
            }
        } catch (e) {
            alert('Erro ao deletar');
        }
    };

    return (
        <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-brewery-card border border-brewery-border w-full max-w-4xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-500/20 p-2 rounded text-indigo-400">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Gestão de Usuários</h2>
                            <p className="text-xs text-brewery-muted">
                                {isDemo ? '[MODO DEMONSTRAÇÃO] Dados não serão salvos no banco.' : 'Apenas administradores podem criar ou remover acessos.'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <X size={20} className="text-zinc-400" />
                    </button>
                </div>

                <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                    {/* LEFT: Create Form */}
                    <div className="w-full md:w-1/3 bg-black/20 p-6 border-r border-white/5 space-y-6">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">Novo Usuário</h3>
                        
                        <form onSubmit={handleCreate} className="space-y-4">
                            {error && <div className="p-3 bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs rounded">{error}</div>}
                            {success && <div className="p-3 bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-xs rounded">{success}</div>}

                            <div>
                                <label className="label-pro">Nome de Usuário</label>
                                <input className="input-pro" value={newUsername} onChange={e => setNewUsername(e.target.value)} required />
                            </div>
                            <div>
                                <label className="label-pro">Senha</label>
                                <input className="input-pro" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                            </div>
                            <div>
                                <label className="label-pro">Permissão</label>
                                <select className="input-pro" value={newRole} onChange={e => setNewRole(e.target.value as UserRole)}>
                                    <option value="OPERATOR">Operador (Visualização)</option>
                                    <option value="ADMIN">Administrador (Total)</option>
                                </select>
                            </div>
                            <button className="btn-primary w-full mt-2">
                                <UserPlus size={16} className="mr-2"/> Criar Acesso
                            </button>
                        </form>
                    </div>

                    {/* RIGHT: User List */}
                    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-brewery-bg">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2 mb-4">Usuários Cadastrados</h3>
                        
                        {isLoading ? (
                            <div className="text-center py-10 text-zinc-500">Carregando...</div>
                        ) : (
                            <div className="space-y-3">
                                {users.map(u => (
                                    <div key={u.id} className="flex items-center justify-between p-4 bg-brewery-card border border-white/5 rounded-lg hover:border-white/20 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${u.role === 'ADMIN' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-zinc-700/20 text-zinc-400'}`}>
                                                {u.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white">{u.username} {currentUser?.id === u.id && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 rounded-full ml-2">VOCÊ</span>}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${u.role === 'ADMIN' ? 'border-indigo-500/30 text-indigo-300 bg-indigo-900/20' : 'border-zinc-600/30 text-zinc-400 bg-zinc-800'}`}>
                                                        {u.role}
                                                    </span>
                                                    <span className="text-[10px] text-zinc-600">ID: {u.id}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {currentUser?.id !== u.id && (
                                            <button 
                                                onClick={() => handleDelete(u.id)}
                                                className="p-2 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded transition-colors"
                                                title="Remover Usuário"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserManagementModal;