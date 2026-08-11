"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

type ActionState = 'reading' | 'creating' | 'editing' | null;

interface ActionContextType {
  currentAction: ActionState;
  actionEntity: string | null;
  setAction: (action: ActionState, entity?: string | null) => void;
  clearAction: () => void;
}

const ActionContext = createContext<ActionContextType | undefined>(undefined);

export function ActionProvider({ children }: { children: ReactNode }) {
  const [currentAction, setCurrentAction] = useState<ActionState>('reading');
  const [actionEntity, setActionEntity] = useState<string | null>(null);

  const setAction = (action: ActionState, entity: string | null = null) => {
    setCurrentAction(action);
    setActionEntity(entity);
  };

  const clearAction = () => {
    setCurrentAction('reading');
    setActionEntity(null);
  };

  return (
    <ActionContext.Provider value={{ currentAction, actionEntity, setAction, clearAction }}>
      {children}
    </ActionContext.Provider>
  );
}

export function useAction() {
  const context = useContext(ActionContext);
  if (context === undefined) {
    throw new Error('useAction must be used within an ActionProvider');
  }
  return context;
}
