# @wardbox/whisper

## 0.3.0

### Minor Changes

- [#22](https://github.com/wardbox/whisper/pull/22) [`5fd68f5`](https://github.com/wardbox/whisper/commit/5fd68f54708211b394673aa99d65de78a3d47784) Thanks [@github-actions](https://github.com/apps/github-actions)! - Update types to match current Riot API response shapes (confirmed against live API):

  **Breaking changes:**

  - `LolLeagueEntry`: removed `leagueId` (no longer returned by league-v4 endpoints)
  - `LeagueList`: removed `leagueId` and `name` (no longer returned by league-v4 league endpoints)
  - `LolMatch` teams: removed `feats` object (`EPIC_MONSTER_KILL`, `FIRST_BLOOD`, `FIRST_TURRET`)

  **New fields:**

  - `LolMatch` participants: `causedGameEndFromIGNBSurrender`, `gameEndedInIGNBSurrender`, `teamIGNBSurrendered`, `wasPremadeWithIGNBGameEndCauser`, `wasPremadeWithSevereTransgressor`, `wasSevereTransgressor`, `positionAssignedByMatchmaking`, `selectedRolePreferences`
  - `LolMatch` challenges: `firstTurretKilledTime`, `highestWardKills?`, `soloTurretsLategame?`
  - `LolMatchTimeline` events: `bounty?`, `killStreakLength?`, `killerId?`, `position?`, `shutdownBounty?`, `victimId?`, and full victim damage arrays
  - `ChampionMastery`: `milestoneGrades` is now `string[]` (was `unknown[]`, optional)
  - `lol-challenges-v1`: several tier thresholds widened from `integer` to `number`

## 0.2.7

### Patch Changes

- [`c4a01ce`](https://github.com/wardbox/whisper/commit/c4a01ce70493f41c7318fcb7fd1a8010869e6071) Thanks [@wardbox](https://github.com/wardbox)! - Update README with documentation site links and Riot ID quickstart example

## 0.2.6

### Patch Changes

- [`cc7f020`](https://github.com/wardbox/whisper/commit/cc7f02069b414c8a275c8da868b1e429921725a9) Thanks [@wardbox](https://github.com/wardbox)! - chore: verify OIDC publish with npm 11.5.1+

## 0.2.5

### Patch Changes

- [`6140d9f`](https://github.com/wardbox/whisper/commit/6140d9f61f38c321a501753fe672f73222311804) Thanks [@wardbox](https://github.com/wardbox)! - chore: verify OIDC publish with stripped \_authToken

## 0.2.4

### Patch Changes

- [`dd9b8b8`](https://github.com/wardbox/whisper/commit/dd9b8b8ce3730d5fe3b2c49a3725a5b41fcb8716) Thanks [@wardbox](https://github.com/wardbox)! - chore: verify OIDC publish without registry-url interference

## 0.2.3

### Patch Changes

- [`83d7a34`](https://github.com/wardbox/whisper/commit/83d7a34ca3b31bfa2ae31fcbc4472f37ef55a18c) Thanks [@dylan-snl](https://github.com/dylan-snl)! - chore: verify OIDC publish via npm CLI

## 0.2.2

### Patch Changes

- [`8a6d344`](https://github.com/wardbox/whisper/commit/8a6d3449ddaca749cee07d1ce952e4bca2a0be9c) Thanks [@dylan-snl](https://github.com/dylan-snl)! - chore: verify OIDC-based CI publish pipeline

## 0.2.1

### Patch Changes

- [`d2cd3d1`](https://github.com/wardbox/whisper/commit/d2cd3d18b6411b0a8a53a10a00c3c62abe2b166d) Thanks [@dylan-snl](https://github.com/dylan-snl)! - chore: verify automated CI publish pipeline

## 0.2.0

### Minor Changes

- [`d6b0fad`](https://github.com/wardbox/whisper/commit/d6b0fad422eee59f74ac3d9f69f36d2a121a3910) Thanks [@wardbox](https://github.com/wardbox)! - Initial release of @wardbox/whisper — zero-dependency TypeScript library wrapping every Riot Games API endpoint with proactive rate limiting and tree-shakeable per-game imports.
