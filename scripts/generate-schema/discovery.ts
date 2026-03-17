import type { DiscoveredData } from './types.js';

/**
 * Minimal client interface for discovery.
 *
 * Uses a loose type to avoid importing WhisperClient directly
 * (scripts/ is outside the package). The actual client instance
 * is passed in from the orchestrator.
 */
interface ApiClient {
  request<T>(
    route: string,
    path: string,
    methodId: string,
    options?: { params?: Record<string, string> },
  ): Promise<{ data: T; status: number; headers: Record<string, string> }>;
}

/**
 * Dynamically discover valid test data from the live Riot API.
 *
 * Uses high-level endpoints (challenger leagues, leaderboards, content)
 * to find PUUIDs, match IDs, and other path parameters at runtime.
 * Each step has try/catch so partial failures don't block the entire run.
 */
export async function discoverData(client: ApiClient): Promise<DiscoveredData> {
  const data: DiscoveredData = {
    puuid: '',
    gameName: '',
    tagLine: '',
    matchId: '',
  };

  // Step 1: Get a PUUID from LoL challenger league
  try {
    console.log('[discovery] Fetching LoL challenger league...');
    const league = await client.request<{
      entries: Array<{ puuid: string }>;
    }>(
      'na1',
      '/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5',
      'league-v4.getChallengerLeague',
    );
    if (league.data.entries?.length > 0) {
      data.puuid = league.data.entries[0].puuid;
      console.log('[discovery] Found LoL PUUID: found');
    }
  } catch (err) {
    console.warn('[discovery] Failed to fetch LoL challenger league:', (err as Error).message);
  }

  // Step 2: Get Riot ID from account-v1
  if (data.puuid) {
    try {
      console.log('[discovery] Fetching account info...');
      const account = await client.request<{ gameName: string; tagLine: string }>(
        'americas',
        `/riot/account/v1/accounts/by-puuid/${data.puuid}`,
        'account-v1.getByPuuid',
      );
      data.gameName = account.data.gameName;
      data.tagLine = account.data.tagLine;
      console.log('[discovery] Found Riot ID: found');
    } catch (err) {
      console.warn('[discovery] Failed to fetch account info:', (err as Error).message);
    }
  }

  // Step 3: Get LoL match IDs
  if (data.puuid) {
    try {
      console.log('[discovery] Fetching LoL match IDs...');
      const matchIds = await client.request<string[]>(
        'americas',
        `/lol/match/v5/matches/by-puuid/${data.puuid}/ids`,
        'match-v5.getMatchIdsByPuuid',
        { params: { count: '5' } },
      );
      if (matchIds.data.length > 0) {
        data.matchId = matchIds.data[0];
        console.log('[discovery] Found LoL match: found');
      }
    } catch (err) {
      console.warn('[discovery] Failed to fetch LoL match IDs:', (err as Error).message);
    }
  }

  // Step 5: Get TFT data
  try {
    console.log('[discovery] Fetching TFT challenger league...');
    const tftLeague = await client.request<{
      entries: Array<{ puuid: string }>;
    }>('na1', '/tft/league/v1/challenger', 'tft-league-v1.getChallenger');
    if (tftLeague.data.entries?.length > 0) {
      data.tftPuuid = tftLeague.data.entries[0].puuid;
      console.log('[discovery] Found TFT PUUID: found');

      // Get TFT match IDs
      try {
        const tftMatchIds = await client.request<string[]>(
          'americas',
          `/tft/match/v1/matches/by-puuid/${data.tftPuuid}/ids`,
          'tft-match-v1.getMatchIdsByPuuid',
          { params: { count: '5' } },
        );
        if (tftMatchIds.data.length > 0) {
          data.tftMatchId = tftMatchIds.data[0];
          console.log('[discovery] Found TFT match: found');
        }
      } catch (err) {
        console.warn('[discovery] Failed to fetch TFT match IDs:', (err as Error).message);
      }
    }
  } catch (err) {
    console.warn('[discovery] Failed to fetch TFT challenger league:', (err as Error).message);
  }

  // Step 6: Get Valorant actId from content
  try {
    console.log('[discovery] Fetching Valorant content...');
    const content = await client.request<{
      acts: Array<{ id: string; isActive: boolean }>;
    }>('na1', '/val/content/v1/contents', 'val-content-v1.getContent');
    const activeAct = content.data.acts?.find((a) => a.isActive);
    if (activeAct) {
      data.valActId = activeAct.id;
      console.log('[discovery] Found Valorant act: found');
    }
  } catch (err) {
    console.warn('[discovery] Failed to fetch Valorant content:', (err as Error).message);
  }

  // Step 7: Get LoR data from ranked leaderboard
  try {
    console.log('[discovery] Fetching LoR leaderboard...');
    const lorLeaderboard = await client.request<{
      players: Array<{ name: string }>;
    }>('americas', '/lor/ranked/v1/leaderboards', 'lor-ranked-v1.getLeaderboard');
    if (lorLeaderboard.data.players?.length > 0) {
      const playerName = lorLeaderboard.data.players[0].name;
      // Attempt to find the LoR player's PUUID via account lookup
      try {
        // LoR leaderboard returns just name, try as gameName with common tagLines
        const lorAccount = await client.request<{ puuid: string }>(
          'americas',
          `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(playerName)}/NA1`,
          'account-v1.getByRiotId',
        );
        data.lorPuuid = lorAccount.data.puuid;
        console.log('[discovery] Found LoR PUUID: found');

        // Get LoR match IDs
        try {
          const lorMatchIds = await client.request<string[]>(
            'americas',
            `/lor/match/v1/matches/by-puuid/${data.lorPuuid}/ids`,
            'lor-match-v1.getMatchIdsByPuuid',
          );
          if (lorMatchIds.data.length > 0) {
            data.lorMatchId = lorMatchIds.data[0];
            console.log('[discovery] Found LoR match: found');
          }
        } catch (err) {
          console.warn('[discovery] Failed to fetch LoR match IDs:', (err as Error).message);
        }
      } catch (err) {
        console.warn('[discovery] Failed to lookup LoR player account:', (err as Error).message);
      }
    }
  } catch (err) {
    console.warn('[discovery] Failed to fetch LoR leaderboard:', (err as Error).message);
  }

  // Summary
  console.log('[discovery] Discovery complete:');
  console.log(`  LoL PUUID: ${data.puuid ? 'found' : 'MISSING'}`);
  console.log(`  Riot ID: ${data.gameName ? 'found' : 'MISSING'}`);
  console.log(`  LoL Match: ${data.matchId ? 'found' : 'MISSING'}`);
  console.log(`  TFT PUUID: ${data.tftPuuid ? 'found' : 'MISSING'}`);
  console.log(`  TFT Match: ${data.tftMatchId ? 'found' : 'MISSING'}`);
  console.log(`  Val Act ID: ${data.valActId ? 'found' : 'MISSING'}`);
  console.log(`  LoR PUUID: ${data.lorPuuid ? 'found' : 'MISSING'}`);
  console.log(`  LoR Match: ${data.lorMatchId ? 'found' : 'MISSING'}`);

  return data;
}
