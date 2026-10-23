import type { Module, ModuleDeps } from '../shared.js';
import { identityRoutes } from './routes.js';
import { createIdentityService, type IdentityService } from './service.js';

export type IdentityApi = IdentityService;
export type { Contact } from './service.js';

/** Modul identity: Registrierung, Login, Sessions, Whitelist, Rollen (ADR-0003). */
export function createIdentityModule(deps: ModuleDeps): Module<IdentityApi> {
  const service = createIdentityService(deps);
  return { api: service, routes: identityRoutes(service, deps.config) };
}
