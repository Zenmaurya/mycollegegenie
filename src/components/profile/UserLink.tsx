import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/** A name that links to /u/:username, or plain text when the user has no username yet. */
export function UserLink({ username, className = '', children }: { username?: string | null; className?: string; children: ReactNode }) {
  if (!username) return <span className={className}>{children}</span>;
  return (
    <Link to={`/u/${username}`} onClick={(e) => e.stopPropagation()} className={`hover:underline focus-visible:outline-2 focus-visible:outline-brand ${className}`}>
      {children}
    </Link>
  );
}
