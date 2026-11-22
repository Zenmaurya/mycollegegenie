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
  id: string; listerId: string; listerUsername: string | null; listerType: ListerType; type: StayType; title: string; collegeId: string | null; collegeName: string;
  area: string; genderFor: Gender; rooms: Room[]; deposit: number | null; meals: boolean; amenities: string[];
  rules: Record<string, unknown>; photos: string[]; description: string; availableFrom: string; createdAt: string;
  minRent: number | null; badge: Badge | null; isApproved: boolean; isHidden: boolean;
  /** ISO timestamp; the admin approve call echoes it so a stay edited after review is not approved by mistake. */
  updatedAt: string;
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
    listerUsername: raw.lister_username ?? null,
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
    updatedAt: raw.updated_at || '',
    minRent: raw.min_rent == null ? cheapestRoom(rooms)?.rent ?? null : Number(raw.min_rent),
    isApproved: Boolean(raw.is_approved),
    isHidden: Boolean(raw.is_hidden),
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

export const stayStatus = (s: { isApproved: boolean; isHidden: boolean }): 'Hidden' | 'In review' | 'Live' => (s.isHidden ? 'Hidden' : s.isApproved ? 'Live' : 'In review');

export const AMENITIES = ['AC', 'Wi-Fi', 'Meals', 'Laundry', 'Power backup', 'CCTV', 'Warden', 'Attached washroom'] as const;
export const MAX_PHOTOS = 10;

/** The "List your place" form state. Strings stay strings until draftToPayload. */
export interface StayDraft {
  listerType: ListerType | ''; type: StayType | ''; title: string; collegeId: string; collegeName: string; area: string; genderFor: Gender | '';
  rooms: Room[]; deposit: string; meals: boolean; availableFrom: string; amenities: string[];
  curfew: string; guestsAllowed: boolean; nonVeg: boolean; photos: string[]; description: string; phone: string;
}

export const emptyDraft = (): StayDraft => ({
  listerType: '', type: '', title: '', collegeId: '', collegeName: '', area: '', genderFor: '', rooms: [], deposit: '', meals: false, availableFrom: '',
  amenities: [], curfew: '', guestsAllowed: true, nonVeg: true, photos: [], description: '', phone: '',
});

const isRent = (n: number) => Number.isInteger(n) && n >= 1000 && n <= 60000;
const PHOTO_URL = /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//;

/** One check per wizard step (Preview has none). Mirrors backend validateStay (utils/stays.js), plus the phone-only contact ruling. */
const STEP_CHECKS: ((d: StayDraft) => string | null)[] = [
  (d) => (['owner', 'student', 'broker'].includes(d.listerType) ? null : 'Pick who you are'),
  (d) => (!['pg', 'room', 'flat'].includes(d.type) ? 'Pick the type of place'
    : d.title.trim().length < 5 || d.title.trim().length > 120 ? 'Title must be 5-120 characters'
    : d.area.trim().length < 2 || d.area.trim().length > 120 ? 'Area must be 2-120 characters'
    : !['girls', 'boys', 'coed'].includes(d.genderFor) ? 'Pick who it is for' : null),
  (d) => {
    if (d.rooms.length < 1 || d.rooms.length > 4) return 'Add 1-4 room options';
    if (!d.rooms.every((r) => ['single', 'double', 'triple'].includes(r.sharing) && isRent(r.rent))) return 'Rent must be a whole number between 1000 and 60000';
    if (d.deposit.trim() && !(/^\d+$/.test(d.deposit.trim()) && Number(d.deposit) <= 500000)) return 'Invalid deposit';
    return d.availableFrom && Number.isNaN(Date.parse(d.availableFrom)) ? 'Invalid available date' : null;
  },
  (d) => (d.description.trim().length > 2000 ? 'Description too long (max 2000)' : null),
  (d) => (d.photos.length < 3 || d.photos.length > MAX_PHOTOS ? 'Add 3-10 photos' : d.photos.every((p) => PHOTO_URL.test(p)) ? null : 'Invalid photo URL'),
  (d) => (/^[6-9]\d{9}$/.test(d.phone) ? null : 'Enter a valid 10-digit mobile number'),
];

export const WIZARD_STEPS = ['Who are you', 'Place', 'Rooms & rent', 'Amenities & rules', 'Photos', 'Contact', 'Preview & publish'] as const;
export const stepProblem = (d: StayDraft, step: number): string | null => STEP_CHECKS[step]?.(d) ?? null;
export function stayProblem(d: StayDraft): string | null {
  for (let i = 0; i < STEP_CHECKS.length; i++) { const p = stepProblem(d, i); if (p) return p; }
  return null;
}

/** Snake_case body for POST/PATCH /api/stays. Phone is required and always shown to logged-in students (no chat UI yet). */
export function draftToPayload(d: StayDraft) {
  return {
    type: d.type, lister_type: d.listerType, title: d.title.trim(), area: d.area.trim(), gender_for: d.genderFor,
    college_id: d.collegeId || null, rooms: d.rooms.map((r) => ({ sharing: r.sharing, rent: r.rent, ac: r.ac })),
    deposit: d.deposit.trim() ? Number(d.deposit) : null, meals: d.meals, amenities: d.amenities,
    rules: { ...(d.curfew ? { curfew: d.curfew } : {}), guests_allowed: d.guestsAllowed, non_veg: d.nonVeg },
    photos: d.photos, description: d.description.trim() || null, phone: d.phone, phone_visible: true, available_from: d.availableFrom || null,
  };
}

export const stayToDraft = (s: Stay): StayDraft => ({
  listerType: s.listerType, type: s.type, title: s.title, collegeId: s.collegeId ?? '', collegeName: s.collegeName, area: s.area, genderFor: s.genderFor,
  rooms: s.rooms, deposit: s.deposit == null ? '' : String(s.deposit), meals: s.meals, availableFrom: s.availableFrom, amenities: s.amenities,
  curfew: typeof s.rules.curfew === 'string' ? s.rules.curfew : '', guestsAllowed: s.rules.guests_allowed !== false, nonVeg: s.rules.non_veg !== false,
  photos: s.photos, description: s.description, phone: s.phone,
});
