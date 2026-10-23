/**
 * Endpunkt-Übersicht der REST-API (Präfix `/api/v1`). Maßgeblich sind die TypeBox-Schemas;
 * die vollständige OpenAPI-3.1-Spezifikation erzeugt der Server unter `/api/docs/json`.
 *
 * Konventionen (ADR-0009):
 * - Authentifizierung über das Session-Cookie `cm_session` (HttpOnly). Requests mit `credentials: 'same-origin'`.
 * - Jeder zustandsändernde Request (POST/PUT/PATCH/DELETE) MUSS den Header `x-campusmarkt-csrf: 1` senden.
 * - Fehler als RFC 9457 Problem Details (`application/problem+json`) mit stabilem `code`.
 * - 401 `unauthenticated`, 403 `forbidden`, 404 `not_found` (auch für fremde Ressourcen), 429 `rate_limited`.
 */
export const ROUTES = {
  // Meta
  meta: 'GET /meta → Meta (öffentlich)',

  // identity
  register: 'POST /auth/register RegisterBody → 202 Accepted (immer neutral, REQ-AUTH-004)',
  verify: 'POST /auth/verify TokenBody → 200 Me + Cookie | 400 code token_expired | token_invalid | token_used',
  resendVerification: 'POST /auth/resend-verification EmailBody → 202 Accepted',
  login: 'POST /auth/login LoginBody → 200 Me + Cookie | 401 invalid_credentials | 403 account_suspended',
  logout: 'POST /auth/logout → 204',
  resetRequest: 'POST /auth/password-reset/request EmailBody → 202 Accepted',
  resetConfirm: 'POST /auth/password-reset/confirm ResetConfirmBody → 204 | 400 token_invalid | weak_password',
  me: 'GET /me → Me | 401',
  updateMe: 'PATCH /me UpdateMeBody → Me',
  exportMe: 'GET /me/export → JSON-Datei (Content-Disposition attachment)',
  deleteMe: 'POST /me/delete DeleteAccountBody → 202 Accepted (14 Tage Karenz, Abbruch durch Login)',

  // listings
  search: 'GET /listings SearchQuery → SearchResult',
  listing: 'GET /listings/:id → ListingDetail',
  createListing: 'POST /listings CreateListingBody → 201 ListingDetail (status active | in_review) | 422 listing_limit',
  updateListing: 'PATCH /listings/:id UpdateListingBody → ListingDetail',
  listingAction: 'POST /listings/:id/status ListingActionBody → ListingDetail | 409 invalid_transition',
  deleteListing: 'DELETE /listings/:id → 204',
  myListings: 'GET /me/listings → ListingCard[]',
  upload: 'POST /uploads multipart/form-data, Feld "files" (1–8 Dateien, je ≤ 10 MB) → 201 UploadResult',
  media: 'GET /media/:imageId/:size (sm|md|lg) → image/webp (nur mit Session)',
  favorites: 'GET /me/favorites → ListingCard[]',
  addFavorite: 'PUT /listings/:id/favorite → 204',
  removeFavorite: 'DELETE /listings/:id/favorite → 204',

  // messaging
  conversations: 'GET /conversations → ConversationSummary[]',
  startConversation: 'POST /conversations StartConversationBody → 201 StartConversationResult | 403 contact_not_possible',
  conversation: 'GET /conversations/:id → ConversationSummary',
  messages: 'GET /conversations/:id/messages MessagesQuery → Message[] (aufsteigend nach Zeit)',
  sendMessage: 'POST /conversations/:id/messages SendMessageBody → 201 Message (idempotent über clientMsgId)',
  markRead: 'POST /conversations/:id/read → 204',
  deal: 'POST /conversations/:id/deal DealActionBody → Deal (nur Anbieter)',
  contact: 'POST /conversations/:id/contact ContactActionBody → ContactShare | 403 contact_not_possible | 429 contact_request_limit | 409 invalid_contact_action (REQ-CHAT-010)',
  unread: 'GET /me/unread → UnreadCount',
  websocket: 'GET /ws (WebSocket) – siehe ServerEvent / ClientEvent',

  // trust
  report: 'POST /reports CreateReportBody → 201 { id }',
  blocks: 'GET /me/blocks → BlockedUser[]',
  block: 'PUT /users/:id/block → 204',
  unblock: 'DELETE /users/:id/block → 204',
  moderationQueue: 'GET /moderation/cases?status=open|decided → ModerationCase[] (Rolle moderator/admin)',
  decide: 'POST /moderation/cases/:id/decision DecisionBody → 204',

  // admin
  adminUsers: 'GET /admin/users?q= → AdminUser[] (Rolle admin)',
  setRole: 'POST /admin/users/:id/role SetRoleBody → 204',
  audit: 'GET /admin/audit → AuditEntry[] (Rolle admin)',
  jobs: 'GET /admin/jobs → JobOverview (Rolle admin)',
  runDueJobs: 'POST /admin/demo/run-due-jobs → 202 Accepted (nur DEMO_MODE=true)',
} as const;
