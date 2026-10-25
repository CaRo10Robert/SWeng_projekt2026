import { createRootRouteWithContext, createRoute, createRouter, redirect } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import type { Role } from '@campusmarkt/contracts';
import { meQuery, useMe } from './api/auth';
import { Layout, NotFound, RouteError } from './components/Layout';
import { LoginPage, RegisterPage, VerifyPage, ForgotPasswordPage, ResetPasswordPage } from './routes/auth';
import { SearchPage, validateSearchFilters } from './routes/search';
import { ListingPage } from './routes/listing';
import { ListingFormPage } from './routes/listing-form';
import { MyListingsPage, FavoritesPage } from './routes/my-listings';
import { ConversationsPage, ConversationPage } from './routes/messages';
import { ProfilePage } from './routes/profile';
import { ModerationPage } from './routes/moderation';
import { AdminPage } from './routes/admin';
import { HomePage } from './routes/home';
import { HelpPage, LegalPage } from './routes/legal';
import { NoticesPage, TokenAppealPage } from './routes/notices';
import { StatusPage } from './routes/status';
import { Loading } from './components/ui';

interface RouterContext {
  queryClient: QueryClient;
}

const optionalString = (v: unknown) => (typeof v === 'string' && v ? v : undefined);

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: Layout,
  notFoundComponent: NotFound,
});

// Öffentliche Seiten
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => ({ redirect: optionalString(s.redirect) }),
  component: LoginPage,
});
const registerRoute = createRoute({ getParentRoute: () => rootRoute, path: '/register', component: RegisterPage });
const verifyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/verify',
  validateSearch: (s: Record<string, unknown>): { token?: string } => ({ token: optionalString(s.token) }),
  component: VerifyPage,
});
const forgotRoute = createRoute({ getParentRoute: () => rootRoute, path: '/forgot-password', component: ForgotPasswordPage });
const resetRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reset-password',
  validateSearch: (s: Record<string, unknown>): { token?: string } => ({ token: optionalString(s.token) }),
  component: ResetPasswordPage,
});

// Rechtsseiten, Hilfe und Status: ohne Anmeldung erreichbar (REQ-LEGAL-001…005, REQ-UX-005, REQ-OPS-007).
// Jede Route muss auch in apps/server/src/platform/http/spa-routes.ts stehen, sonst liefert der Server 404.
const impressumRoute = createRoute({ getParentRoute: () => rootRoute, path: '/impressum', component: () => <LegalPage name="impressum" /> });
const datenschutzRoute = createRoute({ getParentRoute: () => rootRoute, path: '/datenschutz', component: () => <LegalPage name="datenschutz" /> });
const termsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/nutzungsbedingungen',
  component: () => <LegalPage name="nutzungsbedingungen" />,
});
const communityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/community-regeln',
  component: () => <LegalPage name="community-regeln" />,
});
const accessibilityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/barrierefreiheit',
  component: () => <LegalPage name="barrierefreiheit" />,
});
const contactRoute = createRoute({ getParentRoute: () => rootRoute, path: '/kontakt', component: () => <LegalPage name="kontakt" /> });
const helpRoute = createRoute({ getParentRoute: () => rootRoute, path: '/hilfe', component: HelpPage });
const statusRoute = createRoute({ getParentRoute: () => rootRoute, path: '/status', component: StatusPage });
const tokenAppealRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/widerspruch',
  validateSearch: (s: Record<string, unknown>): { token?: string } => ({ token: optionalString(s.token) }),
  component: function TokenAppealRoute() {
    const { token } = tokenAppealRoute.useSearch();
    return <TokenAppealPage token={token} />;
  },
});

/** Startseite: Gäste sehen die Einführung (REQ-UX-004), Mitglieder direkt die Suche. */
function IndexPage() {
  const { data: me, isPending } = useMe();
  if (isPending) return <Loading />;
  return me ? <SearchPage /> : <HomePage />;
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: validateSearchFilters,
  beforeLoad: ({ context }) => context.queryClient.ensureQueryData(meQuery),
  component: IndexPage,
});

// Nur für angemeldete Mitglieder
const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'auth',
  beforeLoad: async ({ context, location }) => {
    const me = await context.queryClient.ensureQueryData(meQuery);
    if (!me) throw redirect({ to: '/login', search: { redirect: location.href } });
    return { me };
  },
});

function requireRole(roles: Role[]) {
  return ({ context }: { context: { me: { role: Role } } }) => {
    if (!roles.includes(context.me.role)) throw redirect({ to: '/' });
  };
}

const newListingRoute = createRoute({ getParentRoute: () => authRoute, path: '/listings/new', component: ListingFormPage });
const listingRoute = createRoute({ getParentRoute: () => authRoute, path: '/listings/$id', component: ListingPage });
const editListingRoute = createRoute({ getParentRoute: () => authRoute, path: '/listings/$id/edit', component: ListingFormPage });
const myListingsRoute = createRoute({ getParentRoute: () => authRoute, path: '/me/listings', component: MyListingsPage });
const favoritesRoute = createRoute({ getParentRoute: () => authRoute, path: '/me/favorites', component: FavoritesPage });
const conversationsRoute = createRoute({ getParentRoute: () => authRoute, path: '/messages', component: ConversationsPage });
const conversationRoute = createRoute({ getParentRoute: () => authRoute, path: '/messages/$id', component: ConversationPage });
const profileRoute = createRoute({ getParentRoute: () => authRoute, path: '/profile', component: ProfilePage });
const noticesRoute = createRoute({ getParentRoute: () => authRoute, path: '/me/notices', component: NoticesPage });
const moderationRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/moderation',
  beforeLoad: requireRole(['moderator', 'admin']),
  component: ModerationPage,
});
const adminRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/admin',
  beforeLoad: requireRole(['admin']),
  component: AdminPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  impressumRoute,
  datenschutzRoute,
  termsRoute,
  communityRoute,
  accessibilityRoute,
  contactRoute,
  helpRoute,
  statusRoute,
  tokenAppealRoute,
  loginRoute,
  registerRoute,
  verifyRoute,
  forgotRoute,
  resetRoute,
  authRoute.addChildren([
    newListingRoute,
    listingRoute,
    editListingRoute,
    myListingsRoute,
    favoritesRoute,
    conversationsRoute,
    conversationRoute,
    profileRoute,
    noticesRoute,
    moderationRoute,
    adminRoute,
  ]),
]);

export function createAppRouter(queryClient: QueryClient) {
  return createRouter({
    routeTree,
    context: { queryClient },
    defaultErrorComponent: RouteError,
    defaultPreload: 'intent',
    // Keine Scroll-Wiederherstellung des Routers: sie speichert Positionen im sessionStorage, das nicht in der
    // Allowlist der zulässigen Speicherungen steht (REQ-LEGAL-010, e2e/storage-allowlist.json)
    scrollRestoration: false,
  });
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
