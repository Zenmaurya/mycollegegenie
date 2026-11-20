import { useState } from 'react';
import { Heart, Share2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { IconButton } from '../components/ui/IconButton';
import { Chip } from '../components/ui/Chip';
import { Tabs } from '../components/ui/Tabs';
import { Segmented } from '../components/ui/Segmented';
import { Sheet } from '../components/ui/Sheet';
import { Menu } from '../components/ui/Menu';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';

// Dev-only component catalogue (route registered only when import.meta.env.DEV).
export function DevUiPage() {
  const [tab, setTab] = useState('top');
  const [seg, setSeg] = useState('new');
  const [chip, setChip] = useState(true);
  const [sheet, setSheet] = useState(false);
  const variants = ['primary', 'secondary', 'ghost', 'danger'] as const;
  const sizes = ['sm', 'md', 'lg'] as const;

  return (
    <div className="mx-auto max-w-3xl space-y-8 bg-surface p-4">
      <h1 className="text-2xl font-bold text-ink">Genie UI</h1>

      <section className="space-y-3">
        <h2 className="font-semibold">Button</h2>
        {variants.map((v) => (
          <div key={v} className="flex flex-wrap items-center gap-2">
            {sizes.map((s) => <Button key={s} variant={v} size={s}>{v} {s}</Button>)}
            <Button variant={v} loading>Loading</Button>
            <Button variant={v} disabled>Disabled</Button>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">IconButton and Menu</h2>
        <div className="flex items-center gap-2">
          <IconButton label="Like" icon={Heart} />
          <IconButton label="Share" icon={Share2} />
          <Menu label="More actions" items={[{ label: 'Save', onSelect: () => {} }, { label: 'Report', onSelect: () => {} }, { label: 'Delete', onSelect: () => {}, danger: true }]} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Chip</h2>
        <div className="flex flex-wrap gap-2">
          <Chip selected={chip} onToggle={() => setChip((c) => !c)}>Toggle me</Chip>
          <Chip onToggle={() => {}}>Unselected</Chip>
          <Chip selected removable onRemove={() => {}}>Removable</Chip>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Tabs and Segmented</h2>
        <Tabs items={[{ id: 'top', label: 'Top' }, { id: 'new', label: 'New' }, { id: 'following', label: 'Following' }]} value={tab} onChange={setTab} />
        <Segmented options={[{ value: 'new', label: 'New' }, { value: 'hot', label: 'Hot' }, { value: 'top', label: 'Top' }]} value={seg} onChange={setSeg} />
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Avatar and Badge</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Avatar name="Asha Rao" size="sm" />
          <Avatar name="Ravi Kumar" />
          <Avatar name="Meera Iyer" size="lg" verified />
          <Badge tone="brand">Brand</Badge>
          <Badge tone="success">Success</Badge>
          <Badge tone="neutral">Neutral</Badge>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Sheet</h2>
        <Button variant="secondary" onClick={() => setSheet(true)}>Open sheet</Button>
        <Sheet open={sheet} onClose={() => setSheet(false)} title="Example sheet">
          <div className="space-y-3 p-4">
            <p className="text-ink-muted">Modal on desktop, bottom sheet on mobile. Esc closes it.</p>
            <input aria-label="Example field" className="w-full rounded-sm border border-line px-3 py-2" />
            <Button onClick={() => setSheet(false)}>Done</Button>
          </div>
        </Sheet>
      </section>

      <section>
        <h2 className="font-semibold">EmptyState</h2>
        <EmptyState title="Nothing here yet" body="Posts you save will show up here." action={<Button>Explore posts</Button>} />
      </section>
    </div>
  );
}
