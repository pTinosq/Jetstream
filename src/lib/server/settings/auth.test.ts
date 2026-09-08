import { test, expect, beforeEach } from 'vitest';
import { memoryDb } from '../db/testing.ts';
import {
  getGitHubOAuth,
  saveGitHubOAuth,
  isAuthConfigured,
  getOrCreateAuthSecret,
  claimOrCheckOwner,
  getOwnerGitHubId,
} from './auth.ts';
import type { Db } from '../db/client.ts';

let db: Db;

beforeEach(() => {
  db = memoryDb();
});

test('GitHub OAuth round-trips and drives isAuthConfigured', () => {
  expect(isAuthConfigured(db)).toBe(false);
  saveGitHubOAuth(db, { clientId: 'cid', clientSecret: 'csecret' });
  expect(getGitHubOAuth(db)).toEqual({ clientId: 'cid', clientSecret: 'csecret' });
  expect(isAuthConfigured(db)).toBe(true);
});

test('auth secret is generated once and stays stable', () => {
  const first = getOrCreateAuthSecret(db);
  expect(first.length).toBeGreaterThanOrEqual(32);
  expect(getOrCreateAuthSecret(db)).toBe(first);
});

test('first sign-in claims ownership', () => {
  expect(getOwnerGitHubId(db)).toBeNull();
  expect(claimOrCheckOwner(db, '111')).toBe(true);
  expect(getOwnerGitHubId(db)).toBe('111');
});

test('the same owner is allowed, others are refused', () => {
  claimOrCheckOwner(db, '111');
  expect(claimOrCheckOwner(db, '111')).toBe(true);
  expect(claimOrCheckOwner(db, '222')).toBe(false);
});
