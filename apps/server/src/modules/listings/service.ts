import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import type {
  CampusLocation,
  Category,
  CreateListingBody,
  ListingAction,
  ListingAttributes,
  ListingCard,
  ListingDetail,
  ListingStatus,
  PriceType,
  UpdateListingBody,
} from '@campusmarkt/contracts';
import type { Tx } from '../../platform/db.js';
import { AppError, conflict, forbidden, notFound, unprocessable } from '../../platform/errors.js';
import type { AuthContext } from '../../platform/http/auth.js';
import { empty, sql } from '../../platform/sql.js';
import type { ModuleDeps } from '../shared.js';
import {
  checkPrice,
  COUNTED_STATUSES,
  EDITABLE_STATUSES,
  EXPIRY_REMINDER_DAYS,
  findProhibitedTerms,
  IMAGE_SIZES,
  LISTING_LIFETIME_DAYS,
  MAX_ACTIVE_LISTINGS,
  nextStatus,
  PUBLIC_STATUSES,
  sniffImageType,
} from './domain.js';

export const PROCESS_IMAGE = 'process-image';
export const LISTINGS_MAINTENANCE = 'listings-maintenance';

interface ListingRow {
  id: string;
  owner_id: string;
  institution_id: string;
  kind: 'offer' | 'wanted';
  title: string;
  description: string;
  category_id: string;
  price_type: PriceType;
  price_cents: number | null;
  currency: string;
  condition: ListingDetail['condition'];
  attributes: ListingAttributes;
  location_ids: string[];
  /** `deleted` existiert nur in der Datenbank (Soft Delete) und wird nie ausgeliefert. */
  status: ListingStatus | 'deleted';
  hidden: boolean;
  owner_suspended: boolean;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  thumb_id: string | null;
}

interface ImageRow {
  id: string;
  listing_id: string | null;
  owner_id: string;
  status: 'uploaded' | 'processing' | 'ready' | 'failed';
  original_key: string;
  position: number;
}

const mediaUrl = (imageId: string) => `/api/v1/media/${imageId}`;
const THUMB = sql`(SELECT i.id FROM listings.image i WHERE i.listing_id = l.id AND i.status = 'ready'
                   ORDER BY i.position LIMIT 1) AS thumb_id`;

export const toCard = (r: ListingRow): ListingCard => ({
  id: r.id,
  kind: r.kind,
  title: r.title,
  priceType: r.price_type,
  priceCents: r.price_cents,
  currency: r.currency.trim(),
  status: r.status === 'deleted' ? 'removed' : r.status,
  categoryId: r.category_id,
  locationIds: r.location_ids,
  thumbnailUrl: r.thumb_id ? `${mediaUrl(r.thumb_id)}/sm` : null,
  createdAt: r.created_at,
  expiresAt: r.expires_at,
});

export function createListingsService(deps: ModuleDeps) {
  const { database, storage, modules } = deps;
  const { db } = database;

  async function load(id: string, tx?: Tx) {
    return (tx?.db ?? db).one<ListingRow>(sql`
      SELECT l.*, ${THUMB} FROM listings.listing l WHERE l.id = ${id} AND l.status <> 'deleted'`);
  }

  async function loadOwned(auth: AuthContext, id: string, tx?: Tx) {
    const row = await load(id, tx);
    // Fremde Anzeigen: 404 statt 403, keine Existenzpreisgabe
    if (!row || row.owner_id !== auth.userId) throw notFound('Anzeige nicht gefunden');
    return row;
  }

  async function validate(body: Partial<CreateListingBody>, current?: ListingRow) {
    const errors: { path: string; message: string }[] = [];
    const priceType = body.priceType ?? current?.price_type;
    const priceCents = body.priceCents !== undefined ? body.priceCents : current?.price_cents;
    if (priceType) {
      const price = checkPrice(priceType, priceCents);
      if (!price.ok) errors.push({ path: 'priceCents', message: price.message });
    }
    if (body.categoryId && !(await db.one(sql`SELECT 1 FROM listings.category WHERE id = ${body.categoryId}`))) {
      errors.push({ path: 'categoryId', message: 'Unbekannte Kategorie' });
    }
    if (body.locationIds && !(await locationsExist(body.locationIds))) {
      errors.push({ path: 'locationIds', message: 'Unbekannter Übergabeort' });
    }
    if (errors.length) throw unprocessable('validation_failed', 'Eingaben sind ungültig', errors);
  }

  async function locationsExist(ids: string[]) {
    if (ids.length === 0) return true;
    const row = await db.one<{ n: number }>(sql`
      SELECT count(*) AS n FROM listings.campus_location WHERE id = ANY(${ids}::uuid[])`);
    return row?.n === new Set(ids).size;
  }

  /** Hängt hochgeladene Bilder an und ordnet sie; entfernte Bilder werden gelöscht. */
  async function syncImages(tx: Tx, auth: AuthContext, listingId: string, imageIds: string[]) {
    const unique = [...new Set(imageIds)];
    const rows = unique.length
      ? await tx.db.query<ImageRow>(sql`
          SELECT * FROM listings.image WHERE id = ANY(${unique}::uuid[]) AND owner_id = ${auth.userId}
            AND (listing_id IS NULL OR listing_id = ${listingId}) FOR UPDATE`)
      : [];
    if (rows.length !== unique.length) {
      throw unprocessable('invalid_image', 'Mindestens ein Bild ist unbekannt.', [{ path: 'imageIds', message: 'unbekannt' }]);
    }
    const removed = await tx.db.query<ImageRow>(sql`
      DELETE FROM listings.image WHERE listing_id = ${listingId} AND NOT (id = ANY(${unique}::uuid[])) RETURNING *`);
    for (const image of removed) await deleteImageFiles(image);

    for (const [position, id] of unique.entries()) {
      const row = rows.find((r) => r.id === id)!;
      if (row.listing_id === null) {
        await tx.db.exec(sql`
          UPDATE listings.image SET listing_id = ${listingId}, position = ${position}, status = 'processing'
          WHERE id = ${id}`);
        await tx.enqueue(PROCESS_IMAGE, { imageId: id });
      } else {
        await tx.db.exec(sql`UPDATE listings.image SET position = ${position} WHERE id = ${id}`);
      }
    }
  }

  async function deleteImageFiles(image: ImageRow) {
    await storage.delete(image.original_key);
    if (image.listing_id) {
      for (const size of Object.keys(IMAGE_SIZES)) {
        await storage.delete(`public/${image.listing_id}/${image.id}-${size}.webp`);
      }
    }
  }

  async function toDetail(row: ListingRow, viewerId: string): Promise<ListingDetail> {
    const images = await db.query<ImageRow>(sql`
      SELECT * FROM listings.image WHERE listing_id = ${row.id} ORDER BY position`);
    const owners = await modules.identity.getPublicUsers([row.owner_id]);
    const owner = owners.get(row.owner_id) ?? {
      id: row.owner_id,
      displayName: 'Ehemaliges Mitglied',
      userType: 'student' as const,
      memberSince: row.created_at,
    };
    const isOwner = row.owner_id === viewerId;
    return {
      ...toCard(row),
      description: row.description,
      condition: row.condition,
      attributes: row.attributes,
      images: images
        .filter((i) => i.status !== 'uploaded')
        .map((i) => ({ id: i.id, status: i.status === 'ready' ? 'ready' : i.status, url: mediaUrl(i.id) }) as ListingDetail['images'][number]),
      owner,
      isOwner,
      isFavorite: isOwner ? false : await modules.search.isFavorite(viewerId, row.id),
      conversationId: isOwner ? null : await modules.messaging.findConversationId(row.id, viewerId),
      updatedAt: row.updated_at,
    };
  }

  /** Neue/geänderte Inhalte: Wortfilter → Moderation statt Veröffentlichung (REQ-LST-010). */
  async function routeThroughFilter(tx: Tx, listingId: string, ownerId: string, title: string, description: string) {
    const hits = findProhibitedTerms(title, description);
    if (hits.length === 0) return false;
    await tx.db.exec(sql`
      UPDATE listings.listing SET status = 'in_review', status_changed_at = now() WHERE id = ${listingId}`);
    await modules.trust.openSystemCase(tx, {
      targetType: 'listing',
      targetId: listingId,
      subjectUserId: ownerId,
      details: `Wortfilter: ${hits.join(', ')}`,
    });
    return true;
  }

  return {
    async categories(): Promise<Category[]> {
      return db.query(sql`
        SELECT id, slug, name, has_study_attributes AS "hasStudyAttributes" FROM listings.category ORDER BY sort, name`);
    },

    async locations(): Promise<CampusLocation[]> {
      return db.query(sql`SELECT id, name FROM listings.campus_location ORDER BY sort, name`);
    },

    locationsExist,

    async create(auth: AuthContext, body: CreateListingBody): Promise<ListingDetail> {
      await validate(body);
      const price = checkPrice(body.priceType, body.priceCents);
      const id = await database.tx(async (tx) => {
        // REQ-LST-011 (Lock pro Nutzer gegen parallele Anlage)
        await tx.db.exec(sql`SELECT pg_advisory_xact_lock(hashtext(${'listing-limit:' + auth.userId}))`);
        const count = await tx.db.one<{ n: number }>(sql`
          SELECT count(*) AS n FROM listings.listing
          WHERE owner_id = ${auth.userId} AND status = ANY(${COUNTED_STATUSES}::text[])`);
        if ((count?.n ?? 0) >= MAX_ACTIVE_LISTINGS) {
          throw unprocessable('listing_limit', `Du kannst höchstens ${MAX_ACTIVE_LISTINGS} aktive Anzeigen haben.`);
        }
        const row = await tx.db.one<{ id: string }>(sql`
          INSERT INTO listings.listing (owner_id, institution_id, kind, title, description, category_id, price_type,
            price_cents, condition, attributes, location_ids, status, expires_at)
          VALUES (${auth.userId}, ${auth.institutionId}, ${body.kind}, ${body.title.trim()}, ${body.description.trim()},
            ${body.categoryId}, ${body.priceType}, ${price.ok ? price.priceCents : null}, ${body.condition ?? null},
            ${JSON.stringify(body.attributes ?? {})}::jsonb, ${[...new Set(body.locationIds)]}::uuid[], 'active',
            now() + make_interval(days => ${LISTING_LIFETIME_DAYS}))
          RETURNING id`);
        await syncImages(tx, auth, row!.id, body.imageIds ?? []);
        await routeThroughFilter(tx, row!.id, auth.userId, body.title, body.description);
        return row!.id;
      });
      return toDetail((await load(id))!, auth.userId);
    },

    async update(auth: AuthContext, id: string, body: UpdateListingBody): Promise<ListingDetail> {
      await database.tx(async (tx) => {
        const current = await loadOwned(auth, id, tx);
        if (!EDITABLE_STATUSES.includes(current.status)) {
          throw conflict('not_editable', 'Diese Anzeige kann nicht mehr bearbeitet werden.');
        }
        await validate(body, current);
        const priceType = body.priceType ?? current.price_type;
        const price = checkPrice(priceType, body.priceCents !== undefined ? body.priceCents : current.price_cents);
        await tx.db.exec(sql`
          UPDATE listings.listing SET
            kind = ${body.kind ?? current.kind},
            title = ${body.title?.trim() ?? current.title},
            description = ${body.description?.trim() ?? current.description},
            category_id = ${body.categoryId ?? current.category_id},
            price_type = ${priceType},
            price_cents = ${price.ok ? price.priceCents : null},
            condition = ${body.condition !== undefined ? body.condition : current.condition},
            attributes = ${JSON.stringify(body.attributes ?? current.attributes)}::jsonb,
            location_ids = ${body.locationIds ? [...new Set(body.locationIds)] : current.location_ids}::uuid[],
            updated_at = now()
          WHERE id = ${id}`);
        if (body.imageIds) await syncImages(tx, auth, id, body.imageIds);
        const textChanged = body.title !== undefined || body.description !== undefined;
        if (textChanged && current.status !== 'in_review') {
          await routeThroughFilter(
            tx,
            id,
            auth.userId,
            body.title ?? current.title,
            body.description ?? current.description,
          );
        }
      });
      return toDetail((await load(id))!, auth.userId);
    },

    async action(auth: AuthContext, id: string, action: ListingAction): Promise<ListingDetail> {
      await database.tx(async (tx) => {
        const current = await loadOwned(auth, id, tx);
        const next = nextStatus(current.status, action);
        if (!next) throw conflict('invalid_transition', 'Diese Aktion ist im aktuellen Zustand nicht möglich.');
        const extend = action === 'extend' || (action === 'resume' && current.expires_at && current.expires_at < new Date().toISOString());
        await tx.db.exec(sql`
          UPDATE listings.listing SET status = ${next}, status_changed_at = now(), updated_at = now()
            ${extend ? sql`, expires_at = now() + make_interval(days => ${LISTING_LIFETIME_DAYS}), reminder_sent_at = NULL` : empty}
          WHERE id = ${id}`);
        if (action === 'complete' || action === 'unreserve') {
          await modules.messaging.onListingStatusChanged(tx, id, next);
        }
      });
      return toDetail((await load(id))!, auth.userId);
    },

    async remove(auth: AuthContext, id: string): Promise<void> {
      await database.tx(async (tx) => {
        await loadOwned(auth, id, tx);
        await softDelete(tx, [id]);
        await modules.messaging.onListingStatusChanged(tx, id, 'deleted');
      });
    },

    async get(viewer: AuthContext, id: string): Promise<ListingDetail> {
      const row = await load(id);
      if (!row) throw notFound('Anzeige nicht gefunden');
      const isOwner = row.owner_id === viewer.userId;
      const isStaff = viewer.role !== 'member';
      const visible = PUBLIC_STATUSES.includes(row.status) && !row.hidden && !row.owner_suspended;
      if (!isOwner && !isStaff && !visible) throw notFound('Anzeige nicht gefunden');
      return toDetail(row, viewer.userId);
    },

    async mine(auth: AuthContext): Promise<ListingCard[]> {
      const rows = await db.query<ListingRow>(sql`
        SELECT l.*, ${THUMB} FROM listings.listing l
        WHERE l.owner_id = ${auth.userId} AND l.status <> 'deleted' ORDER BY l.created_at DESC`);
      return rows.map(toCard);
    },

    /** Karten in der Reihenfolge der IDs; nur öffentlich sichtbare Anzeigen. */
    async cards(ids: string[]): Promise<ListingCard[]> {
      if (ids.length === 0) return [];
      const rows = await db.query<ListingRow>(sql`
        SELECT l.*, ${THUMB} FROM listings.listing l
        WHERE l.id = ANY(${ids}::uuid[]) AND l.status = ANY(${PUBLIC_STATUSES}::text[])
          AND NOT l.hidden AND NOT l.owner_suspended`);
      const byId = new Map(rows.map((r) => [r.id, toCard(r)]));
      return ids.map((id) => byId.get(id)).filter((c): c is ListingCard => !!c);
    },

    /** Für Chat und Moderation: Anzeige unabhängig von der Sichtbarkeit. */
    async summary(id: string) {
      const row = await db.one<ListingRow>(sql`SELECT l.*, ${THUMB} FROM listings.listing l WHERE l.id = ${id}`);
      if (!row) return null;
      return {
        ...toCard(row),
        deleted: row.status === 'deleted',
        description: row.description,
        ownerId: row.owner_id,
        hidden: row.hidden,
        ownerSuspended: row.owner_suspended,
        available: (row.status === 'active' || row.status === 'reserved') && !row.hidden && !row.owner_suspended,
      };
    },

    async summaries(ids: string[]) {
      if (ids.length === 0) return new Map<string, ListingCard>();
      const rows = await db.query<ListingRow>(sql`
        SELECT l.*, ${THUMB} FROM listings.listing l WHERE l.id = ANY(${ids}::uuid[])`);
      return new Map(rows.map((r) => [r.id, toCard(r)]));
    },

    /** Vom Deal gesteuerte Statuswechsel (messaging, ADR-0006). */
    async setStatusFromDeal(tx: Tx, id: string, status: 'active' | 'reserved' | 'completed'): Promise<void> {
      await tx.db.exec(sql`
        UPDATE listings.listing SET status = ${status}, status_changed_at = now(), updated_at = now()
        WHERE id = ${id} AND status IN ('active', 'reserved')`);
    },

    // ------------------------------------------------------------ Moderation (trust)
    async removeByModeration(tx: Tx, id: string) {
      await tx.db.exec(sql`
        UPDATE listings.listing SET status = 'removed', status_changed_at = now() WHERE id = ${id}`);
    },
    async approveFromReview(tx: Tx, id: string) {
      await tx.db.exec(sql`
        UPDATE listings.listing SET status = 'active', hidden = false, status_changed_at = now(),
          expires_at = now() + make_interval(days => ${LISTING_LIFETIME_DAYS})
        WHERE id = ${id} AND status = 'in_review'`);
      await tx.db.exec(sql`UPDATE listings.listing SET hidden = false WHERE id = ${id}`);
    },
    async setHidden(tx: Tx, id: string, hidden: boolean) {
      await tx.db.exec(sql`UPDATE listings.listing SET hidden = ${hidden} WHERE id = ${id}`);
    },
    async setOwnerSuspended(tx: Tx, ownerId: string, suspended: boolean) {
      await tx.db.exec(sql`UPDATE listings.listing SET owner_suspended = ${suspended} WHERE owner_id = ${ownerId}`);
    },
    /** Widerspruch stattgegeben (REQ-LEGAL-007): entfernte Anzeige wieder sichtbar, mit voller Laufzeit. */
    async restoreByModeration(tx: Tx, id: string) {
      await tx.db.exec(sql`
        UPDATE listings.listing SET status = 'active', hidden = false, status_changed_at = now(),
          expires_at = now() + make_interval(days => ${LISTING_LIFETIME_DAYS})
        WHERE id = ${id} AND status = 'removed'`);
    },
    async deleteAllForOwner(tx: Tx, ownerId: string) {
      const rows = await tx.db.query<{ id: string }>(sql`SELECT id FROM listings.listing WHERE owner_id = ${ownerId}`);
      await softDelete(tx, rows.map((r) => r.id));
      const orphans = await tx.db.query<ImageRow>(sql`
        DELETE FROM listings.image WHERE owner_id = ${ownerId} AND listing_id IS NULL RETURNING *`);
      for (const image of orphans) await deleteImageFiles(image);
    },
    async exportForUser(userId: string) {
      return db.query(sql`
        SELECT id, kind, title, description, price_type AS "priceType", price_cents AS "priceCents", status,
               created_at AS "createdAt" FROM listings.listing WHERE owner_id = ${userId} AND status <> 'deleted'`);
    },

    // ------------------------------------------------------------ Bilder (ADR-0007)
    async upload(auth: AuthContext, files: { buffer: Buffer }[]): Promise<{ id: string }[]> {
      if (files.length === 0 || files.length > 8) throw unprocessable('invalid_upload', 'Bitte 1 bis 8 Bilder hochladen.');
      const result: { id: string }[] = [];
      for (const file of files) {
        const type = sniffImageType(file.buffer);
        if (!type) throw new AppError(415, 'unsupported_media_type', 'Nur JPEG, PNG oder WebP sind erlaubt.');
        // Die vorkompilierte libvips in sharp dekodiert kein HEIC (HEVC-Lizenz), siehe ADR-0011
        if (type === 'heic') {
          throw new AppError(415, 'heic_unsupported', 'HEIC wird noch nicht unterstützt. Bitte das Foto als JPEG speichern.');
        }
      }
      for (const file of files) {
        const id = randomUUID();
        const key = `quarantine/${id}`;
        await storage.put(key, file.buffer);
        await db.exec(sql`
          INSERT INTO listings.image (id, owner_id, status, original_key) VALUES (${id}, ${auth.userId}, 'uploaded', ${key})`);
        result.push({ id });
      }
      return result;
    },

    async media(viewer: AuthContext, imageId: string, size: keyof typeof IMAGE_SIZES): Promise<Buffer> {
      const row = await db.one<ImageRow & { listing_status: ListingRow['status']; owner: string; hidden: boolean }>(sql`
        SELECT i.*, l.status AS listing_status, l.owner_id AS owner, l.hidden
        FROM listings.image i JOIN listings.listing l ON l.id = i.listing_id
        WHERE i.id = ${imageId} AND i.status = 'ready'`);
      if (!row || row.listing_status === 'deleted') throw notFound();
      const mayView = row.owner === viewer.userId || viewer.role !== 'member' || (!row.hidden && row.listing_status !== 'removed');
      if (!mayView) throw notFound();
      const data = await storage.get(`public/${row.listing_id}/${row.id}-${size}.webp`);
      if (!data) throw notFound();
      return data;
    },

    /** Job: Magic Bytes prüfen, neu kodieren (entfernt EXIF/GPS), drei Größen erzeugen. */
    async processImage(imageId: string): Promise<void> {
      const image = await db.one<ImageRow>(sql`SELECT * FROM listings.image WHERE id = ${imageId}`);
      if (!image || image.status !== 'processing' || !image.listing_id) return;
      const original = await storage.get(image.original_key);
      try {
        if (!original || !sniffImageType(original)) throw new Error('Kein gültiges Bild');
        for (const [size, px] of Object.entries(IMAGE_SIZES)) {
          // rotate() übernimmt die EXIF-Ausrichtung, danach werden alle Metadaten verworfen
          const output = await sharp(original, { limitInputPixels: 50_000_000 })
            .rotate()
            .resize(px, px, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();
          await storage.put(`public/${image.listing_id}/${image.id}-${size}.webp`, output);
        }
        await db.exec(sql`UPDATE listings.image SET status = 'ready' WHERE id = ${imageId}`);
      } catch (error) {
        deps.logger.warn({ err: error, imageId }, 'Bild konnte nicht verarbeitet werden');
        await db.exec(sql`UPDATE listings.image SET status = 'failed' WHERE id = ${imageId}`);
      } finally {
        await storage.delete(image.original_key);
      }
    },

    // ------------------------------------------------------------ Lebenszyklus (REQ-LST-008)
    async maintenance(): Promise<Record<string, number>> {
      const stats: Record<string, number> = {};
      const reminders = await db.query<{ id: string; owner_id: string; title: string; expires_at: string }>(sql`
        UPDATE listings.listing SET reminder_sent_at = now()
        WHERE status = 'active' AND reminder_sent_at IS NULL
          AND expires_at < now() + make_interval(days => ${EXPIRY_REMINDER_DAYS})
        RETURNING id, owner_id, title, expires_at`);
      for (const r of reminders) {
        await modules.notifications.email(undefined, { userId: r.owner_id }, 'listing_expiry', {
          listingTitle: r.title,
          dateIso: new Date(r.expires_at).toISOString(),
          link: `${deps.config.publicUrl}/listings/${r.id}`,
        });
      }
      stats.reminders = reminders.length;
      stats.expired = await db.exec(sql`
        UPDATE listings.listing SET status = 'expired', status_changed_at = now()
        WHERE status = 'active' AND expires_at < now()`);
      // Löschfristen: abgelaufen 90 Tage, abgegeben 30 Tage (Zustandsmodell); gesicherte Anzeigen
      // (Verdacht auf Straftat, REQ-LEGAL-008) bleiben bis zur Freigabe erhalten
      const held = await modules.trust.heldTargetIds('listing');
      const purge = await db.query<{ id: string }>(sql`
        UPDATE listings.listing SET status = 'deleted', status_changed_at = now()
        WHERE ((status = 'expired' AND status_changed_at < now() - interval '90 days')
           OR (status = 'completed' AND status_changed_at < now() - interval '30 days'))
          AND id <> ALL(${held}::uuid[])
        RETURNING id`);
      stats.purged = purge.length;
      for (const { id } of purge) await storage.deletePrefix(`public/${id}`);
      stats.hardDeleted = await db.exec(sql`
        DELETE FROM listings.listing WHERE status = 'deleted' AND status_changed_at < now() - interval '1 day'
          AND id <> ALL(${held}::uuid[])`);
      const stale = await db.query<ImageRow>(sql`
        DELETE FROM listings.image WHERE listing_id IS NULL AND created_at < now() - interval '24 hours' RETURNING *`);
      for (const image of stale) await deleteImageFiles(image);
      for (const key of await storage.listOlderThan('quarantine', new Date(Date.now() - 86_400_000))) {
        await storage.delete(key);
      }
      stats.staleUploads = stale.length;
      return stats;
    },
  };

  async function softDelete(tx: Tx, ids: string[]) {
    if (ids.length === 0) return;
    const images = await tx.db.query<ImageRow>(sql`
      DELETE FROM listings.image WHERE listing_id = ANY(${ids}::uuid[]) RETURNING *`);
    for (const image of images) await deleteImageFiles(image);
    for (const id of ids) await storage.deletePrefix(`public/${id}`);
    await tx.db.exec(sql`
      UPDATE listings.listing SET status = 'deleted', status_changed_at = now() WHERE id = ANY(${ids}::uuid[])`);
  }
}

export type ListingsService = ReturnType<typeof createListingsService>;

/** Für Typ-Prüfungen in Routen. */
export function assertOwnerOrStaff(auth: AuthContext, ownerId: string) {
  if (auth.userId !== ownerId && auth.role === 'member') throw forbidden();
}
