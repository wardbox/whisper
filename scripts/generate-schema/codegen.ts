import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';
import type { FieldDef, SchemaFile } from './types.js';

/**
 * Strip trailing DTO/Dto/dto suffix from a type name.
 *
 * @example
 * ```typescript
 * stripDtoSuffix('SummonerDTO') // 'Summoner'
 * stripDtoSuffix('MatchDto')    // 'Match'
 * stripDtoSuffix('ChampionInfo') // 'ChampionInfo'
 * ```
 */
export function stripDtoSuffix(name: string): string {
  return name.replace(/(?:DTO|Dto|dto)$/, '');
}

/**
 * Names that appear in multiple games and need a game prefix to disambiguate.
 *
 * This set will grow as actual schemas are generated.
 */
export const AMBIGUOUS_NAMES: Set<string> = new Set([
  'Match',
  'MatchTimeline',
  'Participant',
  'LeagueEntry',
  'LeagueList',
  'MiniSeries',
  'Summoner',
  'PlatformData',
  'CurrentGameInfo',
  'FeaturedGames',
]);

/**
 * Known enum fields mapped to their literal union values.
 *
 * Consistent with how routing types are already defined in the library.
 * Sourced from Riot API docs and community schema. Only well-known enum
 * fields are included; unknown string fields fall back to `string`.
 */
export const KNOWN_ENUMS: Record<string, readonly string[]> = {
  tier: [
    'IRON',
    'BRONZE',
    'SILVER',
    'GOLD',
    'PLATINUM',
    'EMERALD',
    'DIAMOND',
    'MASTER',
    'GRANDMASTER',
    'CHALLENGER',
  ],
  rank: ['I', 'II', 'III', 'IV'],
  division: ['I', 'II', 'III', 'IV'],
  queueType: [
    'RANKED_SOLO_5x5',
    'RANKED_FLEX_SR',
    'RANKED_FLEX_TT',
    'RANKED_TFT',
    'RANKED_TFT_TURBO',
    'RANKED_TFT_DOUBLE_UP',
    'RANKED_TFT_PAIRS',
  ],
  gameType: ['CUSTOM_GAME', 'MATCHED_GAME', 'TUTORIAL_GAME'],
  gameMode: [
    'CLASSIC',
    'ODIN',
    'ARAM',
    'TUTORIAL',
    'URF',
    'DOOMBOTSTEEMO',
    'ONEFORALL',
    'ASCENSION',
    'FIRSTBLOOD',
    'KINGPORO',
    'SIEGE',
    'ASSASSINATE',
    'ARSR',
    'DARKSTAR',
    'STARGUARDIAN',
    'PROJECT',
    'GAMEMODEX',
    'NEXUSBLITZ',
    'ULTBOOK',
    'CHERRY',
    'STRAWBERRY',
  ],
  mapId: ['11', '12', '21', '22', '30'],
  type: ['CHAMPION', 'ACCOUNT'],
} as const;

/** Game prefix map for resolveTypeName */
const GAME_PREFIX: Record<string, string> = {
  lol: 'Lol',
  tft: 'Tft',
  val: 'Val',
  lor: 'Lor',
  riftbound: 'Riftbound',
  riot: '',
};

/**
 * Resolve a raw type name to its final TypeScript interface name.
 *
 * Strips DTO suffix, then prepends game prefix if the name is ambiguous
 * (appears across multiple games). The "riot" game gets no prefix (shared types).
 *
 * @example
 * ```typescript
 * resolveTypeName('MatchDTO', 'lol') // 'LolMatch'
 * resolveTypeName('Match', 'tft')    // 'TftMatch'
 * resolveTypeName('Summoner', 'lol') // 'LolSummoner'
 * resolveTypeName('ChampionInfo', 'lol') // 'ChampionInfo'
 * ```
 */
export function resolveTypeName(rawName: string, game: string): string {
  const stripped = stripDtoSuffix(rawName);
  const prefix = GAME_PREFIX[game] ?? '';
  if (prefix && AMBIGUOUS_NAMES.has(stripped)) {
    return `${prefix}${stripped}`;
  }
  return stripped;
}

/**
 * Map a FieldDef to a TypeScript type string.
 *
 * For string-typed fields, checks KNOWN_ENUMS first by fieldName. If the
 * field name is a known enum, emits a literal union type instead of plain "string".
 *
 * @param field - The field definition to map
 * @param fieldName - Optional field name to check against KNOWN_ENUMS
 */
export function mapToTsType(field: FieldDef, fieldName?: string): string {
  switch (field.type) {
    case 'string': {
      if (fieldName && fieldName in KNOWN_ENUMS) {
        return KNOWN_ENUMS[fieldName].map((v) => `'${v}'`).join(' | ');
      }
      return 'string';
    }
    case 'integer':
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'array': {
      const itemType = field.items ? mapToTsType(field.items, undefined) : 'unknown';
      // Wrap complex types in parens for array syntax
      if (itemType.includes('|') || itemType.includes('{')) {
        return `(${itemType})[]`;
      }
      return `${itemType}[]`;
    }
    case 'object': {
      if (field.fields) {
        const entries = Object.keys(field.fields)
          .sort()
          .map((key) => {
            const f = field.fields?.[key];
            if (!f) return `${key}: unknown`;
            return `${key}: ${mapToTsType(f, key)}`;
          });
        return `{ ${entries.join('; ')} }`;
      }
      return 'Record<string, unknown>';
    }
    case 'unknown':
      return 'unknown';
    default:
      return 'unknown';
  }
}

/**
 * Generate a single TypeScript interface string from a name and field definitions.
 *
 * Fields are sorted alphabetically. Optional fields use `?` syntax.
 * Nullable fields append `| null`.
 */
export function generateInterface(name: string, fields: Record<string, FieldDef>): string {
  const lines: string[] = [];
  lines.push(`export interface ${name} {`);

  for (const fieldName of Object.keys(fields).sort()) {
    const field = fields[fieldName];
    const tsType = mapToTsType(field, fieldName);
    const optional = field.optional ? '?' : '';
    const nullable = field.nullable ? ' | null' : '';
    lines.push(`  ${fieldName}${optional}: ${tsType}${nullable};`);
  }

  lines.push('}');
  return lines.join('\n');
}

/**
 * Check if a hand-written override exists for a given game/type combination.
 *
 * @param overridesDir - Base overrides directory path
 * @param game - Game identifier (e.g., "lol")
 * @param typeName - Type name (e.g., "Summoner")
 * @returns true if an override file exists
 */
export function hasOverride(overridesDir: string, game: string, typeName: string): boolean {
  const overridePath = path.join(overridesDir, game, `${typeName}.ts`);
  return existsSync(overridePath);
}

/**
 * Generate TypeScript interfaces from schema JSON files.
 *
 * Reads all `.schema.json` files from schemasDir, groups by game prefix,
 * generates per-game output files, and writes a barrel index.ts.
 *
 * Types with hand-written overrides are skipped and re-exported from the
 * override file instead.
 *
 * @param schemasDir - Directory containing .schema.json files
 * @param outputDir - Directory for generated TypeScript output
 * @param overridesDir - Directory containing hand-written type overrides
 */
export function generateInterfaces(
  schemasDir: string,
  outputDir: string,
  overridesDir: string,
): void {
  const header = [
    '// Auto-generated by generate-schema. Do not edit.',
    `// Generated: ${new Date().toISOString()}`,
    '',
  ].join('\n');

  // Read all schema files
  const schemaFiles: SchemaFile[] = [];
  const files = readdirSync(schemasDir).filter((f) => f.endsWith('.schema.json'));
  for (const file of files) {
    const content = readFileSync(path.join(schemasDir, file), 'utf-8');
    schemaFiles.push(JSON.parse(content) as SchemaFile);
  }

  // Group by game
  const gameTypes: Record<string, { name: string; fields: Record<string, FieldDef> }[]> = {};

  for (const schema of schemaFiles) {
    // Extract game from group (e.g., "lol.summoner-v4" -> "lol")
    const game = schema.group.split('.')[0];
    if (!gameTypes[game]) {
      gameTypes[game] = [];
    }

    for (const [rawName, fields] of Object.entries(schema.types)) {
      const typeName = resolveTypeName(rawName, game);

      // Skip if override exists
      if (hasOverride(overridesDir, game, typeName)) {
        continue;
      }

      // Avoid duplicates within the same game
      if (!gameTypes[game].some((t) => t.name === typeName)) {
        gameTypes[game].push({ name: typeName, fields });
      }
    }
  }

  // Generate per-game files
  const gameFileNames: string[] = [];

  for (const [game, types] of Object.entries(gameTypes).sort(([a], [b]) => a.localeCompare(b))) {
    const fileName = `${game}.ts`;
    gameFileNames.push(game);

    const lines: string[] = [header];

    // Add re-exports for overridden types
    for (const schema of schemaFiles) {
      const schemaGame = schema.group.split('.')[0];
      if (schemaGame !== game) continue;
      for (const rawName of Object.keys(schema.types)) {
        const typeName = resolveTypeName(rawName, game);
        if (hasOverride(overridesDir, game, typeName)) {
          lines.push(`export type { ${typeName} } from '../overrides/${game}/${typeName}.js';`);
        }
      }
    }

    // Sort types alphabetically
    const sortedTypes = [...types].sort((a, b) => a.name.localeCompare(b.name));

    for (const typeInfo of sortedTypes) {
      lines.push('');
      lines.push(generateInterface(typeInfo.name, typeInfo.fields));
    }

    lines.push('');
    mkdirSync(outputDir, { recursive: true });
    writeFileSync(path.join(outputDir, fileName), lines.join('\n'));
  }

  // Write barrel index.ts
  const indexLines: string[] = [header];
  for (const game of gameFileNames) {
    indexLines.push(`export * from './${game}.js';`);
  }
  indexLines.push('');
  writeFileSync(path.join(outputDir, 'index.ts'), indexLines.join('\n'));
}
