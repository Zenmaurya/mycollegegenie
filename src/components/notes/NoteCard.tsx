import { memo, useState, type ComponentType } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, ClipboardList, FileText, Heart, ListChecks, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { courseLabel, formatHelpedPct, yearFromTitle } from '../../lib/notes';
import type { Resource, ResourceType } from '../../types';
import { Badge } from '../ui/Badge';
import { Menu } from '../ui/Menu';
import { ReportSheet } from '../communities/ReportSheet';
import { UserLink } from '../profile/UserLink';

const TILE: Record<ResourceType, { Icon: ComponentType<{ className?: string }>; tint: string; label: string }> = {
  Note: { Icon: FileText, tint: 'bg-brand-soft text-brand', label: 'Note' },
  PYQ: { Icon: ClipboardList, tint: 'bg-highlight/15 text-highlight', label: 'PYQ' },
  Book: { Icon: BookOpen, tint: 'bg-success/10 text-success', label: 'Book' },
  Playlist: { Icon: PlayCircle, tint: 'bg-warning/15 text-warning', label: 'Playlist' },
  Syllabus: { Icon: ListChecks, tint: 'bg-canvas text-ink-muted', label: 'Syllabus' },
};

interface Props { note: Resource; saved: boolean; onToggleSave: (id: string) => void }

function NoteCardImpl({ note, saved, onToggleSave }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [reporting, setReporting] = useState(false);
  const { Icon, tint, label } = TILE[note.type] ?? TILE.Note;
  const url = `/notes/${note.id}`;
  const year = note.year ?? (note.type === 'PYQ' ? yearFromTitle(note.title) : null);
  const official = note.type === 'Syllabus' && (note.uploaderRole === 'admin' || note.uploaderRole === 'moderator');
  const helped = formatHelpedPct(note.helpfulYes ?? 0, note.helpfulNo ?? 0);

  const sub = [note.subjectCode, note.course && courseLabel(note.course), note.semester ? `Sem ${note.semester}` : ''].filter(Boolean).join(' · ');
  const stats = [
    note.ratingAvg != null ? `★ ${note.ratingAvg.toFixed(1)}` : '',
    note.downloads ? `Helped ${note.downloads}` : '',
    note.pageCount ? `${note.pageCount} pages` : '',
  ].filter(Boolean).join(' · ');

  const share = async () => {
    const link = `${window.location.origin}${url}`;
    if (navigator.share) {
      try { await navigator.share({ title: note.title, url: link }); } catch { /* user cancelled */ }
      return;
    }
    try { await navigator.clipboard.writeText(link); toast.success('Link copied!'); } catch { /* clipboard blocked */ }
  };
  const toLogin = () => navigate('/login', { state: { from: { pathname: location.pathname + location.search } } });

  return (
    <article className="relative flex h-full flex-col rounded-card bg-surface shadow-card transition-shadow hover:shadow-float">
      <div className={`relative aspect-[4/3] overflow-hidden rounded-t-card ${tint}`}>
        {note.thumbnailUrl
          ? <img src={note.thumbnailUrl} alt="" loading="lazy" className="h-full w-full bg-white object-cover object-top" />
          : <span className="flex h-full w-full items-center justify-center"><Icon className="h-14 w-14 opacity-70" /></span>}
        <span className="absolute left-2 top-2"><Badge tone="neutral">{label}{note.type === 'PYQ' && year ? ` ${year}` : ''}</Badge></span>
      </div>
      <button
        type="button"
        onClick={() => onToggleSave(note.id)}
        aria-pressed={saved}
        aria-label={saved ? 'Remove from saved' : 'Save'}
        className="absolute right-1 top-1 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-surface/90 text-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand"
      >
        <Heart className={`h-5 w-5 ${saved ? 'fill-brand text-brand' : ''}`} aria-hidden />
      </button>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-ink">
          <Link to={url} className="after:absolute after:inset-0 hover:underline focus-visible:outline-2 focus-visible:outline-brand">{note.title}</Link>
        </h3>
        {sub && <p className="truncate text-[13px] text-ink-muted">{sub}</p>}
        {stats && <p className="text-[13px] text-ink-muted" title={helped ?? undefined}>{stats}</p>}
        <div className="mt-auto flex items-center justify-between gap-1 pt-1">
          <p className="min-w-0 truncate text-[13px] text-ink-muted">
            <UserLink username={note.uploaderUsername} className="relative z-10">{note.uploader || 'Student'}</UserLink>{note.uploaderCollege ? ` · ${note.uploaderCollege}` : ''}
          </p>
          <span className="relative z-10 -mr-2 shrink-0">
            <Menu label="More actions" items={[
              { label: saved ? 'Unsave' : 'Save', onSelect: () => onToggleSave(note.id) },
              { label: 'Share', onSelect: share },
              { label: 'Report', danger: true, onSelect: () => (user ? setReporting(true) : toLogin()) },
            ]} />
          </span>
        </div>
        {(note.uploaderVerified || official || note.stream) && (
          <div className="flex flex-wrap gap-1">
            {note.stream && <Badge tone="neutral">{note.stream} only</Badge>}
            {note.uploaderVerified && <Badge tone="success">Verified uploader</Badge>}
            {official && <Badge tone="brand">Official syllabus</Badge>}
          </div>
        )}
      </div>
      {reporting && <ReportSheet open onClose={() => setReporting(false)} itemType="resource" itemId={note.id} title="Report resource" />}
    </article>
  );
}

export const NoteCard = memo(NoteCardImpl);
