import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Download, ExternalLink, Flag, Heart, Share2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { formatHelpedPct, previewKind } from '../../lib/notes';
import { NotesService, type RatingResult } from '../../services/notesService';
import type { Resource } from '../../types';
import { Button } from '../ui/button';
import { ReportSheet } from '../communities/ReportSheet';

interface Props {
  note: Resource;
  saved: boolean;
  onToggleSave: (id: string) => void;
  onRated: (r: RatingResult) => void;
}

export function NoteActions({ note, saved, onToggleSave, onRated }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [stars, setStars] = useState(0);
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [reporting, setReporting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const toLogin = () => navigate('/login', { state: { from: { pathname: location.pathname + location.search } } });
  const needLogin = (fn: () => void) => () => (user ? fn() : toLogin());
  const helped = formatHelpedPct(note.helpfulYes ?? 0, note.helpfulNo ?? 0);
  const external = ['youtube', 'other'].includes(previewKind(note.link).kind);

  const submit = async (nextStars: number, nextHelpful: boolean | null) => {
    const prev = { stars, helpful };
    setStars(nextStars); setHelpful(nextHelpful); // optimistic
    try {
      onRated(await NotesService.rate(note.id, nextStars, nextHelpful === null ? undefined : nextHelpful));
    } catch {
      setStars(prev.stars); setHelpful(prev.helpful);
      toast.error('Could not save your rating');
    }
  };

  const download = async () => {
    setDownloading(true);
    try { window.location.assign(await NotesService.download(note.id)); }
    catch { toast.error('Download failed. Try again.'); }
    finally { setDownloading(false); }
  };

  const share = async () => {
    const url = `${window.location.origin}/notes/${note.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: note.title, url }); } catch { /* user cancelled */ }
      return;
    }
    try { await navigator.clipboard.writeText(url); toast.success('Link copied!'); } catch { /* clipboard blocked */ }
  };

  const openCls = 'inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-sm bg-brand px-4 text-[15px] font-semibold text-white hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-brand';

  return (
    <div className="space-y-4 rounded-card bg-surface p-4 shadow-card md:sticky md:top-20">
      <div className="flex gap-2">
        {external
          ? <a href={note.link} target="_blank" rel="noopener noreferrer" className={openCls}><ExternalLink className="h-5 w-5" aria-hidden /> Open</a>
          : <Link to={`/flipbook/${note.id}`} className={openCls}><ExternalLink className="h-5 w-5" aria-hidden /> Open</Link>}
        <Button variant="secondary" className="flex-1" onClick={needLogin(download)} disabled={downloading}>
          <Download className="h-5 w-5" aria-hidden /> Download
        </Button>
      </div>

      <div>
        <p id="rate-label" className="text-[13px] font-semibold text-ink">Rate this resource</p>
        <div role="group" aria-labelledby="rate-label" className="flex">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              aria-pressed={stars === n}
              onClick={needLogin(() => void submit(n, helpful))}
              className="flex h-11 w-11 items-center justify-center focus-visible:outline-2 focus-visible:outline-brand"
            >
              <Star className={`h-6 w-6 ${n <= stars ? 'fill-highlight text-highlight' : 'text-ink-muted'}`} aria-hidden />
            </button>
          ))}
        </div>
        {helped && <p className="text-[13px] text-ink-muted">{helped}</p>}
      </div>

      <div>
        <p className="text-[13px] font-semibold text-ink">Did this help you understand?</p>
        <div className="flex gap-2 pt-1">
          {([true, false] as const).map((v) => (
            <Button
              key={String(v)}
              variant={helpful === v ? 'primary' : 'secondary'}
              aria-pressed={helpful === v}
              onClick={needLogin(() => { if (stars) void submit(stars, v); else toast('Pick a star rating first'); })}
            >
              {v ? 'Yes' : 'No'}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-line pt-3">
        <Button variant="ghost" onClick={() => onToggleSave(note.id)} aria-pressed={saved}>
          <Heart className={`h-5 w-5 ${saved ? 'fill-brand text-brand' : ''}`} aria-hidden /> {saved ? 'Saved' : 'Save'}
        </Button>
        <Button variant="ghost" onClick={share}><Share2 className="h-5 w-5" aria-hidden /> Share</Button>
        <Button variant="ghost" onClick={needLogin(() => setReporting(true))}><Flag className="h-5 w-5" aria-hidden /> Report</Button>
      </div>
      {reporting && <ReportSheet open onClose={() => setReporting(false)} itemType="resource" itemId={note.id} title="Report resource" />}
    </div>
  );
}
