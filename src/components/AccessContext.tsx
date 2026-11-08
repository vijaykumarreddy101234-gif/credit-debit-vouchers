import React, { createContext, useContext } from 'react';
import { PermissionKey } from '../utils/accessControl';

type Ctx = { can: (p: PermissionKey) => boolean };
const AccessCtx = createContext<Ctx>({ can: () => true });

export const AccessProvider: React.FC<{ can: (p: PermissionKey) => boolean; children: React.ReactNode }> = ({ can, children }) => (
  <AccessCtx.Provider value={{ can }}>{children}</AccessCtx.Provider>
);

export const useAccess = () => useContext(AccessCtx);
