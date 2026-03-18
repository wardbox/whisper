import { writeFileSync } from 'node:fs';
import type { FieldDef, SchemaFile, TypeSchema } from './types.js';

/**
 * Extract a FieldDef from an unknown JavaScript value.
 *
 * Maps JS runtime types to schema field definitions:
 * - string -> "string"
 * - number -> "integer" (if integer) or "number" (if float)
 * - boolean -> "boolean"
 * - null -> { type: "unknown", nullable: true }
 * - array -> "array" with items from first element
 * - object -> "object" with recursive fields
 */
export function extractFieldDef(value: unknown): FieldDef {
  if (value === null) {
    return { type: 'unknown', nullable: true };
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return { type: 'array', items: { type: 'unknown' } };
    }
    // Sample multiple elements and merge to capture optional fields
    let itemDef = extractFieldDef(value[0]);
    for (let i = 1; i < Math.min(value.length, 5); i++) {
      const other = extractFieldDef(value[i]);
      if (itemDef.type === 'object' && other.type === 'object' && itemDef.fields && other.fields) {
        const merged = mergeSchemas(
          { name: '_arr', fields: itemDef.fields },
          { name: '_arr', fields: other.fields },
        );
        itemDef = { type: 'object', fields: merged.fields };
      }
    }
    return { type: 'array', items: itemDef };
  }

  if (typeof value === 'object') {
    const fields: Record<string, FieldDef> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      fields[key] = extractFieldDef(val);
    }
    return { type: 'object', fields };
  }

  if (typeof value === 'string') {
    return { type: 'string' };
  }

  if (typeof value === 'number') {
    return { type: Number.isInteger(value) ? 'integer' : 'number' };
  }

  if (typeof value === 'boolean') {
    return { type: 'boolean' };
  }

  return { type: 'unknown' };
}

/**
 * Extract a TypeSchema from a JSON response object.
 *
 * Walks all top-level fields and produces FieldDef for each.
 */
export function extractSchema(response: Record<string, unknown>, name: string): TypeSchema {
  const fields: Record<string, FieldDef> = {};
  for (const [key, val] of Object.entries(response)) {
    fields[key] = extractFieldDef(val);
  }
  return { name, fields };
}

/**
 * Merge two TypeSchemas into one, capturing optional and nullable fields.
 *
 * - Fields present in one but not the other are marked optional
 * - Fields that are null in one response but typed in the other are marked nullable
 * - Fields with the same type in both are unchanged
 */
export function mergeSchemas(existing: TypeSchema, incoming: TypeSchema): TypeSchema {
  const merged: Record<string, FieldDef> = {};
  const allKeys = new Set([...Object.keys(existing.fields), ...Object.keys(incoming.fields)]);

  for (const key of allKeys) {
    const existingField = existing.fields[key];
    const incomingField = incoming.fields[key];

    if (existingField && !incomingField) {
      // Field only in existing -- mark optional
      merged[key] = { ...existingField, optional: true };
    } else if (!existingField && incomingField) {
      // Field only in incoming -- mark optional
      merged[key] = { ...incomingField, optional: true };
    } else if (existingField && incomingField) {
      // Field in both -- check for null resolution
      if (
        existingField.type === 'unknown' &&
        existingField.nullable &&
        incomingField.type !== 'unknown'
      ) {
        // Existing was null, incoming has a type
        merged[key] = { ...incomingField, nullable: true };
      } else if (
        incomingField.type === 'unknown' &&
        incomingField.nullable &&
        existingField.type !== 'unknown'
      ) {
        // Incoming is null, existing has a type
        merged[key] = { ...existingField, nullable: true };
      } else if (existingField.type === 'object' && incomingField.type === 'object') {
        // Recursively merge nested objects
        const mergedNested = mergeSchemas(
          { name: key, fields: existingField.fields ?? {} },
          { name: key, fields: incomingField.fields ?? {} },
        );
        merged[key] = {
          ...existingField,
          fields: mergedNested.fields,
          nullable: existingField.nullable || incomingField.nullable || undefined,
        };
      } else if (existingField.type === 'array' && incomingField.type === 'array') {
        // Recursively merge array item types
        if (existingField.items?.type === 'object' && incomingField.items?.type === 'object') {
          const mergedItems = mergeSchemas(
            { name: key, fields: existingField.items.fields ?? {} },
            { name: key, fields: incomingField.items.fields ?? {} },
          );
          merged[key] = {
            ...existingField,
            items: { type: 'object', fields: mergedItems.fields },
          };
        } else if (existingField.items?.type === 'unknown' && incomingField.items) {
          // Existing items unknown, incoming has concrete type — prefer incoming
          merged[key] = { ...existingField, items: incomingField.items };
        } else if (incomingField.items?.type === 'unknown' && existingField.items) {
          // Incoming items unknown, existing has concrete type — keep existing
          merged[key] = { ...existingField };
        } else {
          merged[key] = { ...existingField };
        }
      } else {
        // Same type in both -- keep existing
        merged[key] = { ...existingField };
      }
    }
  }

  return { name: existing.name, fields: merged };
}

/**
 * Recursively sort object keys alphabetically for deterministic JSON output.
 *
 * - Objects: keys sorted alphabetically, values recursed
 * - Arrays: each element recursed
 * - Primitives: passed through unchanged
 */
export function sortKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(sortKeys);
  }

  if (obj !== null && typeof obj === 'object') {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(obj as Record<string, unknown>).sort()) {
      sorted[key] = sortKeys((obj as Record<string, unknown>)[key]);
    }
    return sorted;
  }

  return obj;
}

/**
 * Write a SchemaFile to disk with deterministic key ordering.
 *
 * Uses sortKeys to ensure stable git diffs, then writes with 2-space indent
 * and a trailing newline.
 */
export function writeSchemaFile(filePath: string, schema: SchemaFile): void {
  const sorted = sortKeys(schema);
  writeFileSync(filePath, `${JSON.stringify(sorted, null, 2)}\n`);
}
