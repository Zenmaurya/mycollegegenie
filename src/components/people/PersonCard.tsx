import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { RelationButtons } from './RelationButtons';
import { courseShort } from '../../lib/notes';
import { relationLabel, type Person } from '../../lib/people';

export function PersonCard({ person }: { person: Person }) {
  const { user } = useAuth();
  const details = [person.collegeName, person.course && courseShort(person.course), person.batchYear && `Batch ${person.batchYear}`].filter(Boolean).join(' · ');
  const status = [relationLabel(person.relation), person.mutualCount ? `${person.mutualCount} mutual` : ''].filter(Boolean).join(' · ');
  return (
    <div className="space-y-3 rounded-card bg-surface p-3 shadow-card">
      <Link to={`/u/${person.username}`} className="flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-brand">
        <Avatar src={person.photoUrl} name={person.displayName} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold text-ink">{person.displayName}</span>
          <span className="block truncate text-[13px] text-ink-muted">@{person.username}</span>
          {details && <span className="block truncate text-[13px] text-ink-muted">{details}</span>}
          {status && <span className="block truncate text-[13px] text-ink-muted">{status}</span>}
        </span>
      </Link>
      {person.id !== user?.id && <RelationButtons userId={person.id} relation={person.relation} compact />}
    </div>
  );
}
