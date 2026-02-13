import React from 'react';
import { XCircle } from 'lucide-react';
import { useDataContext } from '../context/DataContext';

const ErrorToast = () => {
    const { globalError, clearError } = useDataContext();

    if (!globalError) return null;

    return (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-4 fade-in duration-300 w-full max-w-md px-4">
            <div className="bg-rose-950/90 border border-rose-500 text-white rounded-lg shadow-2xl p-4 flex items-start gap-3 backdrop-blur-md">
                <XCircle className="text-rose-400 shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                    <h4 className="font-bold text-sm">Erro de Conexão</h4>
                    <p className="text-xs text-rose-200 mt-1">{globalError}</p>
                </div>
                <button 
                    onClick={clearError}
                    className="text-rose-400 hover:text-white transition-colors"
                >
                    <span className="sr-only">Fechar</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
        </div>
    );
};

export default ErrorToast;