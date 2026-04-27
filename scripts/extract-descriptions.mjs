#!/usr/bin/env node
// One-time extraction: parse JSDoc from packages/whisper/src/types/generated/*.ts
// into scripts/descriptions.json so codegen can emit descriptions on every run.
//
// Run once, commit the JSON, then this script is no longer needed for normal
// operation — it stays for auditing/regenerating the descriptions corpus.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GENERATED_DIR = resolve(__dirname, '../packages/whisper/src/types/generated');
const OUT_FILE = resolve(__dirname, 'descriptions.json');

/**
 * Parses a single .ts file and returns descriptions keyed by interface name.
 * Result shape: { [interfaceName]: { _description?: string, [field]: string } }
 */
function parseFile(content) {
  const lines = content.split('\n');
  const out = {};
  let i = 0;
  let pendingDoc = null;
  let currentInterface = null;
  let interfaceDepth = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('/**')) {
      const docLines = [];
      // Same-line JSDoc + field: `  /** doc */ fieldName: type;`
      // Capture the description AND the field on a single line.
      const sameLineFieldMatch = trimmed.match(
        /^\/\*\*\s*(.*?)\s*\*\/\s+(['"]?)([\w$-]+)\2\??\s*:/,
      );
      if (sameLineFieldMatch && currentInterface && interfaceDepth === 1) {
        out[currentInterface][sameLineFieldMatch[3]] = sameLineFieldMatch[1];
        pendingDoc = null;
        i++;
        continue;
      }
      // Single-line: /** xxx */
      const singleMatch = trimmed.match(/^\/\*\*\s*(.*?)\s*\*\/$/);
      if (singleMatch) {
        pendingDoc = singleMatch[1];
        i++;
        continue;
      }
      // Multi-line — collect until closing */
      i++;
      while (i < lines.length && !lines[i].trim().endsWith('*/')) {
        const inner = lines[i].trim().replace(/^\*\s?/, '');
        docLines.push(inner);
        i++;
      }
      // Last line: strip trailing */ first, then leading * (order matters
      // — otherwise " */" → "/" because the leading * regex consumes the
      // star before the closer regex sees it).
      if (i < lines.length) {
        const last = lines[i]
          .trim()
          .replace(/\s*\*\/\s*$/, '')
          .replace(/^\*\s?/, '');
        if (last) docLines.push(last);
        i++;
      }
      pendingDoc = docLines.join('\n').trim();
      continue;
    }

    const interfaceMatch = trimmed.match(/^export interface (\w+) \{/);
    if (interfaceMatch) {
      currentInterface = interfaceMatch[1];
      out[currentInterface] = {};
      if (pendingDoc) {
        out[currentInterface]._description = pendingDoc;
        pendingDoc = null;
      }
      interfaceDepth = 1;
      i++;
      continue;
    }

    if (currentInterface) {
      // Track brace depth to know when interface ends.
      // Field declarations are at depth 1.
      const opens = (line.match(/\{/g) || []).length;
      const closes = (line.match(/\}/g) || []).length;

      // Field: only consider lines that look like top-level fields (depth 1, before opens).
      if (interfaceDepth === 1 && pendingDoc) {
        const fieldMatch = line.match(/^\s+(['"]?)([\w$-]+)\1\??\s*:/);
        if (fieldMatch) {
          out[currentInterface][fieldMatch[2]] = pendingDoc;
          pendingDoc = null;
        }
      }

      interfaceDepth += opens - closes;
      if (interfaceDepth <= 0) {
        currentInterface = null;
        interfaceDepth = 0;
      }
    }

    pendingDoc = null;
    i++;
  }

  return out;
}

const result = {};
const files = readdirSync(GENERATED_DIR).filter((f) => f.endsWith('.ts') && f !== 'index.ts');
for (const file of files) {
  const game = file.replace(/\.ts$/, '');
  const content = readFileSync(join(GENERATED_DIR, file), 'utf8');
  const parsed = parseFile(content);
  // Prefix with game name so identical interface names across games don't collide
  // (e.g. `BannedChampion` exists in both lol.ts and tft.ts).
  for (const [name, doc] of Object.entries(parsed)) {
    result[`${game}.${name}`] = doc;
  }
}

// Sort keys alphabetically for deterministic output.
const sorted = {};
for (const k of Object.keys(result).sort()) {
  const inner = result[k];
  const innerSorted = {};
  if (inner._description) innerSorted._description = inner._description;
  for (const fk of Object.keys(inner)
    .filter((x) => x !== '_description')
    .sort()) {
    innerSorted[fk] = inner[fk];
  }
  sorted[k] = innerSorted;
}

writeFileSync(OUT_FILE, `${JSON.stringify(sorted, null, 2)}\n`);

const interfaceCount = Object.keys(sorted).length;
const fieldCount = Object.values(sorted).reduce(
  (sum, x) => sum + Object.keys(x).filter((k) => k !== '_description').length,
  0,
);
const interfaceDocs = Object.values(sorted).filter((x) => x._description).length;
console.log(
  `Extracted ${interfaceCount} interfaces (${interfaceDocs} with descriptions), ${fieldCount} field descriptions → ${OUT_FILE}`,
);
