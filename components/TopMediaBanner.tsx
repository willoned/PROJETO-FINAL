import React, { useState, useRef, useCallback } from 'react';
import { useLayoutContext } from '../context/LayoutContext';
import MediaPanel from './MediaPanel';

const TopMediaBanner = () => {
    const { layout, updateLayout } = useLayoutContext();
    const [isResizing, setIsResizing] = useState(false);
    const startY = useRef(0);
    const startH = useRef(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsResizing(true);
        startY.current = e.clientY;
        startH.current = layout.header?.topMediaHeight || 200;
        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';
        
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        // Performance optimization: 
        // We use functional update in updateLayout or implicit merge to avoid adding 'layout' to dependency array.
        // This prevents the event listener from being removed/added on every pixel change (jitter).
        requestAnimationFrame(() => {
            const deltaY = e.clientY - startY.current;
            const newHeight = Math.max(100, Math.min(600, startH.current + deltaY));
            
            // We pass a partial object. The reducer handles the merge with existing header state.
            updateLayout({ 
                header: { 
                    // We need to satisfy the type system or rely on the reducer's merge logic
                    // Since we don't have the full header state here inside the callback without dependency,
                    // we assume the reducer merges 'header' properties shallowly.
                    // Based on LayoutContext reducer: if(action.payload.header) newLayout.header = { ...state.layout.header, ...action.payload.header };
                    // So passing just the changed property is safe and correct.
                    topMediaHeight: newHeight 
                } as any 
            });
        });
    }, [updateLayout]);

    const handleMouseUp = useCallback(() => {
        setIsResizing(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove]);

    if (!layout.header?.showTopMedia) return null;

    const borderWidth = layout.header.topMediaBorderWidth ?? 1;

    return (
        <div 
            style={{ 
                height: layout.header.topMediaHeight,
                borderTopWidth: borderWidth,
                borderBottomWidth: borderWidth
            }} 
            className="w-full relative shrink-0 border-brewery-border bg-black group"
        >
            <MediaPanel playlistKey="banner" />
            
            {/* Resize Handle */}
            <div 
                className="absolute bottom-0 left-0 right-0 h-3 cursor-row-resize bg-black/50 hover:bg-brewery-accent/50 flex items-center justify-center z-50 transition-colors opacity-0 group-hover:opacity-100"
                onMouseDown={handleMouseDown}
            >
                 <div className="w-16 h-1 bg-white/30 rounded-full" />
            </div>
        </div>
    );
};

export default TopMediaBanner;