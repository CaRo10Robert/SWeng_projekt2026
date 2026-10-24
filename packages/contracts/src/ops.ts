import { Type, type Static } from '@sinclair/typebox';
import { Timestamp } from './common.js';

/** Ankündigung als Banner für alle Besucher (REQ-OPS-006). */
export const Announcement = Type.Object({
  text: Type.String({ minLength: 3, maxLength: 300 }),
  startsAt: Type.Union([Timestamp, Type.Null()]),
  endsAt: Type.Union([Timestamp, Type.Null()]),
});
export type Announcement = Static<typeof Announcement>;

export const AnnouncementBody = Type.Object({
  text: Type.String({ minLength: 3, maxLength: 300 }),
  startsAt: Type.Optional(Type.Union([Timestamp, Type.Null()])),
  endsAt: Type.Optional(Type.Union([Timestamp, Type.Null()])),
});
export type AnnouncementBody = Static<typeof AnnouncementBody>;

/** Weicher Wartungsmodus über die Oberfläche; der harte kommt aus MAINTENANCE_MODE (REQ-OPS-006). */
export const MaintenanceBody = Type.Object({
  on: Type.Boolean(),
  until: Type.Optional(Type.Union([Timestamp, Type.Null()])),
});
export type MaintenanceBody = Static<typeof MaintenanceBody>;

export const ServiceState = Type.Union([Type.Literal('operational'), Type.Literal('disrupted')]);
export type ServiceState = Static<typeof ServiceState>;

/**
 * Öffentliche Statusseite (REQ-OPS-007): nur Zustände und Zeitpunkt, keine Versionen, Hostnamen oder
 * Fehlermeldungen.
 */
export const SystemStatus = Type.Object({
  status: Type.Union([Type.Literal('operational'), Type.Literal('degraded'), Type.Literal('maintenance')]),
  checkedAt: Timestamp,
  services: Type.Array(
    Type.Object({
      id: Type.Union([Type.Literal('app'), Type.Literal('database'), Type.Literal('email'), Type.Literal('realtime')]),
      status: ServiceState,
    }),
  ),
  maintenance: Type.Object({ active: Type.Boolean(), until: Type.Union([Timestamp, Type.Null()]) }),
  announcement: Type.Union([Announcement, Type.Null()]),
});
export type SystemStatus = Static<typeof SystemStatus>;
