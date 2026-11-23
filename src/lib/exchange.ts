/**
 * Pure helpers for /exchange (no network/env imports so they run in node:test).
 */
export const EXCHANGE_REPORT_REASONS = ['Scam', 'Fake item', 'Wrong price', 'Prohibited item', 'Spam', 'Other'] as const;

export const EXCHANGE_CATEGORIES = ['Books', 'Notes & stationery', 'Electronics', 'Laptops & tablets', 'Phones', 'Cycles & scooters', 'Furniture', 'Hostel essentials', 'Lab coats & instruments', 'Fashion', 'Event tickets', 'Other'] as const;

export type ExchangeType = 'Sell' | 'Rent' | 'Donate' | 'Exchange';
export type ExchangeStatus = 'active' | 'reserved' | 'sold';
export type ExchangeBadge = 'price_drop' | 'just_listed' | null;

/** URL value (also accepted by the API) and chip label for each type. */
export const TYPE_CHIPS: { v: string; l: string }[] = [
  { v: 'sell', l: 'Buy' }, { v: 'rent', l: 'Rent' }, { v: 'free', l: 'Free' }, { v: 'exchange', l: 'Exchange' },
];
export const SORT_CHOICES: { v: string; l: string }[] = [
  { v: '', l: 'Newest' }, { v: 'price_asc', l: 'Price low to high' }, { v: 'price_desc', l: 'Price high to low' },
];
export const CONDITION_LABEL: Record<string, string> = { new: 'New', like_new: 'Like new', good: 'Good', fair: 'Fair' };
const PERIOD: Record<string, string> = { month: 'mo', week: 'wk', day: 'day' };

export interface Listing {
  id: string; title: string; price: number; originalPrice: number | null; lastPrice: number | null;
  type: ExchangeType; category: string; condition: string; rentPeriod: string | null; exchangeFor: string;
  college: string; collegeId: string | null; area: string; photos: string[]; status: ExchangeStatus;
  createdAt: string; sellerName: string; sellerAvatar: string | null; isMine: boolean; badge: ExchangeBadge;
  /** Detail only */
  description: string; details: Record<string, unknown>; views: number; isHidden: boolean; hiddenReason: string | null;
  sellerUsername: string | null; sellerCollege: string; phone: string; instagram: string;
}

/** Raw snake_case API row (list card or detail) to Listing. */
export function mapItem(raw: any): Listing {
  const photos: string[] = Array.isArray(raw.photos) && raw.photos.length ? raw.photos : raw.image_url ? [raw.image_url] : [];
  return {
    id: String(raw.id),
    title: raw.title || '',
    price: Number(raw.price) || 0,
    originalPrice: raw.original_price == null ? null : Number(raw.original_price),
    lastPrice: raw.last_price == null ? null : Number(raw.last_price),
    type: raw.type,
    category: raw.category || '',
    condition: raw.item_condition || '',
    rentPeriod: raw.rent_period ?? null,
    exchangeFor: raw.exchange_for || '',
    college: raw.college || '',
    collegeId: raw.college_id ?? null,
    area: raw.area || '',
    photos,
    status: raw.status === 'reserved' || raw.status === 'sold' ? raw.status : 'active',
    createdAt: raw.created_at || '',
    sellerName: raw.seller_name || '',
    sellerAvatar: raw.seller_avatar ?? null,
    isMine: Boolean(raw.is_mine),
    badge: raw.badge === 'price_drop' || raw.badge === 'just_listed' ? raw.badge : null,
    description: raw.description || '',
    details: raw.details && typeof raw.details === 'object' ? raw.details : {},
    views: Number(raw.views) || 0,
    isHidden: Boolean(raw.is_hidden),
    hiddenReason: raw.hidden_reason ?? null,
    sellerUsername: raw.seller_username ?? null,
    sellerCollege: raw.seller_college || '',
    phone: raw.contact_phone || '',
    instagram: raw.contact_instagram || '',
  };
}

export const formatPrice = (n: number): string => `₹${n.toLocaleString('en-IN')}`;

/** "₹4,000", "Free", "₹1,200/mo". Exchange items show "Exchange". */
export function priceLabel(i: Pick<Listing, 'type' | 'price' | 'rentPeriod'>): string {
  if (i.type === 'Exchange') return 'Exchange';
  if (i.type === 'Donate' || i.price === 0) return 'Free';
  const p = formatPrice(i.price);
  return i.type === 'Rent' && i.rentPeriod && PERIOD[i.rentPeriod] ? `${p}/${PERIOD[i.rentPeriod]}` : p;
}

export const typeLabel = (t: ExchangeType | string): string => (t === 'Donate' ? 'Free' : t);

/** Card badge text; Reserved wins over Price drop over Just listed. */
export function badgeLabel(i: Pick<Listing, 'badge' | 'status'>): string | null {
  if (i.status === 'reserved') return 'Reserved';
  if (i.badge === 'price_drop') return 'Price drop';
  if (i.badge === 'just_listed') return 'Just listed';
  return null;
}

// ---- Sell wizard ----
export const MAX_PHOTOS = 8;
export const MAX_PRICE = 500000;
export const WIZARD_STEPS = ['Photos', 'Details', 'Price', 'Pickup', 'Preview & publish'] as const;
export const CONDITIONS: { v: string; l: string }[] = Object.entries(CONDITION_LABEL).map(([v, l]) => ({ v, l }));
export const RENT_PERIODS: { v: string; l: string }[] = [{ v: 'month', l: 'Per month' }, { v: 'week', l: 'Per week' }, { v: 'day', l: 'Per day' }];
export const TYPE_CHOICES: { v: ExchangeType; l: string }[] = [{ v: 'Sell', l: 'Sell' }, { v: 'Rent', l: 'Rent' }, { v: 'Donate', l: 'Free' }, { v: 'Exchange', l: 'Exchange' }];

export interface ExchangeDraft {
  photos: string[]; title: string; category: string; condition: string; description: string;
  brand: string; yearBought: string; hasBill: boolean | null;
  type: ExchangeType; price: string; originalPrice: string; rentPeriod: string; exchangeFor: string;
  collegeId: string; collegeName: string; area: string; phone: string;
}

export const emptyDraft = (): ExchangeDraft => ({
  photos: [], title: '', category: '', condition: '', description: '', brand: '', yearBought: '', hasBill: null,
  type: 'Sell', price: '', originalPrice: '', rentPeriod: 'month', exchangeFor: '', collegeId: '', collegeName: '', area: '', phone: '',
});

const paid = (d: Pick<ExchangeDraft, 'type'>) => d.type === 'Sell' || d.type === 'Rent';
const validPrice = (s: string) => s.trim() !== '' && Number.isFinite(Number(s)) && Number(s) >= 0 && Number(s) <= MAX_PRICE;

const STEP_CHECKS: ((d: ExchangeDraft) => string | null)[] = [
  (d) => (d.photos.length < 1 ? 'Add at least 1 photo.' : null),
  (d) => {
    const t = d.title.trim().length;
    if (t < 5 || t > 120) return 'Title must be 5 to 120 characters.';
    if (!(EXCHANGE_CATEGORIES as readonly string[]).includes(d.category)) return 'Pick a category.';
    if (!CONDITION_LABEL[d.condition]) return 'Pick the condition.';
    if (d.description.trim().length > 2000) return 'Description is too long (max 2000).';
    if (d.yearBought.trim() && !/^(19|20)\d{2}$/.test(d.yearBought.trim())) return 'Enter a valid year bought.';
    return null;
  },
  (d) => {
    if (paid(d) && !(validPrice(d.price) && Number(d.price) > 0)) return `Price must be between ₹1 and ₹${MAX_PRICE.toLocaleString('en-IN')}.`;
    if (paid(d) && d.originalPrice.trim() && !validPrice(d.originalPrice)) return 'Original price is not valid.';
    if (d.type === 'Rent' && !RENT_PERIODS.some((p) => p.v === d.rentPeriod)) return 'Pick a rent period.';
    if (d.type === 'Exchange' && !d.exchangeFor.trim()) return 'Say what you would take in exchange.';
    return null;
  },
  (d) => (d.area.trim().length > 120 ? 'Area is too long (max 120).' : d.phone && !/^[6-9]\d{9}$/.test(d.phone) ? 'Enter a valid 10-digit mobile number.' : null),
  () => null,
];
export const stepProblem = (d: ExchangeDraft, step: number): string | null => STEP_CHECKS[step]?.(d) ?? null;
export function exchangeProblem(d: ExchangeDraft): string | null {
  for (let i = 0; i < STEP_CHECKS.length; i++) { const p = stepProblem(d, i); if (p) return p; }
  return null;
}

/** Snake_case body for POST/PATCH /api/exchange. PATCH replaces the whole item, so every field is always sent. */
export function draftToPayload(d: ExchangeDraft) {
  const details: Record<string, unknown> = {};
  if (d.brand.trim()) details.brand = d.brand.trim();
  if (d.yearBought.trim()) details.year_bought = Number(d.yearBought);
  if (d.hasBill !== null) details.has_bill = d.hasBill;
  return {
    type: d.type, category: d.category, condition: d.condition, title: d.title.trim(), description: d.description.trim() || null,
    price: paid(d) ? Number(d.price) : 0, original_price: paid(d) && d.originalPrice.trim() ? Number(d.originalPrice) : null,
    rent_period: d.type === 'Rent' ? d.rentPeriod : null, exchange_for: d.type === 'Exchange' ? d.exchangeFor.trim() : null,
    photos: d.photos, phone: d.phone || null, area: d.area.trim() || null, college_id: d.collegeId || null, details: Object.keys(details).length ? details : null,
  };
}

export function itemToDraft(i: Listing): ExchangeDraft {
  const phone = i.phone.replace(/\D/g, '').slice(-10); // old items may store +91 or spaces
  const { brand, year_bought, has_bill } = i.details;
  return {
    photos: i.photos, title: i.title, category: i.category, condition: i.condition, description: i.description,
    brand: typeof brand === 'string' ? brand : '', yearBought: year_bought == null ? '' : String(year_bought), hasBill: typeof has_bill === 'boolean' ? has_bill : null,
    type: i.type, price: i.price ? String(i.price) : '', originalPrice: i.originalPrice == null ? '' : String(i.originalPrice), rentPeriod: i.rentPeriod ?? 'month', exchangeFor: i.exchangeFor,
    collegeId: i.collegeId ?? '', collegeName: i.college, area: i.area, phone: /^[6-9]\d{9}$/.test(phone) ? phone : '',
  };
}
