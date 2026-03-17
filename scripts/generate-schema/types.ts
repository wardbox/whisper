/** Field type identifiers for schema extraction */
export type FieldType =
  | 'string'
  | 'integer'
  | 'number'
  | 'boolean'
  | 'array'
  | 'object'
  | 'unknown';

/** Describes a single field's type and modifiers */
export interface FieldDef {
  /** The inferred type of this field */
  type: FieldType;
  /** Whether this field was observed as null in any response */
  nullable?: true;
  /** Whether this field was absent in some responses */
  optional?: true;
  /** For array fields, the element type */
  items?: FieldDef;
  /** For object fields, nested field definitions */
  fields?: Record<string, FieldDef>;
}

/** A named type schema extracted from an API response */
export interface TypeSchema {
  /** Type name, e.g., "Summoner" */
  name: string;
  /** Field definitions for this type */
  fields: Record<string, FieldDef>;
}

/** A complete schema file for one API group */
export interface SchemaFile {
  /** Schema format version */
  $schema: 'whisper-schema-v1';
  /** API group identifier, e.g., "lol.summoner-v4" */
  group: string;
  /** Whether data came from live API or a stub */
  source: 'live' | 'stub';
  /** Type schemas keyed by type name */
  types: Record<string, TypeSchema['fields']>;
}

/** Game identifier for routing and file naming */
export type Game = 'lol' | 'tft' | 'val' | 'lor' | 'riftbound' | 'riot';

/** Defines an API group with its endpoints */
export interface EndpointGroup {
  /** API group name, e.g., "summoner-v4" */
  name: string;
  /** Game prefix for file naming */
  game: Game;
  /** Routing type for this group */
  routing: 'platform' | 'regional';
  /** Endpoints to hit */
  endpoints: EndpointDef[];
  /** Whether this group requires RSO (skip if true) */
  rso?: boolean;
}

/** Defines a single API endpoint */
export interface EndpointDef {
  /** Method ID for rate limiting, e.g., "summoner-v4.getByPuuid" */
  methodId: string;
  /** URL path template, e.g., "/lol/summoner/v4/summoners/by-puuid/{puuid}" */
  path: string;
  /** Path parameter names to substitute */
  params?: string[];
  /** Response type name for schema, e.g., "SummonerDTO" */
  responseName: string;
  /** Whether the response is an array */
  isArray?: boolean;
}

/** Data discovered dynamically from the live API */
export interface DiscoveredData {
  /** Primary PUUID from LoL challenger league */
  puuid: string;
  /** Riot game name from account lookup */
  gameName: string;
  /** Riot tag line from account lookup */
  tagLine: string;
  /** LoL match ID from match history */
  matchId: string;
  /** TFT player PUUID (from TFT challenger) */
  tftPuuid?: string;
  /** TFT match ID */
  tftMatchId?: string;
  /** Valorant active act ID */
  valActId?: string;
  /** LoR player PUUID */
  lorPuuid?: string;
  /** LoR match ID */
  lorMatchId?: string;
}
