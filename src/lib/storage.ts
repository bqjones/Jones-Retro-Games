import { get, set, del, keys } from 'idb-keyval';
import type { SaveState, GameSettings } from '../types/game';

const SETTINGS_KEY = 'jones-retro-settings';
const SAVE_PREFIX = 'save:';

// Default settings
const defaultSettings: GameSettings = {
  volume: 80,
  scanlines: true,
  aspectRatio: '4:3',
};

// Settings
export async function getSettings(): Promise<GameSettings> {
  const settings = await get<GameSettings>(SETTINGS_KEY);
  return settings ?? defaultSettings;
}

export async function saveSettings(settings: GameSettings): Promise<void> {
  await set(SETTINGS_KEY, settings);
}

// Save States
function getSaveKey(gameId: string, slot: number): string {
  return `${SAVE_PREFIX}${gameId}:${slot}`;
}

export async function getSaveState(
  gameId: string,
  slot: number
): Promise<SaveState | undefined> {
  return get<SaveState>(getSaveKey(gameId, slot));
}

export async function writeSaveState(saveState: SaveState): Promise<void> {
  await set(getSaveKey(saveState.gameId, saveState.slot), saveState);
}

export async function deleteSaveState(
  gameId: string,
  slot: number
): Promise<void> {
  await del(getSaveKey(gameId, slot));
}

export async function getAllSaveStates(gameId: string): Promise<SaveState[]> {
  const allKeys = await keys();
  const saveKeys = allKeys.filter(
    (key) => typeof key === 'string' && key.startsWith(`${SAVE_PREFIX}${gameId}:`)
  );

  const saves: SaveState[] = [];
  for (const key of saveKeys) {
    const save = await get<SaveState>(key as string);
    if (save) saves.push(save);
  }

  return saves.sort((a, b) => b.timestamp - a.timestamp);
}
