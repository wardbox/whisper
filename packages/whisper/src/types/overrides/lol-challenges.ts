/**
 * A top-ranked player for a specific challenge.
 *
 * Returned by lol-challenges-v1.getChallengeLeaderboard as an array of
 * apex-level players sorted by position.
 */
export interface ApexPlayerInfo {
  /** Encrypted PUUID of the player */
  puuid: string;
  /** Challenge value achieved by this player */
  value: number;
  /** Leaderboard position (1-indexed) */
  position: number;
}
