// Re-export Valorant routing type (users need this to call Val endpoints)

// Re-export generated types users need for return values
export type {
  Content,
  Leaderboard,
  Matchlist,
  RecentMatches,
  ValMatch,
  ValPlatformData,
} from '../types/generated/val.js';
export type { ValPlatformRoute } from '../types/val-platform.js';
export { VAL_PLATFORM } from '../types/val-platform.js';
export { valConsoleMatchV1 } from './val-console-match-v1.js';
export { valConsoleRankedV1 } from './val-console-ranked-v1.js';
export { valContentV1 } from './val-content-v1.js';
// Namespace objects (one per API group)
export { valMatchV1 } from './val-match-v1.js';
// Re-export options types from modules that define them
export type { GetValLeaderboardOptions } from './val-ranked-v1.js';
export { valRankedV1 } from './val-ranked-v1.js';
export { valStatusV1 } from './val-status-v1.js';
