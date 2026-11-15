export interface GameOptions {
  music: boolean;
  sfx: boolean;
  haptics: boolean;
  ghostPiece: boolean;
  showTouchControls: boolean;
}

export interface SaveData {
  unlockedLevel: number;
  newlyUnlockedLevel: number | null;
  levelStars: Record<number, number>;
  bestScores: Record<number, number>;
  collectedCats: Record<string, number>;
  pawsCurrency: number;
  unlockedThemes: string[];
  activeTheme: string;
  options: GameOptions;
}

const STORAGE_KEY = 'catris_blocks_save_v1';

const DEFAULT_SAVE: SaveData = {
  unlockedLevel: 1,
  newlyUnlockedLevel: 1,
  levelStars: {},
  bestScores: {},
  collectedCats: {},
  pawsCurrency: 0,
  unlockedThemes: ['navy'],
  activeTheme: 'navy',
  options: {
    music: true,
    sfx: true,
    haptics: true,
    ghostPiece: true,
    showTouchControls: true,
  },
};

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_SAVE);
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return {
      ...DEFAULT_SAVE,
      ...parsed,
      collectedCats: {
        ...(parsed.collectedCats ?? {}),
      },
      options: {
        ...DEFAULT_SAVE.options,
        ...(parsed.options ?? {}),
      },
      unlockedThemes: parsed.unlockedThemes?.length
        ? parsed.unlockedThemes
        : ['navy'],
    };
  } catch {
    return structuredClone(DEFAULT_SAVE);
  }
}

export function writeSave(data: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
}
