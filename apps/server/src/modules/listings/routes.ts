import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import {
  CreateListingBody,
  IdParams,
  ImageSize,
  ListingActionBody,
  ListingCard,
  ListingDetail,
  Meta,
  UpdateListingBody,
  UploadResult,
  Uuid,
} from '@campusmarkt/contracts';
import type { Config } from '../../config.js';
import { unprocessable } from '../../platform/errors.js';
import { requireAuth } from '../../platform/http/auth.js';
import type { ModuleDeps } from '../shared.js';
import type { ListingsService } from './service.js';

export function listingRoutes(service: ListingsService, deps: ModuleDeps, config: Config): FastifyPluginAsyncTypebox {
  return async (app) => {
    const tags = ['listings'];

    app.get('/meta', { schema: { tags: ['meta'], security: [], response: { 200: Meta } } }, async () => ({
      categories: await service.categories(),
      locations: await service.locations(),
      termsVersion: config.termsVersion,
      demoMode: config.demoMode,
      allowedDomains: await deps.modules.identity.allowedDomains(),
      maxImagesPerListing: 8,
      maxImageBytes: 10 * 1024 * 1024,
    }));

    app.get('/listings/:id', { schema: { tags, params: IdParams, response: { 200: ListingDetail } } }, async (req) =>
      service.get(requireAuth(req), req.params.id),
    );

    app.post(
      '/listings',
      { schema: { tags, body: CreateListingBody, response: { 201: ListingDetail } } },
      async (req, reply) => reply.status(201).send(await service.create(requireAuth(req), req.body)),
    );

    app.patch(
      '/listings/:id',
      { schema: { tags, params: IdParams, body: UpdateListingBody, response: { 200: ListingDetail } } },
      async (req) => service.update(requireAuth(req), req.params.id, req.body),
    );

    app.post(
      '/listings/:id/status',
      { schema: { tags, params: IdParams, body: ListingActionBody, response: { 200: ListingDetail } } },
      async (req) => service.action(requireAuth(req), req.params.id, req.body.action),
    );

    app.delete('/listings/:id', { schema: { tags, params: IdParams } }, async (req, reply) => {
      await service.remove(requireAuth(req), req.params.id);
      return reply.status(204).send();
    });

    app.get('/me/listings', { schema: { tags, response: { 200: Type.Array(ListingCard) } } }, async (req) =>
      service.mine(requireAuth(req)),
    );

    app.post(
      '/uploads',
      { schema: { tags, consumes: ['multipart/form-data'], response: { 201: UploadResult } } },
      async (req, reply) => {
        const auth = requireAuth(req);
        const files: { buffer: Buffer }[] = [];
        for await (const part of req.files()) {
          const buffer = await part.toBuffer();
          if (part.file.truncated) throw unprocessable('file_too_large', 'Ein Bild ist größer als 10 MB.');
          files.push({ buffer });
        }
        return reply.status(201).send({ uploads: await service.upload(auth, files) });
      },
    );

    app.get(
      '/media/:imageId/:size',
      { schema: { tags, params: Type.Object({ imageId: Uuid, size: ImageSize }) } },
      async (req, reply) => {
        const data = await service.media(requireAuth(req), req.params.imageId, req.params.size);
        return reply
          .header('cache-control', 'private, max-age=3600')
          .header('content-disposition', 'inline')
          .type('image/webp')
          .send(data);
      },
    );
  };
}
