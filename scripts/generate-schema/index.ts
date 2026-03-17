#!/usr/bin/env tsx
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '../../packages/whisper/src/core/client.js';
import { generateInterfaces } from './codegen.js';
import { discoverData } from './discovery.js';
import { ENDPOINT_REGISTRY } from './registry.js';
import { extractSchema, mergeSchemas, writeSchemaFile } from './schema.js';
import type { SchemaFile } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SCHEMAS_DIR = path.resolve(__dirname, '../schemas');
const GENERATED_DIR = path.resolve(__dirname, '../../packages/whisper/src/types/generated');
const OVERRIDES_DIR = path.resolve(__dirname, '../../packages/whisper/src/types/overrides');

const args = process.argv.slice(2);
const discoveryOnly = args.includes('--discovery-only');

async function main() {
  // 1. Validate env
  const apiKey = process.env.RIOT_API_KEY;
  if (!apiKey) {
    console.error('Error: RIOT_API_KEY environment variable is required');
    process.exit(1);
  }

  // 2. Create client (dog-food Whisper's own client with rate limiting enabled, cache disabled)
  let requestCount = 0;
  const client = createClient({
    apiKey,
    cache: false,
    rateLimiter: {
      onRateLimit: (scope, retryAfter) => {
        console.log(`  [rate-limiter] Queued on ${scope}, waiting ${retryAfter}ms`);
      },
    },
    middleware: [
      {
        onRequest: (ctx) => {
          requestCount++;
          return ctx;
        },
      },
    ],
  });

  // 3. Ensure output directories exist
  fs.mkdirSync(SCHEMAS_DIR, { recursive: true });
  fs.mkdirSync(GENERATED_DIR, { recursive: true });

  // 4. Dynamic discovery
  console.log('Discovering test data...');
  const data = await discoverData(client);
  console.log(`Discovered: puuid=${data.puuid?.slice(0, 8)}..., matchId=${data.matchId || 'none'}`);

  if (discoveryOnly) {
    console.log('--discovery-only: stopping after discovery.');
    return;
  }

  // 5. Hit endpoints and extract schemas
  console.log(`Processing ${ENDPOINT_REGISTRY.length} API groups...`);
  for (const group of ENDPOINT_REGISTRY) {
    const schemaFile: SchemaFile = {
      $schema: 'whisper-schema-v1',
      group: `${group.game}.${group.name}`,
      source: 'live',
      types: {},
    };

    const route = group.routing === 'platform' ? 'na1' : 'americas';

    // Build game-specific param map so each game uses its own puuids and match IDs
    const gameParams: Record<string, string | undefined> = {
      puuid: data.puuid,
      gameName: data.gameName,
      tagLine: data.tagLine,
      matchId: data.matchId,
    };
    if (group.game === 'tft') {
      gameParams.puuid = data.tftPuuid || data.puuid;
      gameParams.matchId = data.tftMatchId;
    } else if (group.game === 'lor') {
      gameParams.puuid = data.lorPuuid || data.puuid;
      gameParams.matchId = data.lorMatchId;
    } else if (group.game === 'val') {
      gameParams.actId = data.valActId;
    }

    for (const endpoint of group.endpoints) {
      // Substitute path params from discovered data
      let resolvedPath = endpoint.path;
      let skip = false;
      for (const param of endpoint.params ?? []) {
        const value = gameParams[param];
        if (!value) {
          console.warn(`  Skipping ${endpoint.methodId}: missing param '${param}'`);
          skip = true;
          break;
        }
        resolvedPath = resolvedPath.replace(`{${param}}`, encodeURIComponent(String(value)));
      }
      if (skip) continue;

      try {
        console.log(`  ${endpoint.methodId}...`);
        const response = await client.request(route, resolvedPath, endpoint.methodId);
        const responseData = response.data;

        if (responseData === null || responseData === undefined) {
          console.warn(`  ${endpoint.methodId}: empty response, skipping`);
          continue;
        }

        // Extract schema from response
        const rawName = endpoint.responseName;
        if (endpoint.isArray && Array.isArray(responseData)) {
          if (
            responseData.length > 0 &&
            typeof responseData[0] === 'object' &&
            responseData[0] !== null
          ) {
            const schema = extractSchema(responseData[0] as Record<string, unknown>, rawName);
            // Merge with additional array items for better coverage
            let merged = schema;
            for (let i = 1; i < Math.min(responseData.length, 5); i++) {
              if (typeof responseData[i] === 'object' && responseData[i] !== null) {
                const additional = extractSchema(
                  responseData[i] as Record<string, unknown>,
                  rawName,
                );
                merged = mergeSchemas(merged, additional);
              }
            }
            schemaFile.types[rawName] = merged.fields;
          }
        } else if (typeof responseData === 'object' && !Array.isArray(responseData)) {
          const schema = extractSchema(responseData as Record<string, unknown>, rawName);
          schemaFile.types[rawName] = schema.fields;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`  ${endpoint.methodId}: ${message}`);
      }
    }

    // Write schema file if we got any types
    if (Object.keys(schemaFile.types).length > 0) {
      const filePath = path.join(SCHEMAS_DIR, `${group.game}.${group.name}.schema.json`);
      writeSchemaFile(filePath, schemaFile);
      console.log(`  Wrote ${filePath}`);
    }
  }

  // 6. Generate TypeScript interfaces from schema files
  console.log('Generating TypeScript interfaces...');
  generateInterfaces(SCHEMAS_DIR, GENERATED_DIR, OVERRIDES_DIR);
  console.log(`Done. ${requestCount} API requests made.`);
}

main().catch((err) => {
  console.error('Schema generation failed:', err);
  process.exit(1);
});
