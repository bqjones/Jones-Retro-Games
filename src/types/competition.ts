// Types for the family competition system.
// A Competition is a single synced document (last-write-wins via `rev`);
// Runs are append-only score records. Everything else is derived.

export type Phase =
  | 'lobby' // kids arriving, roster on TV
  | 'rotation' // a timed rotation round is running
  | 'rotate' // interstitial: groups move to their next station
  | 'group' // whole-room Oregon Trail on the TV
  | 'finaleReveal' // top finalists announced one by one
  | 'finale' // finalists play on the TV
  | 'trophy'; // champion + confetti

/** How a station measures a run. */
export type Metric = 'score' | 'time';

export interface Player {
  id: string;
  name: string;
  groupId: string;
}

export interface Group {
  id: string;
  /** Display name: "Group A" etc. */
  name: string;
  /** Retro palette color for badges. */
  color: string;
}

export interface Station {
  id: string;
  gameId: string;
  metric: Metric;
}

export interface CompetitionConfig {
  rotationMinutes: number;
  /** Placement points within one station round, best first. Past the end: pointsFloor. */
  pointsTable: number[];
  /** Points below the table (played but placed low), and for DNF runs. */
  pointsFloor: number;
  /** Placement points for the finale, best first. */
  finalePointsTable: number[];
  finalistCount: number;
  groupGameId: string;
  finaleGameId: string;
}

export interface Competition {
  code: string;
  name: string;
  /** Monotonic revision for last-write-wins sync. */
  rev: number;
  createdAt: number;
  config: CompetitionConfig;
  players: Player[];
  groups: Group[];
  stations: Station[];
  phase: Phase;
  /** Rotation round index (0-based). Also set during 'rotate' to the round just finished. */
  currentRound: number;
  /** Epoch ms when the current timed phase ends; null when untimed. */
  phaseEndsAt: number | null;
  /** True when host paused the clock; remainingMs holds time left. */
  paused: boolean;
  pausedRemainingMs: number | null;
  /** How many finalists have been revealed so far (finaleReveal phase). */
  revealedCount: number;
  /** Player ids seeded into the finale, best seed first. Set when reveal starts. */
  finalists: string[];
}

export interface Run {
  id: string;
  code: string;
  playerId: string;
  /** Station id, or 'finale' for finale runs. */
  stationId: string;
  /** Rotation round index, or -1 for finale runs. */
  round: number;
  /** Score (higher wins) or elapsed ms (lower wins) depending on station metric. */
  value: number;
  /** Played but did not finish (time stations): ranks below all finishers. */
  dnf: boolean;
  ts: number;
}

/** A player's computed standing. */
export interface Standing {
  playerId: string;
  name: string;
  groupId: string;
  points: number;
  finalePoints: number;
  totalPoints: number;
  /** Best run value per station id (for display). */
  bests: Record<string, number>;
  rank: number;
}
