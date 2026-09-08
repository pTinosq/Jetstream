import { SvelteKitAuth, type SvelteKitAuthConfig } from '@auth/sveltekit';
import GitHub from '@auth/sveltekit/providers/github';
import { z } from 'zod';
import { getDb } from './db/index.ts';
import { claimOrCheckOwner, getGitHubOAuth, getOrCreateAuthSecret } from './settings/auth.ts';

const githubProfileSchema = z.object({ id: z.union([z.string(), z.number()]) });

/**
 * Auth.js configured dynamically from the DB so GitHub OAuth can be set up from
 * the app (no env needed). Single-owner: the first account to sign in claims
 * the instance (enforced in the signIn callback); everyone else is refused.
 */
export const {
  handle: authHandle,
  signIn,
  signOut,
} = SvelteKitAuth((): Promise<SvelteKitAuthConfig> => {
  const db = getDb();
  const oauth = getGitHubOAuth(db);
  return Promise.resolve({
    trustHost: true,
    secret: getOrCreateAuthSecret(db),
    providers:
      oauth === null
        ? []
        : [GitHub({ clientId: oauth.clientId, clientSecret: oauth.clientSecret })],
    callbacks: {
      signIn({ profile }) {
        const parsed = githubProfileSchema.safeParse(profile);
        if (!parsed.success) return false;
        return claimOrCheckOwner(getDb(), String(parsed.data.id));
      },
    },
  });
});
