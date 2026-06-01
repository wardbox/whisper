---
"@wardbox/whisper": minor
---

Update types to match current Riot API response shapes (confirmed against live API):

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
