/**
 * Theme registry - exports all available themes and a lookup function.
 */

import type { ThemeConfig } from './types';
import type { ThemeId } from '../data/models';
import { spaceTheme } from './space';
import { cleanupTheme } from './cleanup';
import { zooTheme } from './zoo';

const themes: ThemeConfig[] = [spaceTheme, cleanupTheme, zooTheme];
const themeMap = new Map<ThemeId, ThemeConfig>(themes.map(t => [t.id, t]));

export function getAllThemes(): ThemeConfig[] {
  return themes;
}

export function getThemeConfig(id: ThemeId): ThemeConfig {
  return themeMap.get(id) ?? themes[0];
}
