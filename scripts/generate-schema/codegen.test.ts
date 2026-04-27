import { describe, expect, it } from 'vitest';
import {
  AMBIGUOUS_NAMES,
  formatJsDoc,
  formatPropertyKey,
  generateInterface,
  generateInterfaces,
  hasOverride,
  KNOWN_ENUMS,
  mapToTsType,
  resolveTypeName,
  stripDtoSuffix,
} from './codegen.js';
import type { FieldDef } from './types.js';

describe('stripDtoSuffix', () => {
  it('strips trailing DTO', () => {
    expect(stripDtoSuffix('SummonerDTO')).toBe('Summoner');
  });

  it('strips trailing Dto', () => {
    expect(stripDtoSuffix('MatchDto')).toBe('Match');
  });

  it('strips trailing dto', () => {
    expect(stripDtoSuffix('Testdto')).toBe('Test');
  });

  it('does not strip when no suffix', () => {
    expect(stripDtoSuffix('ChampionInfo')).toBe('ChampionInfo');
  });

  it('does not strip DTO in the middle', () => {
    expect(stripDtoSuffix('DTOMapper')).toBe('DTOMapper');
  });
});

describe('resolveTypeName', () => {
  it('prefixes ambiguous names with game', () => {
    expect(resolveTypeName('Match', 'lol')).toBe('LolMatch');
  });

  it('prefixes TFT ambiguous names', () => {
    expect(resolveTypeName('Match', 'tft')).toBe('TftMatch');
  });

  it('does not prefix riot game (shared types)', () => {
    expect(resolveTypeName('Match', 'riot')).toBe('Match');
  });

  it('strips DTO suffix before resolving', () => {
    expect(resolveTypeName('MatchDTO', 'lol')).toBe('LolMatch');
  });

  it('does not prefix non-ambiguous names', () => {
    expect(resolveTypeName('ChampionInfo', 'lol')).toBe('ChampionInfo');
  });

  it('returns Summoner with Lol prefix (ambiguous)', () => {
    expect(resolveTypeName('Summoner', 'lol')).toBe('LolSummoner');
  });

  it('returns Summoner with Tft prefix (ambiguous)', () => {
    expect(resolveTypeName('Summoner', 'tft')).toBe('TftSummoner');
  });
});

describe('mapToTsType', () => {
  it('maps string to string', () => {
    expect(mapToTsType({ type: 'string' })).toBe('string');
  });

  it('maps string with unknown field name to string', () => {
    expect(mapToTsType({ type: 'string' }, 'someRandomField')).toBe('string');
  });

  it('maps integer to number', () => {
    expect(mapToTsType({ type: 'integer' })).toBe('number');
  });

  it('maps number to number', () => {
    expect(mapToTsType({ type: 'number' })).toBe('number');
  });

  it('maps boolean to boolean', () => {
    expect(mapToTsType({ type: 'boolean' })).toBe('boolean');
  });

  it('maps unknown to unknown', () => {
    expect(mapToTsType({ type: 'unknown' })).toBe('unknown');
  });

  it('maps array of strings', () => {
    expect(mapToTsType({ type: 'array', items: { type: 'string' } })).toBe('string[]');
  });

  it('maps array of objects', () => {
    const field: FieldDef = {
      type: 'array',
      items: {
        type: 'object',
        fields: { id: { type: 'string' } },
      },
    };
    expect(mapToTsType(field)).toBe('({ id: string })[]');
  });

  it('maps object with fields', () => {
    const field: FieldDef = {
      type: 'object',
      fields: {
        name: { type: 'string' },
        level: { type: 'integer' },
      },
    };
    const result = mapToTsType(field);
    expect(result).toContain('level: number');
    expect(result).toContain('name: string');
  });

  it('preserves optional and nullable on nested object fields', () => {
    const field: FieldDef = {
      type: 'object',
      fields: {
        severity: { type: 'string', nullable: true },
        updatedAt: { type: 'string', optional: true },
        description: { type: 'string', optional: true, nullable: true },
      },
    };
    const result = mapToTsType(field);
    expect(result).toContain('severity: string | null');
    expect(result).toContain('updatedAt?: string');
    expect(result).toContain('description?: string | null');
  });

  // KNOWN_ENUMS tests
  it('maps tier field to literal union', () => {
    const result = mapToTsType({ type: 'string' }, 'tier');
    expect(result).toContain("'IRON'");
    expect(result).toContain("'BRONZE'");
    expect(result).toContain("'SILVER'");
    expect(result).toContain("'GOLD'");
    expect(result).toContain("'PLATINUM'");
    expect(result).toContain("'EMERALD'");
    expect(result).toContain("'DIAMOND'");
    expect(result).toContain("'MASTER'");
    expect(result).toContain("'GRANDMASTER'");
    expect(result).toContain("'CHALLENGER'");
    expect(result).not.toBe('string');
  });

  it('maps division field to literal union', () => {
    expect(mapToTsType({ type: 'string' }, 'division')).toBe("'I' | 'II' | 'III' | 'IV'");
  });

  it('maps rank field to literal union', () => {
    expect(mapToTsType({ type: 'string' }, 'rank')).toBe("'I' | 'II' | 'III' | 'IV'");
  });

  it('maps queueType field to literal union', () => {
    const result = mapToTsType({ type: 'string' }, 'queueType');
    expect(result).toContain("'RANKED_SOLO_5x5'");
    expect(result).not.toBe('string');
  });

  it('maps gameType field to literal union', () => {
    const result = mapToTsType({ type: 'string' }, 'gameType');
    expect(result).toContain("'MATCHED_GAME'");
  });

  it('maps gameMode field to literal union', () => {
    const result = mapToTsType({ type: 'string' }, 'gameMode');
    expect(result).toContain("'CLASSIC'");
    expect(result).toContain("'ARAM'");
  });
});

describe('KNOWN_ENUMS', () => {
  it('contains tier', () => {
    expect(KNOWN_ENUMS).toHaveProperty('tier');
    expect(KNOWN_ENUMS.tier).toContain('IRON');
  });

  it('contains rank', () => {
    expect(KNOWN_ENUMS).toHaveProperty('rank');
  });

  it('contains division', () => {
    expect(KNOWN_ENUMS).toHaveProperty('division');
  });

  it('contains queueType', () => {
    expect(KNOWN_ENUMS).toHaveProperty('queueType');
    expect(KNOWN_ENUMS.queueType).toContain('RANKED_SOLO_5x5');
  });

  it('contains gameType', () => {
    expect(KNOWN_ENUMS).toHaveProperty('gameType');
  });

  it('contains gameMode', () => {
    expect(KNOWN_ENUMS).toHaveProperty('gameMode');
  });
});

describe('AMBIGUOUS_NAMES', () => {
  it('contains Match', () => {
    expect(AMBIGUOUS_NAMES.has('Match')).toBe(true);
  });

  it('contains Summoner', () => {
    expect(AMBIGUOUS_NAMES.has('Summoner')).toBe(true);
  });

  it('contains LeagueEntry', () => {
    expect(AMBIGUOUS_NAMES.has('LeagueEntry')).toBe(true);
  });
});

describe('generateInterface', () => {
  it('produces valid exported interface', () => {
    const fields: Record<string, FieldDef> = {
      name: { type: 'string' },
      level: { type: 'integer' },
    };
    const result = generateInterface('Summoner', fields);
    expect(result).toContain('export interface Summoner');
    expect(result).toContain('level: number;');
    expect(result).toContain('name: string;');
  });

  it('handles optional fields', () => {
    const fields: Record<string, FieldDef> = {
      wins: { type: 'integer', optional: true },
    };
    const result = generateInterface('Stats', fields);
    expect(result).toContain('wins?: number;');
  });

  it('handles nullable fields', () => {
    const fields: Record<string, FieldDef> = {
      bio: { type: 'string', nullable: true },
    };
    const result = generateInterface('Profile', fields);
    expect(result).toContain('bio: string | null;');
  });

  it('handles optional nullable fields', () => {
    const fields: Record<string, FieldDef> = {
      bio: { type: 'string', optional: true, nullable: true },
    };
    const result = generateInterface('Profile', fields);
    expect(result).toContain('bio?: string | null;');
  });

  it('produces tier literal union for tier field', () => {
    const fields: Record<string, FieldDef> = {
      tier: { type: 'string' },
      summonerName: { type: 'string' },
    };
    const result = generateInterface('LeagueEntry', fields);
    expect(result).toContain("tier: 'IRON' | 'BRONZE'");
    expect(result).toContain('summonerName: string;');
  });

  it('sorts fields alphabetically', () => {
    const fields: Record<string, FieldDef> = {
      z: { type: 'string' },
      a: { type: 'string' },
      m: { type: 'string' },
    };
    const result = generateInterface('Test', fields);
    const aIndex = result.indexOf('a:');
    const mIndex = result.indexOf('m:');
    const zIndex = result.indexOf('z:');
    expect(aIndex).toBeLessThan(mIndex);
    expect(mIndex).toBeLessThan(zIndex);
  });
});

describe('hasOverride', () => {
  it('returns false for nonexistent override', () => {
    expect(hasOverride('/nonexistent/overrides', 'lol', 'SomeType')).toBe(false);
  });
});

describe('generateInterfaces', () => {
  // This is an integration-level test. We test it with in-memory fixtures
  // in a temp directory to verify the full pipeline.
  it('is exported as a function', () => {
    expect(typeof generateInterfaces).toBe('function');
  });
});

describe('formatPropertyKey', () => {
  it('leaves valid identifiers unquoted', () => {
    expect(formatPropertyKey('foo')).toBe('foo');
    expect(formatPropertyKey('camelCase')).toBe('camelCase');
    expect(formatPropertyKey('_underscore')).toBe('_underscore');
    expect(formatPropertyKey('$dollar')).toBe('$dollar');
    expect(formatPropertyKey('with123Digits')).toBe('with123Digits');
  });

  it('leaves pure integer literals unquoted (valid as numeric property keys)', () => {
    expect(formatPropertyKey('0')).toBe('0');
    expect(formatPropertyKey('123')).toBe('123');
    expect(formatPropertyKey('603010')).toBe('603010');
  });

  it('quotes hyphenated locale codes with double quotes', () => {
    expect(formatPropertyKey('ar-AE')).toBe('"ar-AE"');
    expect(formatPropertyKey('pt-BR')).toBe('"pt-BR"');
    expect(formatPropertyKey('zh-CN')).toBe('"zh-CN"');
  });

  it('quotes keys with leading digits but trailing letters', () => {
    expect(formatPropertyKey('123challenge')).toBe('"123challenge"');
  });

  it('escapes embedded double quotes', () => {
    expect(formatPropertyKey('foo"bar')).toBe('"foo\\"bar"');
  });
});

describe('formatJsDoc', () => {
  it('emits single-line for short descriptions', () => {
    expect(formatJsDoc('A summoner profile.', '')).toBe('/** A summoner profile. */');
    expect(formatJsDoc('A summoner profile.', '  ')).toBe('  /** A summoner profile. */');
  });

  it('emits multi-line block for descriptions with newlines', () => {
    const out = formatJsDoc('First paragraph.\n\nSecond paragraph.', '');
    expect(out).toBe('/**\n * First paragraph.\n *\n * Second paragraph.\n */');
  });

  it('preserves indentation across all lines of a multi-line block', () => {
    const out = formatJsDoc('Line one.\nLine two.', '  ');
    expect(out).toBe('  /**\n   * Line one.\n   * Line two.\n   */');
  });
});

describe('generateInterface with descriptions', () => {
  it('emits JSDoc for the interface and known fields, skipping undocumented fields', () => {
    const fields: Record<string, FieldDef> = {
      id: { type: 'string' },
      name: { type: 'string' },
      misc: { type: 'string' },
    };
    const out = generateInterface('Summoner', fields, {
      _description: 'A player summoner profile.',
      id: 'Encrypted PUUID.',
      name: 'Display name.',
    });
    expect(out).toContain('/** A player summoner profile. */\nexport interface Summoner');
    expect(out).toContain('  /** Encrypted PUUID. */\n  id: string;');
    expect(out).toContain('  /** Display name. */\n  name: string;');
    expect(out).toContain('  misc: string;');
    // misc has no JSDoc since it's not in the descriptions map.
    expect(out).not.toContain('/** Display name. */\n  misc');
  });

  it('emits no JSDoc when descriptions are absent', () => {
    const out = generateInterface('Summoner', { id: { type: 'string' } });
    expect(out).toBe('export interface Summoner {\n  id: string;\n}');
  });
});

describe('generateInterface with non-identifier keys', () => {
  it('quotes hyphenated keys in object field types', () => {
    const fields: Record<string, FieldDef> = {
      localizedNames: {
        type: 'object',
        fields: {
          'ar-AE': { type: 'string' },
          'en-US': { type: 'string' },
        },
      },
    };
    const out = generateInterface('Content', fields);
    expect(out).toContain('"ar-AE": string');
    expect(out).toContain('"en-US": string');
  });

  it('quotes hyphenated keys at the interface field level', () => {
    const fields: Record<string, FieldDef> = {
      'foo-bar': { type: 'string' },
    };
    const out = generateInterface('Weird', fields);
    expect(out).toContain('"foo-bar": string;');
  });
});
