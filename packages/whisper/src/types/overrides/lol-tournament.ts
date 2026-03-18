/**
 * Parameters for registering a tournament provider.
 *
 * Used as the request body for tournament-v5.createProvider and
 * tournament-stub-v5.createProvider.
 */
export interface ProviderRegistrationParameters {
  /**
   * Region where the provider will be registered.
   *
   * Possible values: "BR", "EUNE", "EUW", "JP", "LAN", "LAS", "NA", "OCE",
   * "PBE", "PH", "RU", "SG", "TH", "TR", "TW", "VN", "KR"
   */
  region: string;
  /** URL to which tournament game results will be posted */
  url: string;
}

/**
 * Parameters for registering a tournament.
 *
 * Used as the request body for tournament-v5.createTournament and
 * tournament-stub-v5.createTournament.
 */
export interface TournamentRegistrationParameters {
  /** Provider ID obtained from createProvider */
  providerId: number;
  /** Optional display name for the tournament */
  name?: string;
}

/**
 * Parameters for creating tournament codes.
 *
 * Used as the request body for tournament-v5.createTournamentCode and
 * tournament-stub-v5.createTournamentCode.
 */
export interface TournamentCodeParameters {
  /** List of encrypted PUUIDs eligible to participate (optional) */
  allowedParticipants?: string[];
  /**
   * Map type for the tournament game.
   *
   * Possible values: "SUMMONERS_RIFT", "HOWLING_ABYSS"
   */
  mapType: string;
  /** Optional metadata string (max 256 characters) */
  metadata?: string;
  /**
   * Champion pick type.
   *
   * Possible values: "BLIND_PICK", "DRAFT_MODE", "ALL_RANDOM", "TOURNAMENT_DRAFT"
   */
  pickType: string;
  /**
   * Spectator access type.
   *
   * Possible values: "NONE", "LOBBYONLY", "ALL"
   */
  spectatorType: string;
  /** Number of players per team (1-5) */
  teamSize: number;
}

/**
 * A tournament code with its full configuration.
 *
 * Returned by tournament-v5.getTournamentCode.
 */
export interface TournamentCodeV5 {
  /** The tournament code string */
  code: string;
  /** Spectator access type */
  spectators: string;
  /** Name of the game lobby */
  lobbyName: string;
  /** Metadata associated with this code */
  metaData: string;
  /** Lobby password */
  password: string;
  /** Numeric tournament code ID */
  id: number;
  /** Region for this tournament code */
  region: string;
  /** Map type */
  map: string;
  /** Pick type */
  pickType: string;
  /** Number of players per team */
  teamSize: number;
  /** List of encrypted PUUIDs of allowed participants */
  participants: string[];
}

/**
 * A single lobby event.
 *
 * Represents a player joining or leaving a tournament lobby.
 */
export interface LobbyEventV5 {
  /** ISO 8601 timestamp of the event */
  timestamp: string;
  /** Type of event (e.g., "PlayerJoinedGameEvent", "PlayerSwitchedTeamEvent") */
  eventType: string;
  /** Encrypted PUUID of the player involved */
  puuid: string;
}

/**
 * Wrapper for lobby events.
 *
 * Returned by tournament-v5.getLobbyEventsByCode and
 * tournament-stub-v5.getLobbyEventsByCode.
 */
export interface LobbyEventV5Wrapper {
  /** List of lobby events for the given tournament code */
  eventList: LobbyEventV5[];
}

/**
 * Parameters for updating an existing tournament code.
 *
 * Used as the request body for tournament-v5.updateTournamentCode.
 */
export interface TournamentCodeUpdateParameters {
  /** Updated list of encrypted PUUIDs eligible to participate (optional) */
  allowedParticipants?: string[];
  /**
   * Updated map type.
   *
   * Possible values: "SUMMONERS_RIFT", "HOWLING_ABYSS"
   */
  mapType: string;
  /**
   * Updated pick type.
   *
   * Possible values: "BLIND_PICK", "DRAFT_MODE", "ALL_RANDOM", "TOURNAMENT_DRAFT"
   */
  pickType: string;
  /**
   * Updated spectator type.
   *
   * Possible values: "NONE", "LOBBYONLY", "ALL"
   */
  spectatorType: string;
}
