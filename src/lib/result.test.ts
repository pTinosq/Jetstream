import { test, expect } from 'vitest';
import { ok, err } from './result.ts';

test('ok wraps a value', () => {
  const r = ok(42);
  expect(r.ok).toBe(true);
  if (r.ok) {
    expect(r.value).toBe(42);
  }
});

test('err wraps an error', () => {
  const r = err(new Error('boom'));
  expect(r.ok).toBe(false);
  if (!r.ok) {
    expect(r.error.message).toBe('boom');
  }
});
