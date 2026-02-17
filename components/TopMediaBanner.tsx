import React, { useState, useRef, useCallback } from 'react';
import { useMachineContext } from '../context/MachineContext';
import { useAuth } from '../context/AuthContext';
import MediaPanel from './MediaPanel';

const TopMediaBanner = () => {
    const { layout, updateLayout, isEditing } = useMachineContext();
    const { isAuthenticated } = useAuth();
    
    // Resize Logic
    const [isResizing, setIsResizing] = useState(false);
    const startY = useRef(0);
    const startH = useRef(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!isEditing || !isAuthenticated) return;
        
        setIsResizing(true);
        startY.current = e.clientY;
        startH.current = layout.header?.topMediaHeight || 200;
        
        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';
        
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        requestAnimationFrame(() => {
            const deltaY = e.clientY - startY.current;
            const newHeight = Math.max(100, Math.min(600, startH.current + deltaY));
            
            updateLayout({ 
                header: { 
                    ...layout.header,
                    topMediaHeight: newHeight 
                }
            });
        });
    }, [updateLayout, layout.header]);

    const handleMouseUp = useCallback(() => {
        setIsResizing(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove]);

    if (!layout.header.showTopMedia) return null;

    const borderWidth = layout.header.topMediaBorderWidth ?? 1;

    return (
        <div 
            style={{ 
                height: layout.header.topMediaHeight,
                borderBottomWidth: borderWidth,
                borderColor: '#452c20' // brewery-border
            }} 
            className="w-full relative shrink-0 bg-black group z-50 shadow-xl"
        >
            <MediaPanel playlistKey="banner" />
            
            {/* Resize Handle - Only visible in Edit Mode */}
            {isEditing && isAuthenticated && (
                <div 
                    className="absolute bottom-0 left-0 right-0 h-4 cursor-row-resize bg-brewery-accent/20 hover:bg-brewery-accent flex items-center justify-center z-50 transition-colors opacity-0 group-hover:opacity-100"
                    onMouseDown={handleMouseDown}
                    title="Arraste para ajustar a altura"
                >
                     <div className="w-16 h-1 bg-white/50 rounded-full" />
                </div>
            )}
        </div>
    );
};

export default TopMediaBanner;