import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMachineContext } from '../context/MachineContext';
import { Upload, Play, Pause, Plus, FileVideo, FileImage, List, X, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';

const MediaPanel: React.FC = () => {
  const { mediaPlaylist, addMedia, removeMedia, reorderMedia, layout } = useMachineContext();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  
  // Track created URLs to revoke them on unmount to prevent memory leaks
  const createdUrls = useRef<Set<string>>(new Set());

  // Cleanup effect
  useEffect(() => {
    return () => {
      createdUrls.current.forEach((url) => URL.revokeObjectURL(url));
      createdUrls.current.clear();
    };
  }, []);

  // Playlist Rotation Logic
  useEffect(() => {
    if (!isPlaying || mediaPlaylist.length === 0) return;

    // Safety check if index is out of bounds due to deletion
    if (currentIndex >= mediaPlaylist.length) {
      setCurrentIndex(0);
      return;
    }

    const item = mediaPlaylist[currentIndex];
    
    // If it's a video, we wait for the onEnded event instead of a timer
    if (item.type === 'VIDEO') return;

    const duration = item.duration * 1000;
    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % mediaPlaylist.length);
    }, duration);

    return () => clearTimeout(timer);
  }, [currentIndex, isPlaying, mediaPlaylist]);

  const processFiles = useCallback((files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach((file) => {
      // Support Image (including GIF) and Video
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) return;

      const url = URL.createObjectURL(file);
      createdUrls.current.add(url); // Track for cleanup

      const type = file.type.startsWith('video') ? 'VIDEO' : 'IMAGE';
      
      addMedia({
        id: Date.now().toString() + Math.random().toString().slice(2),
        name: file.name,
        type,
        url,
        duration: 10 // Default 10s for images/gifs
      });
    });
  }, [addMedia]);

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
            <p className="text-zinc-600 text-xs mt-1 mb-4 text-center">Arraste arquivos ou clique para adicionar.<br/>Suporta Imagens, GIFs e Vídeos.</p>
        </div>
        
        <label className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded cursor-pointer transition text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 z-10">
          <Plus size={16} />
          Adicionar Mídia
          <input type="file" className="hidden" multiple accept="image/*,video/*" onChange={handleFileUpload} />
        </label>
      </div>
    );
  }

  const itemToRender = mediaPlaylist[currentIndex] || mediaPlaylist[0];

  return (
    <div 
        className="h-full w-full flex flex-col bg-black rounded-xl overflow-hidden relative group border border-zinc-800"
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

      {/* Display Area */}
      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden w-full h-full">
        {itemToRender.type === 'IMAGE' ? (
          <img 
            key={itemToRender.id} // Key change forces animation reset
            src={itemToRender.url} 
            alt={itemToRender.name} 
            className={`w-full h-full ${fitClass} animate-in fade-in duration-700`}
          />
        ) : (
          <video 
            key={itemToRender.id}
            src={itemToRender.url} 
            className={`w-full h-full ${fitClass}`}
            autoPlay 
            muted 
            playsInline
            onEnded={() => setCurrentIndex((prev) => (prev + 1) % mediaPlaylist.length)}
          />
        )}
        
        {/* Info Overlay */}
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 z-10 pointer-events-none transition-opacity duration-300 ${showPlaylist ? 'opacity-0' : 'opacity-100'}`}>
          <div className="flex items-center gap-2 mb-2">
             {itemToRender.type === 'VIDEO' ? <FileVideo size={14} className="text-indigo-400"/> : <FileImage size={14} className="text-emerald-400"/>}
             <p className="text-white font-medium truncate drop-shadow-md text-sm">{itemToRender.name}</p>
          </div>
          <div className="flex gap-1 h-1 bg-zinc-800/50 rounded-full overflow-hidden">
             {mediaPlaylist.map((item, idx) => (
               <div 
                  key={item.id} 
                  className={`flex-1 transition-colors duration-300 ${idx === currentIndex ? 'bg-indigo-500' : 'bg-white/10'}`} 
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
          <input type="file" className="hidden" multiple accept="image/*,video/*" onChange={handleFileUpload} />
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
                            className="w-16 h-10 bg-black rounded overflow-hidden cursor-pointer shrink-0 relative border border-white/5"
                            onClick={() => setCurrentIndex(index)}
                        >
                             {item.type === 'VIDEO' ? <video src={item.url} className="w-full h-full object-cover opacity-60" /> : <img src={item.url} className="w-full h-full object-cover" />}
                             {index === currentIndex && <div className="absolute inset-0 flex items-center justify-center bg-black/40"><Play size={12} className="text-white fill-white"/></div>}
                        </div>
                        
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <p className={`text-xs font-medium truncate ${index === currentIndex ? 'text-indigo-300' : 'text-zinc-300'}`}>{item.name}</p>
                            <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                                {item.type === 'VIDEO' ? <FileVideo size={10}/> : <FileImage size={10}/>}
                                {item.type}
                            </p>
                        </div>

                        {/* Controls */}
                        <div className="flex flex-col gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <div className="flex gap-1">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); if(index > 0) reorderMedia(index, index - 1); }}
                                    disabled={index === 0}
                                    className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white disabled:opacity-20 transition-colors"
                                    title="Mover para cima"
                                >
                                    <ArrowUp size={12} />
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); if(index < mediaPlaylist.length - 1) reorderMedia(index, index + 1); }}
                                    disabled={index === mediaPlaylist.length - 1}
                                    className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white disabled:opacity-20 transition-colors"
                                    title="Mover para baixo"
                                >
                                    <ArrowDown size={12} />
                                </button>
                             </div>
                             <button 
                                onClick={(e) => { e.stopPropagation(); removeMedia(item.id); }}
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