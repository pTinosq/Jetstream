import { test, expect, beforeEach, vi } from 'vitest';
import { memoryDb } from '../db/testing.ts';
import type { Db } from '../db/client.ts';
import {
  DEFAULT_OPENROUTER_MODEL,
  resolveOpenRouterConfig,
  saveOpenRouterConfig,
  clearOpenRouterConfig,
} from './openrouter.ts';

const { mockEnv } = vi.hoisted(() => {
  const mockEnv: Record<string, string | undefined> = {};
  return { mockEnv };
});
vi.mock('$env/dynamic/private', () => ({ env: mockEnv }));

let db: Db;

beforeEach(() => {
  db = memoryDb();
  for (const key of Object.keys(mockEnv)) delete mockEnv[key];
});

test('returns null when nothing is configured', () => {
  expect(resolveOpenRouterConfig(db)).toBeNull();
});

test('prefers DB config and its model', () => {
  saveOpenRouterConfig(db, 'sk-db', 'anthropic/claude-3.5-haiku');
  expect(resolveOpenRouterConfig(db)).toEqual({
    apiKey: 'sk-db',
    model: 'anthropic/claude-3.5-haiku',
    source: 'db',
  });
});

test('defaults the model when saved blank', () => {
  saveOpenRouterConfig(db, 'sk-db', '');
  expect(resolveOpenRouterConfig(db)?.model).toBe(DEFAULT_OPENROUTER_MODEL);
});

test('falls back to env when the DB has no key', () => {
  mockEnv.OPENROUTER_API_KEY = 'sk-env';
  mockEnv.OPENROUTER_MODEL = 'openai/gpt-4o';
  expect(resolveOpenRouterConfig(db)).toEqual({
    apiKey: 'sk-env',
    model: 'openai/gpt-4o',
    source: 'env',
  });
});

test('DB overrides env', () => {
  mockEnv.OPENROUTER_API_KEY = 'sk-env';
  saveOpenRouterConfig(db, 'sk-db', 'm/x');
  expect(resolveOpenRouterConfig(db)?.source).toBe('db');
});

test('clear removes the DB config', () => {
  saveOpenRouterConfig(db, 'sk-db', 'm/x');
  clearOpenRouterConfig(db);
  expect(resolveOpenRouterConfig(db)).toBeNull();
});
