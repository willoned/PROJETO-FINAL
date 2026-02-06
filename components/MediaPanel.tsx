import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMachineContext } from '../context/MachineContext';
import { Upload, Play, Pause, Plus, FileVideo, FileImage, List, X, ArrowUp, ArrowDown, Trash2, FileCode, Globe, Timer } from 'lucide-react';

interface Props {
    playlistKey: string;
}

const MediaPanel: React.FC<Props> = ({ playlistKey }) => {
  const { playlists, addMedia, removeMedia, reorderMedia, layout } = useMachineContext();
  
  // Select the specific playlist based on the key passed (floating vs banner)
  const mediaPlaylist = playlists[playlistKey] || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  
  // Timer State (Remaining Seconds)
  const [timeLeft, setTimeLeft] = useState(0);

  // Track created URLs to revoke them on unmount to prevent memory leaks
  const createdUrls = useRef<Set<string>>(new Set());

  // Cleanup effect
  useEffect(() => {
    return () => {
      createdUrls.current.forEach((url) => URL.revokeObjectURL(url));
      createdUrls.current.clear();
    };
  }, []);

  const itemToRender = mediaPlaylist[currentIndex];

  // Logic to handle rotation and countdown
  useEffect(() => {
    if (!isPlaying || mediaPlaylist.length === 0 || !itemToRender) {
        setTimeLeft(0);
        return;
    }

    // Safety check if index is out of bounds due to deletion
    if (currentIndex >= mediaPlaylist.length) {
      setCurrentIndex(0);
      return;
    }

    // VIDEO Logic: Handled by <video onTimeUpdate>
    if (itemToRender.type === 'VIDEO') {
        return; 
    }

    // IMAGE/HTML Logic: Countdown Interval
    const durationSec = itemToRender.duration;
    setTimeLeft(durationSec);

    const startTime = Date.now();
    const endTime = startTime + durationSec * 1000;

    const interval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.ceil((endTime - now) / 1000);
        
        if (remaining <= 0) {
            clearInterval(interval);
            // Move to next
            setCurrentIndex((prev) => (prev + 1) % mediaPlaylist.length);
        } else {
            setTimeLeft(remaining);
        }
    }, 200); // Check 5 times a second for responsiveness

    return () => {
        clearInterval(interval);
    };
  }, [currentIndex, isPlaying, mediaPlaylist.length, itemToRender]); 

  const processFiles = useCallback((files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach((file) => {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      const isHtml = file.type === 'text/html' || file.name.endsWith('.html') || file.name.endsWith('.htm');

      if (!isVideo && !isImage && !isHtml) return;

      const url = URL.createObjectURL(file);
      createdUrls.current.add(url); // Track for cleanup

      let type: 'VIDEO' | 'IMAGE' | 'HTML' = 'IMAGE';
      if (isVideo) type = 'VIDEO';
      if (isHtml) type = 'HTML';
      
      addMedia(playlistKey, {
        id: Date.now().toString() + Math.random().toString().slice(2),
        name: file.name,
        type,
        url,
        duration: isHtml ? 30 : 10 // Default 30s for HTML, 10s for images
      });
    });
  }, [addMedia, playlistKey]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
  };

  // Drag and Drop Handlers
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  // Determine fit style based on layout setting
  const fitClass = layout.mediaFit === 'COVER' ? 'object-cover' : 'object-contain';

  // --- Empty State ---
  if (mediaPlaylist.length === 0) {
    return (
      <div 
        className={`h-full w-full flex flex-col items-center justify-center bg-zinc-900 border-2 rounded-xl p-8 transition-colors duration-200 relative group ${isDragging ? 'border-indigo-500 bg-zinc-900/80' : 'border-zinc-800 border-dashed'}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className="pointer-events-none flex flex-col items-center">
            <Upload className={`mb-4 transition-colors ${isDragging ? 'text-indigo-400' : 'text-zinc-600 group-hover:text-indigo-500'}`} size={48} />
            <h3 className="text-zinc-400 font-medium">{isDragging ? 'Solte os arquivos aqui' : 'Playlist Vazia'}</h3>
            <p className="text-zinc-600 text-xs mt-1 mb-4 text-center">Arraste arquivos ou clique para adicionar.<br/>Suporta Imagens, Vídeos e HTML.</p>
        </div>
        
        <label className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded cursor-pointer transition text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 z-10">
          <Plus size={16} />
          Adicionar Mídia
          <input type="file" className="hidden" multiple accept="image/*,video/*,text/html,.html,.htm" onChange={handleFileUpload} />
        </label>
      </div>
    );
  }

  const currentItem = mediaPlaylist[currentIndex] || mediaPlaylist[0];

  return (
    <div 
        className="h-full w-full flex flex-col bg-black overflow-hidden relative group border-none"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-indigo-900/80 backdrop-blur-sm flex items-center justify-center border-4 border-indigo-500 rounded-xl">
           <Upload className="text-white animate-bounce" size={64} />
        </div>
      )}

      {/* NEW: Top Left Countdown Indicator */}
      {isPlaying && (
        <div className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-3 py-1 text-xs font-mono font-bold text-white flex items-center gap-2 shadow-lg animate-in fade-in duration-300">
            <Timer size={12} className="text-brewery-accent" />
            <span>{timeLeft}s</span>
        </div>
      )}

      {/* Display Area */}
      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden w-full h-full">
        {currentItem.type === 'HTML' ? (
            <iframe 
                key={currentItem.id}
                src={currentItem.url}
                className="w-full h-full border-0 bg-white"
                sandbox="allow-scripts allow-same-origin"
                title={currentItem.name}
            />
        ) : currentItem.type === 'IMAGE' ? (
          <img 
            key={currentItem.id} 
            src={currentItem.url} 
            alt={currentItem.name} 
            className={`w-full h-full ${fitClass} animate-in fade-in duration-700`}
          />
        ) : (
          <video 
            key={currentItem.id}
            src={currentItem.url} 
            className={`w-full h-full ${fitClass}`}
            autoPlay 
            muted 
            playsInline
            onTimeUpdate={(e) => {
                const v = e.currentTarget;
                if(v.duration) {
                    const left = Math.ceil(v.duration - v.currentTime);
                    // Avoid unnecessary state updates if second hasn't changed
                    if (left !== timeLeft) setTimeLeft(left);
                }
            }}
            onEnded={() => {
                setCurrentIndex((prev) => (prev + 1) % mediaPlaylist.length)
            }}
          />
        )}
        
        {/* Info Overlay */}
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 pb-6 z-10 pointer-events-none transition-opacity duration-300 ${showPlaylist ? 'opacity-0' : 'opacity-100'}`}>
          <div className="flex items-center gap-2 mb-2">
             {currentItem.type === 'VIDEO' ? <FileVideo size={14} className="text-indigo-400"/> : 
              currentItem.type === 'HTML' ? <Globe size={14} className="text-orange-400"/> :
              <FileImage size={14} className="text-emerald-400"/>}
             <p className="text-white font-medium truncate drop-shadow-md text-sm">{currentItem.name}</p>
          </div>
          {/* Playlist Indicators (Small Dots) */}
          <div className="flex gap-1 h-1 bg-zinc-800/50 rounded-full overflow-hidden w-1/3 opacity-50">
             {mediaPlaylist.map((item, idx) => (
               <div 
                  key={item.id} 
                  className={`flex-1 transition-colors duration-300 ${idx === currentIndex ? 'bg-white' : 'bg-white/10'}`} 
               />
             ))}
          </div>
        </div>
      </div>

      {/* Floating Toolbar */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-20 transition-transform duration-300 translate-x-16 group-hover:translate-x-0">
        <button 
          onClick={() => setShowPlaylist(!showPlaylist)}
          className={`p-3 rounded-xl backdrop-blur-md border shadow-xl transition-all hover:scale-105 ${showPlaylist ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-zinc-900/80 hover:bg-zinc-800 text-white border-zinc-700'}`}
          title="Playlist"
        >
          <List size={20} />
        </button>

        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-3 bg-zinc-900/80 hover:bg-zinc-800 text-white rounded-xl backdrop-blur-md border border-zinc-700 shadow-xl transition-all hover:scale-105"
          title={isPlaying ? "Pausar" : "Reproduzir"}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
        
        <label className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl cursor-pointer shadow-xl shadow-indigo-900/40 transition-all hover:scale-105" title="Adicionar Mídia">
          <Upload size={20} />
          <input type="file" className="hidden" multiple accept="image/*,video/*,text/html,.html,.htm" onChange={handleFileUpload} />
        </label>
      </div>

      {/* Internal Playlist Sidebar */}
      {showPlaylist && (
         <div className="absolute inset-y-0 right-0 w-80 bg-zinc-950/95 backdrop-blur-xl border-l border-zinc-800 z-30 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center shrink-0">
                <h3 className="font-bold text-white flex items-center gap-2"><List size={18}/> Playlist</h3>
                <button onClick={() => setShowPlaylist(false)} className="text-zinc-400 hover:text-white p-1 hover:bg-white/10 rounded"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {mediaPlaylist.map((item, index) => (
                    <div key={item.id} className={`p-2 rounded-lg border flex gap-3 group transition-colors ${index === currentIndex ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800'}`}>
                        {/* Thumbnail */}
                        <div 
                            className="w-16 h-10 bg-black rounded overflow-hidden cursor-pointer shrink-0 relative border border-white/5 flex items-center justify-center"
                            onClick={() => setCurrentIndex(index)}
                        >
                             {item.type === 'VIDEO' ? <video src={item.url} className="w-full h-full object-cover opacity-60" /> : 
                              item.type === 'HTML' ? <FileCode className="text-orange-500 opacity-80" /> :
                              <img src={item.url} className="w-full h-full object-cover" />}
                             
                             {index === currentIndex && <div className="absolute inset-0 flex items-center justify-center bg-black/40"><Play size={12} className="text-white fill-white"/></div>}
                        </div>
                        
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <p className={`text-xs font-medium truncate ${index === currentIndex ? 'text-indigo-300' : 'text-zinc-300'}`}>{item.name}</p>
                            <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                                {item.type === 'VIDEO' ? <FileVideo size={10}/> : item.type === 'HTML' ? <Globe size={10}/> : <FileImage size={10}/>}
                                {item.type} {item.type !== 'VIDEO' && `(${item.duration}s)`}
                            </p>
                        </div>

                        {/* Controls */}
                        <div className="flex flex-col gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <div className="flex gap-1">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); if(index > 0) reorderMedia(playlistKey, index, index - 1); }}
                                    disabled={index === 0}
                                    className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white disabled:opacity-20 transition-colors"
                                    title="Mover para cima"
                                >
                                    <ArrowUp size={12} />
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); if(index < mediaPlaylist.length - 1) reorderMedia(playlistKey, index, index + 1); }}
                                    disabled={index === mediaPlaylist.length - 1}
                                    className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white disabled:opacity-20 transition-colors"
                                    title="Mover para baixo"
                                >
                                    <ArrowDown size={12} />
                                </button>
                             </div>
                             <button 
                                onClick={(e) => { e.stopPropagation(); removeMedia(playlistKey, item.id); }}
                                className="p-1 hover:bg-rose-900/30 rounded text-zinc-500 hover:text-rose-400 self-end transition-colors"
                                title="Remover"
                             >
                                <Trash2 size={12} />
                             </button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-3 border-t border-zinc-800 text-[10px] text-center text-zinc-600 bg-black/20">
                Arraste arquivos para adicionar • {mediaPlaylist.length} itens
            </div>
         </div>
       )}
    </div>
  );
};

export default MediaPanel;