import { ThemeId } from '../data/models';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  emoji: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    bg: string;
    accent: string;
  };
  speechTriggerKey: string;
  /** Returns SVG string for the theme illustration based on progress (0 to 1) */
  renderIllustration(progress: number): string;
  /** Returns the stamp sheet background/decoration SVG */
  renderStampDecoration(): string;
  /** Returns individual stamp SVG */
  renderStamp(completed: boolean): string;
}
