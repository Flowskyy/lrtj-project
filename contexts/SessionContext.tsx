"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useSession } from "@/lib/auth-client"

interface SessionContextType {
  session: any
  isPending: boolean
}

const SessionContext = createContext<SessionContextType>({
  session: null,
  isPending: true,
})

export function SessionProvider({ 
  children, 
  initialSession 
}: { 
  children: React.ReactNode
  initialSession: any 
}) {
  const { data: hookSession, isPending: hookIsPending } = useSession()
  
  // Use initial session for immediate display, then update with hook data
  const [hydratedSession, setHydratedSession] = useState(initialSession)
  
  // Update hydrated session when hook returns data
  useEffect(() => {
    if (hookSession && !hookIsPending) {
      setHydratedSession(hookSession)
    }
  }, [hookSession, hookIsPending])
  
  // Use hydrated session for display
  const displaySession = hydratedSession || hookSession
  
  return (
    <SessionContext.Provider value={{ session: displaySession, isPending: hookIsPending }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSessionContext() {
  return useContext(SessionContext)
}
