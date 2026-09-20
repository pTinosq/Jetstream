import { test, expect } from 'vitest';
import { parseCompletion } from './openrouter.ts';

test('parses a plain assistant message', () => {
  const msg = parseCompletion({ choices: [{ message: { role: 'assistant', content: 'hi' } }] });
  expect(msg).toEqual({ role: 'assistant', content: 'hi', tool_calls: undefined });
});

test('parses tool calls into our flat shape', () => {
  const msg = parseCompletion({
    choices: [
      {
        message: {
          role: 'assistant',
          content: null,
          tool_calls: [
            {
              id: 'c1',
              type: 'function',
              function: { name: 'search_airports', arguments: '{"query":"LHR"}' },
            },
          ],
        },
      },
    ],
  });
  expect(msg.content).toBeNull();
  expect(msg.tool_calls).toEqual([
    { id: 'c1', name: 'search_airports', arguments: '{"query":"LHR"}' },
  ]);
});

test('throws on a malformed payload', () => {
  expect(() => parseCompletion({ choices: [] })).toThrow();
});
