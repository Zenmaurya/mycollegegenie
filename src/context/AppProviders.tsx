import React from 'react';
import { AuthProvider } from './AuthContext';
import { ResourceProvider } from './ResourceContext';

/**
 * AppProviders — wraps the entire app in all context providers.
 * Order matters: ResourceProvider depends on AuthProvider.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ResourceProvider>
        {children}
      </ResourceProvider>
    </AuthProvider>
  );
}
