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
  description: string; details: Record<string, unknown>; views: number; isHidden: boolean;
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
