"use client";

import { createContext, useContext } from "react";

type AdminContextValue = {
  sessionId: string;
  adminToken: string;
};

const AdminContext = createContext<AdminContextValue | null>(null);

export const AdminContextProvider = AdminContext.Provider;

export const useAdminContext = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdminContext precisa ser usado dentro de AdminContextProvider.");
  }
  return context;
};
