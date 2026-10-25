import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyHistory, settingsPending, workReducer } from '../src/lib/studioState';
import type { WorkHistory, WorkSnapshot } from '../src/lib/studioState';

function snapshot(name = '原图', width = 2): WorkSnapshot {
  return {
    selection: { image: { name, width: 2, height: 2, pixels: new Uint8ClampedArray(16), preview: name }, exampleId: null },
    settings: { brand: 'perler', width, height: width, limit: 0, excluded: [], alphaThreshold: 127, background: 'transparent' },
    pattern: { name, width, height: width, brand: 'perler', cells: Array(width * width).fill('P01') },
    edited: false,
  };
}
function generated(original = snapshot()): WorkHistory {
  return workReducer(emptyHistory, { type: 'generated', snapshot: original, replace: true });
}
function paint(state: WorkHistory) {
  return workReducer(state, { type: 'edited', pattern: { ...state.current!.pattern, cells: [null, ...state.current!.pattern.cells.slice(1)] } });
}

test('initial selection has no generated work or undo history', () => {
  assert.equal(emptyHistory.current, null);
  assert.equal(settingsPending(null, snapshot().settings), false);
  assert.deepEqual(workReducer(emptyHistory, { type: 'undo' }), emptyHistory);
});

test('draft settings do not mutate the current chart or its applied configuration', () => {
  const state = generated();
  const draft = { ...state.current!.settings, width: 64, limit: 16 };
  assert.equal(settingsPending(state.current, draft), true);
  assert.equal(state.current!.pattern.width, 2);
  assert.equal(state.current!.settings.limit, 0);
  assert.equal(state.undo.length, 0);
});

test('undo after regeneration restores manual edits, source and applied settings; redo restores generated work', () => {
  const edited = paint(generated());
  const previous = edited.current!;
  const next = { ...snapshot('原图', 4), selection: previous.selection };
  const updated = workReducer(edited, { type: 'generated', snapshot: next, replace: false });
  assert.equal(updated.current!.edited, false);
  const undone = workReducer(updated, { type: 'undo' });
  assert.equal(undone.current, previous);
  assert.equal(undone.current!.pattern.cells[0], null);
  assert.equal(undone.current!.edited, true);
  assert.equal(settingsPending(undone.current, next.settings), true);
  assert.equal(workReducer(undone, { type: 'redo' }).current, next);
});

test('manual-edit warning clears when editing is undone back to the generated chart', () => {
  const generatedState = generated();
  const edited = paint(generatedState);
  assert.equal(edited.current!.edited, true);
  const undone = workReducer(edited, { type: 'undo' });
  assert.equal(undone.current, generatedState.current);
  assert.equal(undone.current!.edited, false);
  assert.equal(workReducer(undone, { type: 'redo' }).current!.edited, true);
});

test('new source commits start a separate history even when the filenames match', () => {
  const previous = paint(generated(snapshot('same-name')));
  const replacement = snapshot('same-name');
  assert.notEqual(previous.current!.selection, replacement.selection);
  const next = workReducer(previous, { type: 'generated', snapshot: replacement, replace: true });
  assert.equal(next.current, replacement);
  assert.equal(next.undo.length, 0);
  assert.equal(next.redo.length, 0);
});

test('a successful edit or regeneration clears redo; held export snapshots remain unchanged', () => {
  const start = generated();
  const capturedExport = start.current!.pattern;
  const edited = paint(start);
  const undone = workReducer(edited, { type: 'undo' });
  assert.equal(undone.redo.length, 1);
  assert.equal(paint(undone).redo.length, 0);
  assert.equal(workReducer(undone, { type: 'generated', snapshot: snapshot(), replace: false }).redo.length, 0);
  assert.equal(capturedExport.cells[0], 'P01');
  assert.equal(edited.current!.pattern.cells[0], null);
});

test('history retains the latest 40 edits and keeps original snapshots immutable', () => {
  let state = generated();
  const original = state.current!;
  for (let i = 0; i < 50; i++) {
    state = workReducer(state, { type: 'edited', pattern: { ...state.current!.pattern, cells: [String(i), 'P01', 'P01', 'P01'] } });
  }
  assert.equal(state.undo.length, 40);
  assert.equal(original.pattern.cells[0], 'P01');
  assert.equal(state.current!.pattern.cells[0], '49');
});
