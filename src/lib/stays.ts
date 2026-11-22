/**
 * Pure helpers for /stays (no network/env imports so they run in node:test).
 */
export const STAY_REPORT_REASONS = ['Fake listing', 'Wrong price', 'Broker spam', 'Unsafe', 'Other'] as const;

export type StayType = 'pg' | 'room' | 'flat';
export type Gender = 'girls' | 'boys' | 'coed';
export type Sharing = 'single' | 'double' | 'triple';
export type ListerType = 'owner' | 'student' | 'broker';
export type Badge = 'great' | 'fair' | 'above';

export const TYPE_LABEL: Record<StayType, string> = { pg: 'PG', room: 'Room', flat: 'Flat' };
export const GENDER_LABEL: Record<Gender, string> = { girls: 'Girls', boys: 'Boys', coed: 'Co-ed' };
export const SHARING_LABEL: Record<Sharing, string> = { single: 'Single', double: 'Double', triple: 'Triple+' };
export const LISTER_LABEL: Record<ListerType, string> = { owner: 'Owner', student: 'Student', broker: 'Broker' };

export interface Room { sharing: Sharing; rent: number; ac: boolean }
export interface Insight { count: number; low: number | null; median: number | null; high: number | null }
export interface Stay {
  id: string; listerId: string; listerType: ListerType; type: StayType; title: string; collegeId: string | null; collegeName: string;
  area: string; genderFor: Gender; rooms: Room[]; deposit: number | null; meals: boolean; amenities: string[];
  rules: Record<string, unknown>; photos: string[]; description: string; availableFrom: string; createdAt: string;
  minRent: number | null; badge: Badge | null;
  /** Detail only. phone is '' unless the API sent it (opted in + logged in). */
  phone: string; insight: Insight | null; lister: { displayName: string; listerType: ListerType } | null;
}

export const cheapestRoom = (rooms: Room[]): Room | null => rooms.reduce<Room | null>((a, r) => (!a || r.rent < a.rent ? r : a), null);

/** Raw snake_case API row to Stay. */
export function mapStay(raw: any): Stay {
  const rooms: Room[] = (Array.isArray(raw.rooms) ? raw.rooms : []).map((r: any) => ({ sharing: r.sharing, rent: Number(r.rent), ac: !!r.ac }));
  return {
    id: raw.id,
    listerId: raw.lister_id || '',
    listerType: raw.lister_type,
    type: raw.type,
    title: raw.title || '',
    collegeId: raw.college_id ?? null,
    collegeName: raw.college_name || '',
    area: raw.area || '',
    genderFor: raw.gender_for,
    rooms,
    deposit: raw.deposit == null ? null : Number(raw.deposit),
    meals: Boolean(raw.meals),
    amenities: Array.isArray(raw.amenities) ? raw.amenities : [],
    rules: raw.rules && typeof raw.rules === 'object' ? raw.rules : {},
    photos: Array.isArray(raw.photos) ? raw.photos : [],
    description: raw.description || '',
    availableFrom: raw.available_from ? String(raw.available_from).slice(0, 10) : '',
    createdAt: raw.created_at || '',
    minRent: raw.min_rent == null ? cheapestRoom(rooms)?.rent ?? null : Number(raw.min_rent),
    badge: raw.badge === 'great' || raw.badge === 'fair' || raw.badge === 'above' ? raw.badge : null,
    phone: raw.phone || '',
    insight: raw.insight ? { count: Number(raw.insight.count) || 0, low: raw.insight.low ?? null, median: raw.insight.median ?? null, high: raw.insight.high ?? null } : null,
    lister: raw.lister ? { displayName: raw.lister.display_name || '', listerType: raw.lister.lister_type } : null,
  };
}

export function badgeLabel(b: Badge | null | undefined): 'Great deal' | 'Fair price' | 'Above average' | null {
  return b === 'great' ? 'Great deal' : b === 'fair' ? 'Fair price' : b === 'above' ? 'Above average' : null;
}

export const formatRent = (n: number): string => `₹${n.toLocaleString('en-IN')}`;

/** null under 5 reports (the API also nulls the numbers then). */
export function insightLine(insight: Insight | null | undefined, placeName: string, sharing: Sharing): string | null {
  if (!insight || insight.count < 5 || insight.low == null || insight.high == null) return null;
  return `Students near ${placeName} pay ${formatRent(insight.low)}–${formatRent(insight.high)} for ${sharing} sharing (${insight.count} reports)`;
}
