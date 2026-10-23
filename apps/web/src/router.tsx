import { createRootRouteWithContext, createRoute, createRouter, redirect } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import type { Role } from '@campusmarkt/contracts';
import { meQuery } from './api/auth';
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

const searchRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/',
  validateSearch: validateSearchFilters,
  component: SearchPage,
});
const newListingRoute = createRoute({ getParentRoute: () => authRoute, path: '/listings/new', component: ListingFormPage });
const listingRoute = createRoute({ getParentRoute: () => authRoute, path: '/listings/$id', component: ListingPage });
const editListingRoute = createRoute({ getParentRoute: () => authRoute, path: '/listings/$id/edit', component: ListingFormPage });
const myListingsRoute = createRoute({ getParentRoute: () => authRoute, path: '/me/listings', component: MyListingsPage });
const favoritesRoute = createRoute({ getParentRoute: () => authRoute, path: '/me/favorites', component: FavoritesPage });
const conversationsRoute = createRoute({ getParentRoute: () => authRoute, path: '/messages', component: ConversationsPage });
const conversationRoute = createRoute({ getParentRoute: () => authRoute, path: '/messages/$id', component: ConversationPage });
const profileRoute = createRoute({ getParentRoute: () => authRoute, path: '/profile', component: ProfilePage });
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
  loginRoute,
  registerRoute,
  verifyRoute,
  forgotRoute,
  resetRoute,
  authRoute.addChildren([
    searchRoute,
    newListingRoute,
    listingRoute,
    editListingRoute,
    myListingsRoute,
    favoritesRoute,
    conversationsRoute,
    conversationRoute,
    profileRoute,
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
    scrollRestoration: true,
  });
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
