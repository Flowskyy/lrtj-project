"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { UnsavedChangesDialog } from "@/components/UnsavedChangesDialog";

interface UnsavedChangesState {
  hasUnsavedChanges: boolean;
  onDiscard?: () => void;
  description?: string;
}

interface UnsavedChangesContextType {
  registerUnsavedChanges: (state: UnsavedChangesState) => void;
  unregisterUnsavedChanges: () => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextType | undefined>(undefined);

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const [unsavedState, setUnsavedState] = useState<UnsavedChangesState | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  const registerUnsavedChanges = useCallback((state: UnsavedChangesState) => {
    setUnsavedState(state);
  }, []);

  const unregisterUnsavedChanges = useCallback(() => {
    setUnsavedState(null);
  }, []);

  // Handle beforeunload for browser close/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (unsavedState?.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [unsavedState?.hasUnsavedChanges]);

  // Global click handler to intercept navigation
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Check if the clicked element or its parent is a navigation link
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]');

      if (link && unsavedState?.hasUnsavedChanges) {
        const href = link.getAttribute('href');
        
        // Only intercept internal navigation (not external links)
        if (href && (href.startsWith('/') || href.startsWith('#'))) {
          e.preventDefault();
          e.stopPropagation();
          
          setPendingNavigation(() => () => {
            window.location.href = href;
          });
          setShowDialog(true);
        }
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [unsavedState?.hasUnsavedChanges]);

  const handleKeepEditing = useCallback(() => {
    setShowDialog(false);
    setPendingNavigation(null);
  }, []);

  const handleDiscard = useCallback(() => {
    setShowDialog(false);
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
    unsavedState?.onDiscard?.();
  }, [pendingNavigation, unsavedState]);

  return (
    <UnsavedChangesContext.Provider value={{ registerUnsavedChanges, unregisterUnsavedChanges }}>
      {children}
      {showDialog && (
        <UnsavedChangesDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          onKeepEditing={handleKeepEditing}
          onDiscard={handleDiscard}
          description={unsavedState?.description || "You have unsaved changes. These changes will be lost if you continue."}
          showIcon={true}
        />
      )}
    </UnsavedChangesContext.Provider>
  );
}

export function useUnsavedChanges() {
  const context = useContext(UnsavedChangesContext);
  if (!context) {
    // Return no-op implementation if not in provider (SSR or outside context)
    return {
      registerUnsavedChanges: () => {},
      unregisterUnsavedChanges: () => {},
    };
  }
  return context;
}
