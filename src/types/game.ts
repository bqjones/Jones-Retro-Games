export type Platform = 'dos';

export interface Game {
  id: string;
  title: string;
  platform: Platform;
  year: number;
  publisher: string;
  description: string;
  coverArt?: string;
  romPath?: string; // Path to the game files (zip bundle for DOS)
  embedUrl?: string; // URL to embed game from external source
}

export interface SaveState {
  gameId: string;
  slot: number;
  timestamp: number;
  data: ArrayBuffer;
  screenshot?: string;
}

export interface GameSettings {
  volume: number;
  scanlines: boolean;
  aspectRatio: '4:3' | '16:9' | 'stretch';
}
