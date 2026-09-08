import { test, expect, beforeEach } from 'vitest';
import { memoryDb } from '../db/testing.ts';
import { getSetting, setSetting, deleteSetting } from './service.ts';
import {
  getOpenSkyCredentialsFromDb,
  saveOpenSkyCredentials,
  clearOpenSkyCredentials,
} from './opensky.ts';
import type { Db } from '../db/client.ts';

let db: Db;

beforeEach(() => {
  db = memoryDb();
});

test('setSetting inserts then updates the same key', () => {
  setSetting(db, 'k', 'one');
  expect(getSetting(db, 'k')).toBe('one');
  setSetting(db, 'k', 'two');
  expect(getSetting(db, 'k')).toBe('two');
});

test('getSetting returns null for a missing key', () => {
  expect(getSetting(db, 'missing')).toBeNull();
});

test('deleteSetting removes a key', () => {
  setSetting(db, 'k', 'v');
  deleteSetting(db, 'k');
  expect(getSetting(db, 'k')).toBeNull();
});

test('OpenSky credentials round-trip through the DB', () => {
  expect(getOpenSkyCredentialsFromDb(db)).toBeNull();
  saveOpenSkyCredentials(db, { clientId: 'id-123', clientSecret: 'secret-xyz' });
  expect(getOpenSkyCredentialsFromDb(db)).toEqual({
    clientId: 'id-123',
    clientSecret: 'secret-xyz',
  });
});

test('credentials are null unless both parts are present', () => {
  setSetting(db, 'opensky_client_id', 'id-only');
  expect(getOpenSkyCredentialsFromDb(db)).toBeNull();
});

test('clearOpenSkyCredentials removes both parts', () => {
  saveOpenSkyCredentials(db, { clientId: 'id', clientSecret: 'secret' });
  clearOpenSkyCredentials(db);
  expect(getOpenSkyCredentialsFromDb(db)).toBeNull();
});
