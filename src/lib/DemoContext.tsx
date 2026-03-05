"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { DemoUser, getDemoUser, demoSignIn, demoSignOut } from "./demoAuth";

interface DemoContextType {
  user: DemoUser | null;
  loading: boolean;
  login: (user: DemoUser) => void;
  logout: () => void;
}

const DemoContext = createContext<DemoContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export function DemoProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getDemoUser());
    setLoading(false);
  }, []);

  const login = (u: DemoUser) => {
    demoSignIn(u);
    setUser(u);
  };

  const logout = () => {
    demoSignOut();
    setUser(null);
  };

  return (
    <DemoContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  return useContext(DemoContext);
}
