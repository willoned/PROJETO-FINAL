/**
 * LEGACY CONTEXT FACADE
 * This file re-exports logic from LayoutContext and DataContext.
 * It ensures existing components don't break immediately, but they should be migrated.
 */
import React from 'react';
import { useLayoutContext } from './LayoutContext';
import { useDataContext } from './DataContext';

// Combine both hooks into one for legacy components
export const useMachineContext = () => {
    const layout = useLayoutContext();
    const data = useDataContext();

    return {
        ...layout,
        ...data,
        // Legacy Shim
        updateLineConfig: (id: string, target: number) => console.warn("Deprecated updateLineConfig called")
    };
};

// Re-export Provider not needed here as App.tsx handles providers
export const MachineProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
    return <>{children}</>;
}