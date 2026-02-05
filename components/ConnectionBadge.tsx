import React from 'react';
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR';
  isStale: boolean;
}

const ConnectionBadge: React.FC<Props> = ({ status, isStale }) => {
  if (isStale && status === 'CONNECTED') {
    return (
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
        <AlertTriangle size={16} />
        <span className="text-sm font-mono font-bold">DATA STALE</span>
      </div>
    );
  }

  switch (status) {
    case 'CONNECTED':
      return (
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
          <Wifi size={16} />
          <span className="text-sm font-mono font-bold">ONLINE</span>
        </div>
      );
    case 'CONNECTING':
      return (
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-500 border border-blue-500/30 animate-pulse">
          <RefreshCw size={16} className="animate-spin" />
          <span className="text-sm font-mono font-bold">CONNECTING</span>
        </div>
      );
    default:
      return (
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-500 border border-rose-500/30">
          <WifiOff size={16} />
          <span className="text-sm font-mono font-bold">OFFLINE</span>
        </div>
      );
  }
};

export default ConnectionBadge;
