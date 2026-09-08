import type { Db } from '../db/client.ts';
import { getSetting, setSetting } from './service.ts';

const GITHUB_CLIENT_ID = 'github_client_id';
const GITHUB_CLIENT_SECRET = 'github_client_secret';
const AUTH_SECRET = 'auth_secret';
const OWNER_GITHUB_ID = 'owner_github_id';

export interface GitHubOAuth {
  clientId: string;
  clientSecret: string;
}

export function getGitHubOAuth(db: Db): GitHubOAuth | null {
  const clientId = getSetting(db, GITHUB_CLIENT_ID);
  const clientSecret = getSetting(db, GITHUB_CLIENT_SECRET);
  if (clientId === null || clientSecret === null) return null;
  return { clientId, clientSecret };
}

export function saveGitHubOAuth(db: Db, oauth: GitHubOAuth): void {
  setSetting(db, GITHUB_CLIENT_ID, oauth.clientId);
  setSetting(db, GITHUB_CLIENT_SECRET, oauth.clientSecret);
}

/** Auth (and thus login) is available only once GitHub OAuth is configured. */
export function isAuthConfigured(db: Db): boolean {
  return getGitHubOAuth(db) !== null;
}

/** A stable session-signing secret, generated and persisted on first use. */
export function getOrCreateAuthSecret(db: Db): string {
  const existing = getSetting(db, AUTH_SECRET);
  if (existing !== null) return existing;
  const secret = `${crypto.randomUUID()}${crypto.randomUUID()}`.replaceAll('-', '');
  setSetting(db, AUTH_SECRET, secret);
  return secret;
}

export function getOwnerGitHubId(db: Db): string | null {
  return getSetting(db, OWNER_GITHUB_ID);
}

/**
 * Enforce single-owner access: the first GitHub account to sign in claims the
 * instance; afterwards only that account is authorized. Returns whether the
 * given account may sign in.
 */
export function claimOrCheckOwner(db: Db, githubId: string): boolean {
  const owner = getSetting(db, OWNER_GITHUB_ID);
  if (owner === null) {
    setSetting(db, OWNER_GITHUB_ID, githubId);
    return true;
  }
  return owner === githubId;
}
