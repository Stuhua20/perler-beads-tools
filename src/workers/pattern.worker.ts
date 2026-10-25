import { generatePattern } from '../lib/process';
import { PALETTES } from '../data/palettes';
import type { Settings, SourceImage } from '../lib/types';
self.onmessage = (
  event: MessageEvent<{ source: SourceImage; settings: Settings; id: number }>,
) => {
  const { source, settings, id } = event.data;
  try {
    self.postMessage({
      id,
      pattern: generatePattern(source, settings, PALETTES[settings.brand]),
    });
  } catch (error) {
    self.postMessage({
      id,
      error: error instanceof Error ? error.message : '生成失败，请重试',
    });
  }
};
