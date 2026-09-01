import { test } from 'node:test';
import assert from 'node:assert/strict';
import { greet } from './index.ts';

test('greet returns a greeting', () => {
  assert.equal(greet('world'), 'Hello, world!');
});
