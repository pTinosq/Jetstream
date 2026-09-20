import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { authHandle } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { ensureAirportsSeeded } from '$lib/server/airports/ensure-seeded';
import { isAuthConfigured } from '$lib/server/settings/auth';

const isAuthRoute = (path: string): boolean => /^\/auth(\/|$)/.test(path);
const isSetupRoute = (path: string): boolean => /^\/setup(\/|$)/.test(path);
const isLoginRoute = (path: string): boolean => /^\/login(\/|$)/.test(path);

/**
 * Gate the app: force first-run setup until GitHub OAuth is configured, then
 * require a signed-in (owner) session for everything except the auth/login
 * routes.
 */
const guard: Handle = async ({ event, resolve }) => {
  const path = event.url.pathname;

  // First-run convenience: seed airport data if the table is empty. Fire and
  // forget — never blocks the request, idempotent, and no-ops once populated.
  void ensureAirportsSeeded(getDb());

  if (!isAuthConfigured(getDb())) {
    // Not set up yet: everything funnels to /setup (auth routes stay reachable).
    if (!isSetupRoute(path) && !isAuthRoute(path)) redirect(303, '/setup');
    return resolve(event);
  }

  // Configured: lock the first-run setup page.
  if (isSetupRoute(path)) redirect(303, '/');

  const session = await event.locals.auth();
  if (session === null && !isAuthRoute(path) && !isLoginRoute(path)) redirect(303, '/login');
  if (session !== null && isLoginRoute(path)) redirect(303, '/');

  return resolve(event);
};

export const handle = sequence(authHandle, guard);
