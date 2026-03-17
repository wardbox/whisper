#!/usr/bin/env tsx
/**
 * Build stub schema files for API groups we can't hit with a dev key.
 * DTO definitions sourced from Riot developer portal docs.
 * Run: npx tsx scripts/generate-schema/_build-stubs.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sortKeys } from './schema.js';
import type { FieldDef, SchemaFile } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMAS_DIR = path.resolve(__dirname, '../schemas');

type RiotFieldMap = Record<string, string>;
type DtoMap = Record<string, RiotFieldMap>;

function mapRiotType(riotType: string, allDtos: DtoMap): FieldDef {
  if (riotType.startsWith('List[')) {
    const inner = riotType.slice(5, -1);
    return { type: 'array', items: mapRiotType(inner, allDtos) };
  }
  switch (riotType) {
    case 'string':
      return { type: 'string' };
    case 'int':
    case 'long':
      return { type: 'integer' };
    case 'float':
    case 'double':
      return { type: 'number' };
    case 'boolean':
      return { type: 'boolean' };
    default: {
      // DTO reference — inline if available
      if (allDtos[riotType]) {
        const fields: Record<string, FieldDef> = {};
        for (const [k, v] of Object.entries(allDtos[riotType])) {
          fields[k] = mapRiotType(v, {}); // Don't recurse infinitely
        }
        return { type: 'object', fields };
      }
      return { type: 'object' };
    }
  }
}

function buildSchema(game: string, name: string, dtos: DtoMap): SchemaFile {
  const types: Record<string, Record<string, FieldDef>> = {};
  for (const [dtoName, fields] of Object.entries(dtos)) {
    const fieldDefs: Record<string, FieldDef> = {};
    for (const [fieldName, riotType] of Object.entries(fields)) {
      fieldDefs[fieldName] = mapRiotType(riotType, dtos);
    }
    types[dtoName] = fieldDefs;
  }
  return { $schema: 'whisper-schema-v1', group: `${game}.${name}`, source: 'stub', types };
}

function writeSchema(game: string, name: string, dtos: DtoMap): void {
  const schema = buildSchema(game, name, dtos);
  const filePath = path.join(SCHEMAS_DIR, `${game}.${name}.schema.json`);
  writeFileSync(filePath, `${JSON.stringify(sortKeys(schema), null, 2)}\n`);
  console.log(`Wrote ${filePath} (${Object.keys(schema.types).length} types)`);
}

mkdirSync(SCHEMAS_DIR, { recursive: true });

// ============================================================
// VAL-MATCH-V1
// ============================================================
writeSchema('val', 'val-match-v1', {
  MatchDto: {
    matchInfo: 'MatchInfoDto',
    players: 'List[PlayerDto]',
    coaches: 'List[CoachDto]',
    teams: 'List[TeamDto]',
    roundResults: 'List[RoundResultDto]',
  },
  MatchInfoDto: {
    matchId: 'string',
    mapId: 'string',
    gameVersion: 'string',
    gameLengthMillis: 'int',
    region: 'string',
    gameStartMillis: 'long',
    provisioningFlowId: 'string',
    isCompleted: 'boolean',
    customGameName: 'string',
    queueId: 'string',
    gameMode: 'string',
    isRanked: 'boolean',
    seasonId: 'string',
    premierMatchInfo: 'List[PremierMatchDto]',
  },
  PlayerDto: {
    puuid: 'string',
    gameName: 'string',
    tagLine: 'string',
    teamId: 'string',
    partyId: 'string',
    characterId: 'string',
    stats: 'PlayerStatsDto',
    competitiveTier: 'int',
    isObserver: 'boolean',
    playerCard: 'string',
    playerTitle: 'string',
    accountLevel: 'int',
  },
  PlayerStatsDto: {
    score: 'int',
    roundsPlayed: 'int',
    kills: 'int',
    deaths: 'int',
    assists: 'int',
    playtimeMillis: 'int',
    abilityCasts: 'AbilityCastsDto',
  },
  AbilityCastsDto: {
    grenadeCasts: 'int',
    ability1Casts: 'int',
    ability2Casts: 'int',
    ultimateCasts: 'int',
  },
  CoachDto: { puuid: 'string', teamId: 'string' },
  TeamDto: {
    teamId: 'string',
    won: 'boolean',
    roundsPlayed: 'int',
    roundsWon: 'int',
    numPoints: 'int',
  },
  RoundResultDto: {
    roundNum: 'int',
    roundResult: 'string',
    roundCeremony: 'string',
    winningTeam: 'string',
    winningTeamRole: 'string',
    bombPlanter: 'string',
    bombDefuser: 'string',
    plantRoundTime: 'int',
    plantPlayerLocations: 'List[PlayerLocationsDto]',
    plantLocation: 'LocationDto',
    plantSite: 'string',
    defuseRoundTime: 'int',
    defusePlayerLocations: 'List[PlayerLocationsDto]',
    defuseLocation: 'LocationDto',
    playerStats: 'List[PlayerRoundStatsDto]',
    roundResultCode: 'string',
  },
  PlayerLocationsDto: { puuid: 'string', viewRadians: 'float', location: 'LocationDto' },
  LocationDto: { x: 'int', y: 'int' },
  PlayerRoundStatsDto: {
    puuid: 'string',
    kills: 'List[KillDto]',
    damage: 'List[DamageDto]',
    score: 'int',
    economy: 'EconomyDto',
    ability: 'AbilityDto',
  },
  KillDto: {
    timeSinceGameStartMillis: 'int',
    timeSinceRoundStartMillis: 'int',
    killer: 'string',
    victim: 'string',
    victimLocation: 'LocationDto',
    assistants: 'List[string]',
    playerLocations: 'List[PlayerLocationsDto]',
    finishingDamage: 'FinishingDamageDto',
  },
  FinishingDamageDto: {
    damageType: 'string',
    damageItem: 'string',
    isSecondaryFireMode: 'boolean',
  },
  DamageDto: {
    receiver: 'string',
    damage: 'int',
    legshots: 'int',
    bodyshots: 'int',
    headshots: 'int',
  },
  EconomyDto: {
    loadoutValue: 'int',
    weapon: 'string',
    armor: 'string',
    remaining: 'int',
    spent: 'int',
  },
  AbilityDto: {
    grenadeEffects: 'string',
    ability1Effects: 'string',
    ability2Effects: 'string',
    ultimateEffects: 'string',
  },
  MatchlistDto: { puuid: 'string', history: 'List[MatchlistEntryDto]' },
  MatchlistEntryDto: { matchId: 'string', gameStartTimeMillis: 'long', queueId: 'string' },
  RecentMatchesDto: { currentTime: 'long', matchIds: 'List[string]' },
});

// ============================================================
// VAL-CONTENT-V1
// ============================================================
writeSchema('val', 'val-content-v1', {
  ContentDto: {
    version: 'string',
    characters: 'List[ContentItemDto]',
    maps: 'List[ContentItemDto]',
    chromas: 'List[ContentItemDto]',
    skins: 'List[ContentItemDto]',
    skinLevels: 'List[ContentItemDto]',
    equips: 'List[ContentItemDto]',
    gameModes: 'List[ContentItemDto]',
    sprays: 'List[ContentItemDto]',
    sprayLevels: 'List[ContentItemDto]',
    charms: 'List[ContentItemDto]',
    charmLevels: 'List[ContentItemDto]',
    playerCards: 'List[ContentItemDto]',
    playerTitles: 'List[ContentItemDto]',
    acts: 'List[ActDto]',
  },
  ContentItemDto: {
    name: 'string',
    localizedNames: 'LocalizedNamesDto',
    id: 'string',
    assetName: 'string',
    assetPath: 'string',
  },
  LocalizedNamesDto: {
    'ar-AE': 'string',
    'de-DE': 'string',
    'en-GB': 'string',
    'en-US': 'string',
    'es-ES': 'string',
    'es-MX': 'string',
    'fr-FR': 'string',
    'id-ID': 'string',
    'it-IT': 'string',
    'ja-JP': 'string',
    'ko-KR': 'string',
    'pl-PL': 'string',
    'pt-BR': 'string',
    'ru-RU': 'string',
    'th-TH': 'string',
    'tr-TR': 'string',
    'vi-VN': 'string',
    'zh-CN': 'string',
    'zh-TW': 'string',
  },
  ActDto: {
    name: 'string',
    localizedNames: 'LocalizedNamesDto',
    id: 'string',
    isActive: 'boolean',
  },
});

// ============================================================
// VAL-RANKED-V1
// ============================================================
writeSchema('val', 'val-ranked-v1', {
  LeaderboardDto: {
    actId: 'string',
    players: 'List[PlayerDto]',
    totalPlayers: 'long',
    query: 'string',
    shard: 'string',
    tierDetails: 'List[TierDto]',
  },
  PlayerDto: {
    puuid: 'string',
    gameName: 'string',
    tagLine: 'string',
    leaderboardRank: 'long',
    rankedRating: 'long',
    numberOfWins: 'long',
    competitiveTier: 'int',
  },
  TierDto: {},
});

// ============================================================
// VAL-STATUS-V1 (same PlatformDataDto as lol-status-v4)
// ============================================================
writeSchema('val', 'val-status-v1', {
  PlatformDataDto: {
    id: 'string',
    name: 'string',
    locales: 'List[string]',
    maintenances: 'List[StatusDto]',
    incidents: 'List[StatusDto]',
  },
  StatusDto: {
    id: 'int',
    maintenance_status: 'string',
    incident_severity: 'string',
    titles: 'List[ContentDto]',
    updates: 'List[UpdateDto]',
    created_at: 'string',
    archive_at: 'string',
    updated_at: 'string',
    platforms: 'List[string]',
  },
  ContentDto: { locale: 'string', content: 'string' },
  UpdateDto: {
    id: 'int',
    author: 'string',
    publish: 'boolean',
    publish_locations: 'List[string]',
    translations: 'List[ContentDto]',
    created_at: 'string',
    updated_at: 'string',
  },
});

// ============================================================
// VAL-CONSOLE-MATCH-V1 (same DTOs as val-match-v1)
// ============================================================
writeSchema('val', 'val-console-match-v1', {
  MatchDto: {
    matchInfo: 'MatchInfoDto',
    players: 'List[PlayerDto]',
    coaches: 'List[CoachDto]',
    teams: 'List[TeamDto]',
    roundResults: 'List[RoundResultDto]',
  },
  MatchInfoDto: {
    matchId: 'string',
    mapId: 'string',
    gameVersion: 'string',
    gameLengthMillis: 'int',
    region: 'string',
    gameStartMillis: 'long',
    provisioningFlowId: 'string',
    isCompleted: 'boolean',
    customGameName: 'string',
    queueId: 'string',
    gameMode: 'string',
    isRanked: 'boolean',
    seasonId: 'string',
    premierMatchInfo: 'List[PremierMatchDto]',
  },
  PlayerDto: {
    puuid: 'string',
    gameName: 'string',
    tagLine: 'string',
    teamId: 'string',
    partyId: 'string',
    characterId: 'string',
    stats: 'PlayerStatsDto',
    competitiveTier: 'int',
    isObserver: 'boolean',
    playerCard: 'string',
    playerTitle: 'string',
    accountLevel: 'int',
  },
  PlayerStatsDto: {
    score: 'int',
    roundsPlayed: 'int',
    kills: 'int',
    deaths: 'int',
    assists: 'int',
    playtimeMillis: 'int',
    abilityCasts: 'AbilityCastsDto',
  },
  AbilityCastsDto: {
    grenadeCasts: 'int',
    ability1Casts: 'int',
    ability2Casts: 'int',
    ultimateCasts: 'int',
  },
  CoachDto: { puuid: 'string', teamId: 'string' },
  TeamDto: {
    teamId: 'string',
    won: 'boolean',
    roundsPlayed: 'int',
    roundsWon: 'int',
    numPoints: 'int',
  },
  RoundResultDto: {
    roundNum: 'int',
    roundResult: 'string',
    roundCeremony: 'string',
    winningTeam: 'string',
    winningTeamRole: 'string',
    bombPlanter: 'string',
    bombDefuser: 'string',
    plantRoundTime: 'int',
    plantPlayerLocations: 'List[PlayerLocationsDto]',
    plantLocation: 'LocationDto',
    plantSite: 'string',
    defuseRoundTime: 'int',
    defusePlayerLocations: 'List[PlayerLocationsDto]',
    defuseLocation: 'LocationDto',
    playerStats: 'List[PlayerRoundStatsDto]',
    roundResultCode: 'string',
  },
  PlayerLocationsDto: { puuid: 'string', viewRadians: 'float', location: 'LocationDto' },
  LocationDto: { x: 'int', y: 'int' },
  PlayerRoundStatsDto: {
    puuid: 'string',
    kills: 'List[KillDto]',
    damage: 'List[DamageDto]',
    score: 'int',
    economy: 'EconomyDto',
    ability: 'AbilityDto',
  },
  KillDto: {
    timeSinceGameStartMillis: 'int',
    timeSinceRoundStartMillis: 'int',
    killer: 'string',
    victim: 'string',
    victimLocation: 'LocationDto',
    assistants: 'List[string]',
    playerLocations: 'List[PlayerLocationsDto]',
    finishingDamage: 'FinishingDamageDto',
  },
  FinishingDamageDto: {
    damageType: 'string',
    damageItem: 'string',
    isSecondaryFireMode: 'boolean',
  },
  DamageDto: {
    receiver: 'string',
    damage: 'int',
    legshots: 'int',
    bodyshots: 'int',
    headshots: 'int',
  },
  EconomyDto: {
    loadoutValue: 'int',
    weapon: 'string',
    armor: 'string',
    remaining: 'int',
    spent: 'int',
  },
  AbilityDto: {
    grenadeEffects: 'string',
    ability1Effects: 'string',
    ability2Effects: 'string',
    ultimateEffects: 'string',
  },
  MatchlistDto: { puuid: 'string', history: 'List[MatchlistEntryDto]' },
  MatchlistEntryDto: { matchId: 'string', gameStartTimeMillis: 'long', queueId: 'string' },
  RecentMatchesDto: { currentTime: 'long', matchIds: 'List[string]' },
});

// ============================================================
// VAL-CONSOLE-RANKED-V1 (same as val-ranked-v1)
// ============================================================
writeSchema('val', 'val-console-ranked-v1', {
  LeaderboardDto: {
    actId: 'string',
    players: 'List[PlayerDto]',
    totalPlayers: 'long',
    query: 'string',
    shard: 'string',
    tierDetails: 'List[TierDto]',
  },
  PlayerDto: {
    puuid: 'string',
    gameName: 'string',
    tagLine: 'string',
    leaderboardRank: 'long',
    rankedRating: 'long',
    numberOfWins: 'long',
    competitiveTier: 'int',
  },
  TierDto: {},
});

// ============================================================
// LOR-STATUS-V1 (same PlatformDataDto shape)
// ============================================================
writeSchema('lor', 'lor-status-v1', {
  PlatformDataDto: {
    id: 'string',
    name: 'string',
    locales: 'List[string]',
    maintenances: 'List[StatusDto]',
    incidents: 'List[StatusDto]',
  },
  StatusDto: {
    id: 'int',
    maintenance_status: 'string',
    incident_severity: 'string',
    titles: 'List[ContentDto]',
    updates: 'List[UpdateDto]',
    created_at: 'string',
    archive_at: 'string',
    updated_at: 'string',
    platforms: 'List[string]',
  },
  ContentDto: { locale: 'string', content: 'string' },
  UpdateDto: {
    id: 'int',
    author: 'string',
    publish: 'boolean',
    publish_locations: 'List[string]',
    translations: 'List[ContentDto]',
    created_at: 'string',
    updated_at: 'string',
  },
});

// ============================================================
// SPECTATOR-V5
// ============================================================
writeSchema('lol', 'spectator-v5', {
  CurrentGameInfo: {
    gameId: 'long',
    gameType: 'string',
    gameStartTime: 'long',
    mapId: 'long',
    gameLength: 'long',
    platformId: 'string',
    gameMode: 'string',
    bannedChampions: 'List[BannedChampion]',
    gameQueueConfigId: 'long',
    observers: 'Observer',
    participants: 'List[CurrentGameParticipant]',
  },
  BannedChampion: { pickTurn: 'int', championId: 'long', teamId: 'long' },
  Observer: { encryptionKey: 'string' },
  CurrentGameParticipant: {
    championId: 'long',
    perks: 'Perks',
    profileIconId: 'long',
    teamId: 'long',
    puuid: 'string',
    spell1Id: 'long',
    spell2Id: 'long',
    gameCustomizationObjects: 'List[GameCustomizationObject]',
    bot: 'boolean',
  },
  Perks: { perkIds: 'List[long]', perkStyle: 'long', perkSubStyle: 'long' },
  GameCustomizationObject: { category: 'string', content: 'string' },
});

// ============================================================
// SPECTATOR-TFT-V5 (same CurrentGameInfo shape)
// ============================================================
writeSchema('tft', 'spectator-tft-v5', {
  CurrentGameInfo: {
    gameId: 'long',
    gameType: 'string',
    gameStartTime: 'long',
    mapId: 'long',
    gameLength: 'long',
    platformId: 'string',
    gameMode: 'string',
    bannedChampions: 'List[BannedChampion]',
    gameQueueConfigId: 'long',
    observers: 'Observer',
    participants: 'List[CurrentGameParticipant]',
  },
  BannedChampion: { pickTurn: 'int', championId: 'long', teamId: 'long' },
  Observer: { encryptionKey: 'string' },
  CurrentGameParticipant: {
    championId: 'long',
    perks: 'Perks',
    profileIconId: 'long',
    teamId: 'long',
    puuid: 'string',
    spell1Id: 'long',
    spell2Id: 'long',
    gameCustomizationObjects: 'List[GameCustomizationObject]',
    bot: 'boolean',
  },
  Perks: { perkIds: 'List[long]', perkStyle: 'long', perkSubStyle: 'long' },
  GameCustomizationObject: { category: 'string', content: 'string' },
});

// ============================================================
// RIFTBOUND-CONTENT-V1
// ============================================================
writeSchema('riftbound', 'riftbound-content-v1', {
  RiftboundContentDTO: {
    game: 'string',
    version: 'string',
    lastUpdated: 'string',
    sets: 'List[SetDTO]',
  },
  SetDTO: { id: 'string', name: 'string', cards: 'List[CardDTO]' },
  CardDTO: {
    id: 'string',
    collectorNumber: 'long',
    set: 'string',
    name: 'string',
    description: 'string',
    type: 'string',
    rarity: 'string',
    faction: 'string',
    stats: 'CardStatsDTO',
    keywords: 'List[string]',
    art: 'CardArtDTO',
    flavorText: 'string',
    tags: 'List[string]',
  },
  CardStatsDTO: { energy: 'long', might: 'long', cost: 'long', power: 'long' },
  CardArtDTO: { thumbnailURL: 'string', fullURL: 'string', artist: 'string' },
});

console.log('All stubs written.');
