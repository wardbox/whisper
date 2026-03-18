/**
 * A player on a Clash team.
 *
 * Represents a single player's role and position within a {@link ClashTeam}.
 */
export interface ClashTeamPlayer {
  /** Encrypted PUUID of the player */
  puuid: string;
  /**
   * Player's selected position.
   *
   * Possible values: "TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY", "FILL", "UNSELECTED"
   */
  position: string;
  /**
   * Player's role on the team.
   *
   * Possible values: "CAPTAIN", "MEMBER"
   */
  role: string;
}

/**
 * A Clash team (TeamDTO).
 *
 * Returned by the clash-v1.getTeamById endpoint.
 */
export interface ClashTeam {
  /** Unique team identifier */
  id: string;
  /** ID of the tournament this team is registered for */
  tournamentId: number;
  /** Team display name */
  name: string;
  /** Icon ID for the team */
  iconId: number;
  /** Team tier (lower is better, e.g., 1 = highest tier) */
  tier: number;
  /** PUUID of the team captain */
  captain: string;
  /** Short abbreviated team name (max 3 characters) */
  abbreviation: string;
  /** List of players on the team */
  players: ClashTeamPlayer[];
}
