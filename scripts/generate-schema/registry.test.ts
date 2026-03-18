import { describe, expect, it } from 'vitest';
import { ENDPOINT_REGISTRY } from './registry.js';

describe('ENDPOINT_REGISTRY', () => {
  it('contains entries for LoL game prefix', () => {
    const lolGroups = ENDPOINT_REGISTRY.filter((g) => g.game === 'lol');
    expect(lolGroups.length).toBeGreaterThanOrEqual(10);
  });

  it('contains entries for TFT game prefix', () => {
    const tftGroups = ENDPOINT_REGISTRY.filter((g) => g.game === 'tft');
    expect(tftGroups.length).toBeGreaterThanOrEqual(5);
  });

  it('contains entries for Valorant game prefix', () => {
    const valGroups = ENDPOINT_REGISTRY.filter((g) => g.game === 'val');
    expect(valGroups.length).toBeGreaterThanOrEqual(4);
  });

  it('contains entries for LoR game prefix', () => {
    const lorGroups = ENDPOINT_REGISTRY.filter((g) => g.game === 'lor');
    expect(lorGroups.length).toBeGreaterThanOrEqual(3);
  });

  it('contains entries for riot (shared) game prefix', () => {
    const riotGroups = ENDPOINT_REGISTRY.filter((g) => g.game === 'riot');
    expect(riotGroups.length).toBeGreaterThanOrEqual(1);
  });

  it('does not contain RSO-only groups', () => {
    const names = ENDPOINT_REGISTRY.map((g) => g.name);
    expect(names).not.toContain('lol-rso-match-v1');
    expect(names).not.toContain('lor-deck-v1');
    expect(names).not.toContain('lor-inventory-v1');
  });

  it('does not contain tournament groups', () => {
    const names = ENDPOINT_REGISTRY.map((g) => g.name);
    expect(names).not.toContain('tournament-v5');
    expect(names).not.toContain('tournament-stub-v5');
  });

  it('has at least one endpoint per group', () => {
    for (const group of ENDPOINT_REGISTRY) {
      expect(group.endpoints.length, `${group.name} should have endpoints`).toBeGreaterThanOrEqual(
        1,
      );
    }
  });

  it('uses regional routing for match-v5', () => {
    const matchV5 = ENDPOINT_REGISTRY.find((g) => g.name === 'match-v5');
    expect(matchV5).toBeDefined();
    expect(matchV5?.routing).toBe('regional');
  });

  it('uses regional routing for account-v1', () => {
    const accountV1 = ENDPOINT_REGISTRY.find((g) => g.name === 'account-v1');
    expect(accountV1).toBeDefined();
    expect(accountV1?.routing).toBe('regional');
  });

  it('uses regional routing for tft-match-v1', () => {
    const tftMatch = ENDPOINT_REGISTRY.find((g) => g.name === 'tft-match-v1');
    expect(tftMatch).toBeDefined();
    expect(tftMatch?.routing).toBe('regional');
  });

  it('uses regional routing for lor-match-v1', () => {
    const lorMatch = ENDPOINT_REGISTRY.find((g) => g.name === 'lor-match-v1');
    expect(lorMatch).toBeDefined();
    expect(lorMatch?.routing).toBe('regional');
  });

  it('uses regional routing for lor-ranked-v1', () => {
    const lorRanked = ENDPOINT_REGISTRY.find((g) => g.name === 'lor-ranked-v1');
    expect(lorRanked).toBeDefined();
    expect(lorRanked?.routing).toBe('regional');
  });

  it('has a reasonable total endpoint count (60-90)', () => {
    const totalEndpoints = ENDPOINT_REGISTRY.reduce((sum, g) => sum + g.endpoints.length, 0);
    expect(totalEndpoints).toBeGreaterThanOrEqual(60);
    expect(totalEndpoints).toBeLessThanOrEqual(90);
  });

  it('has at least 20 endpoint groups', () => {
    expect(ENDPOINT_REGISTRY.length).toBeGreaterThanOrEqual(20);
  });

  it('has valid methodId format for all endpoints', () => {
    for (const group of ENDPOINT_REGISTRY) {
      for (const endpoint of group.endpoints) {
        expect(endpoint.methodId, `${endpoint.methodId} should contain a dot`).toMatch(/\./);
      }
    }
  });

  it('has valid path format for all endpoints', () => {
    for (const group of ENDPOINT_REGISTRY) {
      for (const endpoint of group.endpoints) {
        expect(endpoint.path, `${endpoint.path} should start with /`).toMatch(/^\//);
      }
    }
  });

  it('has responseName for all endpoints', () => {
    for (const group of ENDPOINT_REGISTRY) {
      for (const endpoint of group.endpoints) {
        expect(
          endpoint.responseName,
          `${group.name}.${endpoint.methodId} needs responseName`,
        ).toBeTruthy();
      }
    }
  });

  it('account-v1 does not include RSO endpoints', () => {
    const accountV1 = ENDPOINT_REGISTRY.find((g) => g.name === 'account-v1');
    expect(accountV1).toBeDefined();
    const paths = accountV1?.endpoints.map((e) => e.path) ?? [];
    expect(paths.some((p) => p.includes('/accounts/me'))).toBe(false);
    expect(paths.some((p) => p.includes('/by-access-token'))).toBe(false);
  });
});
