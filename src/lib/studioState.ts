import type { PresetId } from '../data/presets';
import type { Pattern, Settings, SourceImage } from './types';

export interface ImageSelection {
  image: SourceImage;
  exampleId: PresetId | null;
}

// A history entry carries everything needed to restore the visible work.
export interface WorkSnapshot {
  selection: ImageSelection;
  settings: Settings;
  pattern: Pattern;
  edited: boolean;
}

export interface WorkHistory {
  current: WorkSnapshot | null;
  undo: WorkSnapshot[];
  redo: WorkSnapshot[];
}

export type WorkAction =
  | { type: 'generated'; snapshot: WorkSnapshot; replace: boolean }
  | { type: 'edited'; pattern: Pattern }
  | { type: 'undo' }
  | { type: 'redo' };

export const emptyHistory: WorkHistory = { current: null, undo: [], redo: [] };

export function workReducer(state: WorkHistory, action: WorkAction): WorkHistory {
  switch (action.type) {
    case 'generated':
      return {
        current: action.snapshot,
        undo: action.replace || !state.current
          ? []
          : [...state.undo.slice(-39), state.current],
        redo: [],
      };
    case 'edited':
      if (!state.current) return state;
      return {
        current: { ...state.current, pattern: action.pattern, edited: true },
        undo: [...state.undo.slice(-39), state.current],
        redo: [],
      };
    case 'undo': {
      const previous = state.undo.at(-1);
      if (!previous || !state.current) return state;
      return {
        current: previous,
        undo: state.undo.slice(0, -1),
        redo: [...state.redo, state.current],
      };
    }
    case 'redo': {
      const next = state.redo.at(-1);
      if (!next || !state.current) return state;
      return {
        current: next,
        undo: [...state.undo.slice(-39), state.current],
        redo: state.redo.slice(0, -1),
      };
    }
  }
}

export function settingsPending(current: WorkSnapshot | null, draft: Settings) {
  return current !== null && JSON.stringify(current.settings) !== JSON.stringify(draft);
}
