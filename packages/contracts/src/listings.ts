import { Type, type Static } from '@sinclair/typebox';
import { Timestamp, Uuid } from './common.js';
import { PublicUser } from './identity.js';

export const ListingKind = Type.Union([Type.Literal('offer'), Type.Literal('wanted')]);
export type ListingKind = Static<typeof ListingKind>;

export const PriceType = Type.Union([
  Type.Literal('fixed'),
  Type.Literal('negotiable'),
  Type.Literal('free'),
  Type.Literal('swap'),
]);
export type PriceType = Static<typeof PriceType>;

export const Condition = Type.Union([
  Type.Literal('new'),
  Type.Literal('like_new'),
  Type.Literal('good'),
  Type.Literal('acceptable'),
  Type.Literal('defective'),
]);
export type Condition = Static<typeof Condition>;

/** Zustandsmodell Anzeige (Anforderungskatalog §1.2). `deleted` wird nie ausgeliefert. */
export const ListingStatus = Type.Union([
  Type.Literal('draft'),
  Type.Literal('in_review'),
  Type.Literal('active'),
  Type.Literal('paused'),
  Type.Literal('reserved'),
  Type.Literal('completed'),
  Type.Literal('expired'),
  Type.Literal('removed'),
]);
export type ListingStatus = Static<typeof ListingStatus>;

export const ListingAttributes = Type.Object({
  studyProgram: Type.Optional(Type.String({ maxLength: 80 })),
  module: Type.Optional(Type.String({ maxLength: 80 })),
  isbn: Type.Optional(Type.String({ maxLength: 17, pattern: '^[0-9Xx-]{10,17}$' })),
});
export type ListingAttributes = Static<typeof ListingAttributes>;

export const ImageSize = Type.Union([Type.Literal('sm'), Type.Literal('md'), Type.Literal('lg')]);
export type ImageSize = Static<typeof ImageSize>;

export const ListingImage = Type.Object({
  id: Uuid,
  status: Type.Union([Type.Literal('processing'), Type.Literal('ready'), Type.Literal('failed')]),
  /** Basis-URL ohne Größe, z. B. `/api/v1/media/<id>`; Größe wird als `/sm|md|lg` angehängt. */
  url: Type.String(),
});
export type ListingImage = Static<typeof ListingImage>;

export const ListingCard = Type.Object({
  id: Uuid,
  kind: ListingKind,
  title: Type.String(),
  priceType: PriceType,
  priceCents: Type.Union([Type.Integer(), Type.Null()]),
  currency: Type.String(),
  status: ListingStatus,
  categoryId: Uuid,
  locationIds: Type.Array(Uuid),
  thumbnailUrl: Type.Union([Type.String(), Type.Null()]),
  createdAt: Timestamp,
  expiresAt: Type.Union([Timestamp, Type.Null()]),
});
export type ListingCard = Static<typeof ListingCard>;

export const ListingDetail = Type.Composite([
  ListingCard,
  Type.Object({
    description: Type.String(),
    condition: Type.Union([Condition, Type.Null()]),
    attributes: ListingAttributes,
    images: Type.Array(ListingImage),
    owner: PublicUser,
    isOwner: Type.Boolean(),
    isFavorite: Type.Boolean(),
    /** Bestehende Konversation des angemeldeten Interessenten zu dieser Anzeige. */
    conversationId: Type.Union([Uuid, Type.Null()]),
    updatedAt: Timestamp,
  }),
]);
export type ListingDetail = Static<typeof ListingDetail>;

const ListingFields = {
  kind: ListingKind,
  title: Type.String({ minLength: 3, maxLength: 80 }),
  description: Type.String({ minLength: 10, maxLength: 4000 }),
  categoryId: Uuid,
  priceType: PriceType,
  /** Pflicht bei `fixed`/`negotiable`: 1 … 1.000.000 Cent (REQ-LST-002). */
  priceCents: Type.Optional(Type.Union([Type.Integer({ minimum: 1, maximum: 1_000_000 }), Type.Null()])),
  condition: Type.Optional(Type.Union([Condition, Type.Null()])),
  locationIds: Type.Array(Uuid, { minItems: 1, maxItems: 5 }),
  attributes: Type.Optional(ListingAttributes),
  /** Upload-IDs aus `POST /uploads`, Reihenfolge = Anzeigereihenfolge, max. 8. */
  imageIds: Type.Optional(Type.Array(Uuid, { maxItems: 8 })),
};

export const CreateListingBody = Type.Object(ListingFields);
export type CreateListingBody = Static<typeof CreateListingBody>;

export const UpdateListingBody = Type.Partial(Type.Object(ListingFields));
export type UpdateListingBody = Static<typeof UpdateListingBody>;

export const ListingAction = Type.Union([
  Type.Literal('pause'),
  Type.Literal('resume'),
  Type.Literal('reserve'),
  Type.Literal('unreserve'),
  Type.Literal('complete'),
  Type.Literal('extend'),
]);
export type ListingAction = Static<typeof ListingAction>;

export const ListingActionBody = Type.Object({ action: ListingAction });
export type ListingActionBody = Static<typeof ListingActionBody>;

export const SearchSort = Type.Union([
  Type.Literal('relevance'),
  Type.Literal('newest'),
  Type.Literal('price_asc'),
  Type.Literal('price_desc'),
]);
export type SearchSort = Static<typeof SearchSort>;

export const SearchQuery = Type.Object({
  q: Type.Optional(Type.String({ maxLength: 100 })),
  categoryId: Type.Optional(Uuid),
  kind: Type.Optional(ListingKind),
  priceType: Type.Optional(PriceType),
  minPriceCents: Type.Optional(Type.Integer({ minimum: 0 })),
  maxPriceCents: Type.Optional(Type.Integer({ minimum: 0 })),
  locationId: Type.Optional(Uuid),
  condition: Type.Optional(Condition),
  sort: Type.Optional(SearchSort),
  cursor: Type.Optional(Type.String({ maxLength: 100 })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 50 })),
});
export type SearchQuery = Static<typeof SearchQuery>;

export const SearchResult = Type.Object({
  items: Type.Array(ListingCard),
  nextCursor: Type.Union([Type.String(), Type.Null()]),
  /** true, wenn auf die vereinfachte Titelsuche zurückgefallen wurde (Degradation REQ-PERF-001). */
  degraded: Type.Boolean(),
});
export type SearchResult = Static<typeof SearchResult>;

export const UploadResult = Type.Object({ uploads: Type.Array(Type.Object({ id: Uuid })) });
export type UploadResult = Static<typeof UploadResult>;

export const Category = Type.Object({
  id: Uuid,
  slug: Type.String(),
  name: Type.String(),
  /** true für „Bücher & Skripte“: Studiengang, Modul, ISBN anbieten (REQ-LST-005). */
  hasStudyAttributes: Type.Boolean(),
});
export type Category = Static<typeof Category>;

export const CampusLocation = Type.Object({ id: Uuid, name: Type.String() });
export type CampusLocation = Static<typeof CampusLocation>;

export const Meta = Type.Object({
  categories: Type.Array(Category),
  locations: Type.Array(CampusLocation),
  termsVersion: Type.String(),
  demoMode: Type.Boolean(),
  allowedDomains: Type.Array(Type.String()),
  maxImagesPerListing: Type.Integer(),
  maxImageBytes: Type.Integer(),
});
export type Meta = Static<typeof Meta>;
