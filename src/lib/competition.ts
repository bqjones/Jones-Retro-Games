import type {
  Competition,
  CompetitionConfig,
  Group,
  Metric,
  Player,
  Run,
  Standing,
  Station,
} from '../types/competition';

// Unambiguous alphabet for join codes (no 0/O/1/I).
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const GROUP_NAMES = ['Group A', 'Group B', 'Group C', 'Group D'];
export const GROUP_COLORS = ['#00fff7', '#ffd700', '#39ff14', '#e94560'];

/** Games that compete on fastest time instead of high score. */
const TIME_METRIC_GAMES = new Set(['castle-adventure']);

export const DEFAULT_CONFIG: CompetitionConfig = {
  rotationMinutes: 15,
  pointsTable: [10, 8, 6, 5, 4, 3, 2],
  pointsFloor: 1,
  finalePointsTable: [15, 12, 9, 7, 5],
  finalistCount: 5,
  groupGameId: 'oregon-trail',
  finaleGameId: 'digger',
};

export function generateCode(): string {
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

export function newId(): string {
  return crypto.randomUUID();
}

/** Build a Run record with id + timestamp stamped. */
export function makeRun(
  code: string,
  playerId: string,
  stationId: string,
  round: number,
  value: number,
  dnf = false
): Run {
  return { id: newId(), code, playerId, stationId, round, value, dnf, ts: Date.now() };
}

export function metricForGame(gameId: string): Metric {
  return TIME_METRIC_GAMES.has(gameId) ? 'time' : 'score';
}

/** Deal shuffled players into `groupCount` groups, round-robin. */
export function assignGroups(names: string[], groupCount: number): { players: Player[]; groups: Group[] } {
  const groups: Group[] = Array.from({ length: groupCount }, (_, i) => ({
    id: `g${i}`,
    name: GROUP_NAMES[i] ?? `Group ${i + 1}`,
    color: GROUP_COLORS[i % GROUP_COLORS.length],
  }));
  const shuffled = [...names];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const players = shuffled.map((name, i) => ({
    id: newId(),
    name,
    groupId: groups[i % groupCount].id,
  }));
  return { players, groups };
}

/** Which station a group plays in a given rotation round. */
export function stationForGroup(comp: Competition, groupId: string, round: number): Station | undefined {
  const gi = comp.groups.findIndex((g) => g.id === groupId);
  if (gi < 0) return undefined;
  return comp.stations[(gi + round) % comp.stations.length];
}

/** Which group is at a station in a given rotation round. */
export function groupAtStation(comp: Competition, stationId: string, round: number): Group | undefined {
  const si = comp.stations.findIndex((s) => s.id === stationId);
  if (si < 0) return undefined;
  const gi = (si - round + comp.groups.length * 100) % comp.groups.length;
  return comp.groups[gi];
}

export function totalRounds(comp: Competition): number {
  return comp.stations.length;
}

export function playersInGroup(comp: Competition, groupId: string): Player[] {
  return comp.players.filter((p) => p.groupId === groupId);
}

/** Runs recorded at a station during one rotation round. */
export function runsForStationRound(runs: Run[], stationId: string, round: number): Run[] {
  return runs.filter((r) => r.stationId === stationId && r.round === round);
}

/**
 * Next player up at a station: the group member with the fewest recorded runs
 * this round (earliest roster order breaks ties). Derived from runs so no
 * queue state needs syncing.
 */
export function nextUp(comp: Competition, runs: Run[], stationId: string, round: number): Player | undefined {
  const group = groupAtStation(comp, stationId, round);
  if (!group) return undefined;
  const members = playersInGroup(comp, group.id);
  const counts = new Map<string, number>();
  for (const r of runsForStationRound(runs, stationId, round)) {
    counts.set(r.playerId, (counts.get(r.playerId) ?? 0) + 1);
  }
  let best: Player | undefined;
  let bestCount = Infinity;
  for (const p of members) {
    const c = counts.get(p.id) ?? 0;
    if (c < bestCount) {
      best = p;
      bestCount = c;
    }
  }
  return best;
}

/** Better run wins: higher score, or lower time (DNF loses to any finisher). */
function compareRuns(metric: Metric, a: Run, b: Run): number {
  if (a.dnf !== b.dnf) return a.dnf ? 1 : -1;
  return metric === 'time' ? a.value - b.value : b.value - a.value;
}

/** Each player's single best run at a station round. */
function bestRunsByPlayer(metric: Metric, runs: Run[]): Map<string, Run> {
  const best = new Map<string, Run>();
  for (const r of runs) {
    const prev = best.get(r.playerId);
    if (!prev || compareRuns(metric, r, prev) < 0) best.set(r.playerId, r);
  }
  return best;
}

/**
 * Placement points for one station round: rank best runs, award from the
 * points table. Ties share the higher placement. DNF runs earn the floor.
 */
export function pointsForStationRound(
  comp: Competition,
  runs: Run[],
  stationId: string,
  round: number
): Map<string, number> {
  const station = comp.stations.find((s) => s.id === stationId);
  const table = stationId === 'finale' ? comp.config.finalePointsTable : comp.config.pointsTable;
  const metric: Metric = station?.metric ?? 'score';
  const roundRuns = runsForStationRound(runs, stationId, round);
  const best = [...bestRunsByPlayer(metric, roundRuns).values()].sort((a, b) => compareRuns(metric, a, b));

  const points = new Map<string, number>();
  let place = 0;
  for (let i = 0; i < best.length; i++) {
    const run = best[i];
    if (i > 0 && compareRuns(metric, run, best[i - 1]) > 0) place = i;
    points.set(
      run.playerId,
      run.dnf ? comp.config.pointsFloor : (table[place] ?? comp.config.pointsFloor)
    );
  }
  return points;
}

/** Full standings across all rotation rounds plus the finale. */
export function computeStandings(comp: Competition, runs: Run[]): Standing[] {
  const standings = new Map<string, Standing>();
  for (const p of comp.players) {
    standings.set(p.id, {
      playerId: p.id,
      name: p.name,
      groupId: p.groupId,
      points: 0,
      finalePoints: 0,
      totalPoints: 0,
      bests: {},
      rank: 0,
    });
  }

  for (const station of comp.stations) {
    for (let round = 0; round < totalRounds(comp); round++) {
      const pts = pointsForStationRound(comp, runs, station.id, round);
      for (const [playerId, p] of pts) {
        const s = standings.get(playerId);
        if (s) s.points += p;
      }
    }
    // Best value per station for display
    const best = bestRunsByPlayer(station.metric, runs.filter((r) => r.stationId === station.id));
    for (const [playerId, run] of best) {
      const s = standings.get(playerId);
      if (s && !run.dnf) s.bests[station.id] = run.value;
    }
  }

  const finalePts = pointsForStationRound(comp, runs, 'finale', -1);
  for (const [playerId, p] of finalePts) {
    const s = standings.get(playerId);
    if (s) s.finalePoints = p;
  }

  const list = [...standings.values()];
  for (const s of list) s.totalPoints = s.points + s.finalePoints;
  list.sort((a, b) => b.totalPoints - a.totalPoints || a.name.localeCompare(b.name));
  let rank = 0;
  for (let i = 0; i < list.length; i++) {
    if (i > 0 && list[i].totalPoints < list[i - 1].totalPoints) rank = i;
    list[i].rank = rank + 1;
  }
  return list;
}

/** Top-N by rotation points, seeded for the finale (best seed first). */
export function pickFinalists(comp: Competition, runs: Run[]): string[] {
  const standings = computeStandings(comp, runs);
  return standings.slice(0, comp.config.finalistCount).map((s) => s.playerId);
}

/** ms remaining on the phase clock (0 when expired or untimed). */
export function timeRemaining(comp: Competition, now: number): number {
  if (comp.paused && comp.pausedRemainingMs != null) return comp.pausedRemainingMs;
  if (comp.phaseEndsAt == null) return 0;
  return Math.max(0, comp.phaseEndsAt - now);
}

export function formatClock(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Format a run value for display given the station metric. */
export function formatValue(metric: Metric, value: number): string {
  if (metric === 'time') {
    const totalSec = Math.round(value / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
  return value.toLocaleString();
}

export function createCompetition(
  name: string,
  playerNames: string[],
  stationGameIds: string[],
  config: Partial<CompetitionConfig> = {}
): Competition {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const stations: Station[] = stationGameIds.map((gameId, i) => ({
    id: `s${i}`,
    gameId,
    metric: metricForGame(gameId),
  }));
  const { players, groups } = assignGroups(playerNames, stations.length);
  return {
    code: generateCode(),
    name,
    rev: 1,
    createdAt: Date.now(),
    config: fullConfig,
    players,
    groups,
    stations,
    phase: 'lobby',
    currentRound: 0,
    phaseEndsAt: null,
    paused: false,
    pausedRemainingMs: null,
    revealedCount: 0,
    finalists: [],
  };
}
