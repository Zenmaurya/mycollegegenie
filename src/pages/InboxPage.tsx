import React, { useState } from 'react';
import { Tabs } from '../components/ui/Tabs';
import { EmptyState } from '../components/ui/EmptyState';

const ITEMS = [{ id: 'notifications', label: 'Notifications' }, { id: 'chats', label: 'Chats' }];
const BODY: Record<string, string> = {
  notifications: 'Replies, votes and updates will show up here.',
  chats: 'Direct messages with other students will show up here.',
};

export function InboxPage() {
  const [tab, setTab] = useState('notifications');
  return (
    <div className="px-4 py-5">
      <h1 className="mb-3 text-[22px] font-bold text-ink">Inbox</h1>
      <Tabs items={ITEMS} value={tab} onChange={setTab} label="Inbox" />
      <div role="tabpanel" aria-labelledby={`tab-${tab}`}>
        <EmptyState title="Coming soon" body={BODY[tab]} />
      </div>
    </div>
  );
}
