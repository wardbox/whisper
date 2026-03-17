import { describe, expect, it } from 'vitest';
import { extractSchema, mergeSchemas, sortKeys } from './schema.js';

describe('extractSchema', () => {
  it('extracts string fields', () => {
    const result = extractSchema({ puuid: 'abc' }, 'Test');
    expect(result.fields.puuid).toEqual({ type: 'string' });
  });

  it('extracts integer fields', () => {
    const result = extractSchema({ profileIconId: 123 }, 'Test');
    expect(result.fields.profileIconId).toEqual({ type: 'integer' });
  });

  it('extracts number (float) fields', () => {
    const result = extractSchema({ winRate: 0.55 }, 'Test');
    expect(result.fields.winRate).toEqual({ type: 'number' });
  });

  it('extracts boolean fields', () => {
    const result = extractSchema({ active: true }, 'Test');
    expect(result.fields.active).toEqual({ type: 'boolean' });
  });

  it('extracts null fields as unknown nullable', () => {
    const result = extractSchema({ name: null }, 'Test');
    expect(result.fields.name).toEqual({ type: 'unknown', nullable: true });
  });

  it('extracts array of integers', () => {
    const result = extractSchema({ items: [1, 2, 3] }, 'Test');
    expect(result.fields.items).toEqual({
      type: 'array',
      items: { type: 'integer' },
    });
  });

  it('extracts array of objects', () => {
    const result = extractSchema({ entries: [{ id: 1, name: 'a' }] }, 'Test');
    expect(result.fields.entries).toEqual({
      type: 'array',
      items: {
        type: 'object',
        fields: {
          id: { type: 'integer' },
          name: { type: 'string' },
        },
      },
    });
  });

  it('extracts empty array as unknown items', () => {
    const result = extractSchema({ tags: [] }, 'Test');
    expect(result.fields.tags).toEqual({
      type: 'array',
      items: { type: 'unknown' },
    });
  });

  it('extracts nested objects recursively', () => {
    const result = extractSchema({ nested: { a: 1, b: 'x' } }, 'Test');
    expect(result.fields.nested).toEqual({
      type: 'object',
      fields: {
        a: { type: 'integer' },
        b: { type: 'string' },
      },
    });
  });

  it('extracts empty object', () => {
    const result = extractSchema({}, 'Test');
    expect(result.fields).toEqual({});
  });

  it('handles multiple fields of different types', () => {
    const result = extractSchema({ puuid: 'abc', profileIconId: 123, active: true }, 'Test');
    expect(result.name).toBe('Test');
    expect(result.fields.puuid).toEqual({ type: 'string' });
    expect(result.fields.profileIconId).toEqual({ type: 'integer' });
    expect(result.fields.active).toEqual({ type: 'boolean' });
  });

  it('sets the name on the result', () => {
    const result = extractSchema({ a: 1 }, 'SummonerDTO');
    expect(result.name).toBe('SummonerDTO');
  });
});

describe('mergeSchemas', () => {
  it('marks field as optional when present in one but not other', () => {
    const a = extractSchema({ x: 1, y: 2 }, 'Test');
    const b = extractSchema({ x: 3 }, 'Test');
    const merged = mergeSchemas(a, b);
    expect(merged.fields.x).toEqual({ type: 'integer' });
    expect(merged.fields.y).toEqual({ type: 'integer', optional: true });
  });

  it('marks field as optional when new field only in incoming', () => {
    const a = extractSchema({ x: 1 }, 'Test');
    const b = extractSchema({ x: 3, z: 'new' }, 'Test');
    const merged = mergeSchemas(a, b);
    expect(merged.fields.x).toEqual({ type: 'integer' });
    expect(merged.fields.z).toEqual({ type: 'string', optional: true });
  });

  it('resolves null in one response with type in other as nullable', () => {
    const a = extractSchema({ name: null }, 'Test');
    const b = extractSchema({ name: 'hello' }, 'Test');
    const merged = mergeSchemas(a, b);
    expect(merged.fields.name).toEqual({ type: 'string', nullable: true });
  });

  it('resolves type in existing with null in incoming as nullable', () => {
    const a = extractSchema({ name: 'hello' }, 'Test');
    const b = extractSchema({ name: null }, 'Test');
    const merged = mergeSchemas(a, b);
    expect(merged.fields.name).toEqual({ type: 'string', nullable: true });
  });

  it('keeps unchanged fields when both have same type', () => {
    const a = extractSchema({ id: 1 }, 'Test');
    const b = extractSchema({ id: 2 }, 'Test');
    const merged = mergeSchemas(a, b);
    expect(merged.fields.id).toEqual({ type: 'integer' });
  });

  it('preserves name from existing schema', () => {
    const a = extractSchema({ x: 1 }, 'Original');
    const b = extractSchema({ x: 2 }, 'Incoming');
    const merged = mergeSchemas(a, b);
    expect(merged.name).toBe('Original');
  });

  it('recursively merges nested objects', () => {
    const a = extractSchema({ meta: { x: 1 } }, 'Test');
    const b = extractSchema({ meta: { x: 2, y: 'new' } }, 'Test');
    const merged = mergeSchemas(a, b);
    expect(merged.fields.meta.type).toBe('object');
    expect(merged.fields.meta.fields?.x).toEqual({ type: 'integer' });
    expect(merged.fields.meta.fields?.y).toEqual({ type: 'string', optional: true });
  });

  it('recursively merges array item objects', () => {
    const a = extractSchema({ items: [{ a: 1 }] }, 'Test');
    const b = extractSchema({ items: [{ a: 2, b: 'x' }] }, 'Test');
    const merged = mergeSchemas(a, b);
    expect(merged.fields.items.type).toBe('array');
    expect(merged.fields.items.items?.fields?.a).toEqual({ type: 'integer' });
    expect(merged.fields.items.items?.fields?.b).toEqual({ type: 'string', optional: true });
  });
});

describe('sortKeys', () => {
  it('sorts object keys alphabetically', () => {
    const input = { z: 1, a: 2, m: 3 };
    const result = sortKeys(input) as Record<string, unknown>;
    expect(Object.keys(result)).toEqual(['a', 'm', 'z']);
  });

  it('sorts nested objects recursively', () => {
    const input = { b: { z: 1, a: 2 }, a: 3 };
    const result = sortKeys(input) as Record<string, unknown>;
    expect(Object.keys(result)).toEqual(['a', 'b']);
    expect(Object.keys(result.b as Record<string, unknown>)).toEqual(['a', 'z']);
  });

  it('handles arrays by mapping through sortKeys', () => {
    const input = [
      { z: 1, a: 2 },
      { y: 3, b: 4 },
    ];
    const result = sortKeys(input) as Record<string, unknown>[];
    expect(Object.keys(result[0])).toEqual(['a', 'z']);
    expect(Object.keys(result[1])).toEqual(['b', 'y']);
  });

  it('passes primitives through unchanged', () => {
    expect(sortKeys(42)).toBe(42);
    expect(sortKeys('hello')).toBe('hello');
    expect(sortKeys(true)).toBe(true);
    expect(sortKeys(null)).toBe(null);
  });

  it('produces deterministic JSON regardless of input key order', () => {
    const a = { z: 1, a: { c: 3, b: 2 } };
    const b = { a: { b: 2, c: 3 }, z: 1 };
    expect(JSON.stringify(sortKeys(a))).toBe(JSON.stringify(sortKeys(b)));
  });
});
