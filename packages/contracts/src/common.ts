import { Type, type Static, type TSchema } from '@sinclair/typebox';

export const Uuid = Type.String({ format: 'uuid' });
export const Timestamp = Type.String({ format: 'date-time' });

/** RFC 9457 Problem Details. `code` ist ein stabiler, maschinenlesbarer Fehlercode. */
export const Problem = Type.Object({
  type: Type.String(),
  title: Type.String(),
  status: Type.Integer(),
  detail: Type.Optional(Type.String()),
  code: Type.Optional(Type.String()),
  errors: Type.Optional(Type.Array(Type.Object({ path: Type.String(), message: Type.String() }))),
});
export type Problem = Static<typeof Problem>;

export const Accepted = Type.Object({ message: Type.String() });
export type Accepted = Static<typeof Accepted>;

export const Page = <T extends TSchema>(item: T) =>
  Type.Object({
    items: Type.Array(item),
    nextCursor: Type.Union([Type.String(), Type.Null()]),
  });

export const IdParams = Type.Object({ id: Uuid });
export type IdParams = Static<typeof IdParams>;

/** Header, den die SPA bei jedem zustandsändernden Request sendet (CSRF-Schutz über Custom Header). */
export const CSRF_HEADER = 'x-campusmarkt-csrf';
export const API_PREFIX = '/api/v1';
