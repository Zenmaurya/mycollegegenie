import { linkLabel, type CommunityDetail } from '../../lib/communities';

export function AboutTab({ detail: d }: { detail: CommunityDetail }) {
  const links = Object.values(d.links ?? {}).map((url) => ({ url, label: linkLabel(url) })).filter((l): l is { url: string; label: string } => !!l.label);
  const rows: [string, string | number | null][] = [['Founded', d.founded_year], ['Faculty advisor', d.faculty_advisor], ['Achievements', d.achievements]];
  const shown = rows.filter(([, v]) => v);
  return (
    <div className="space-y-4 rounded-card bg-surface p-4 shadow-card">
      <p className="whitespace-pre-line text-[15px] text-ink">{d.description || 'No description yet.'}</p>
      {shown.length > 0 && (
        <dl className="space-y-3">
          {shown.map(([k, v]) => <div key={k}><dt className="text-[13px] font-semibold text-ink-muted">{k}</dt><dd className="whitespace-pre-line text-[15px] text-ink">{v}</dd></div>)}
        </dl>
      )}
      {links.length > 0 && (
        <div>
          <h3 className="mb-1 text-[13px] font-semibold text-ink-muted">Links</h3>
          <ul className="flex flex-wrap gap-2">
            {links.map((l) => (
              <li key={l.url}>
                <a href={l.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-[14px] font-semibold text-ink hover:bg-canvas focus-visible:outline-2 focus-visible:outline-brand">{l.label}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
