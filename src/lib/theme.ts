export const themes = [
  { id: 'cerberus', label: 'Cerberus', emoji: '🐺' },
  { id: 'mona', label: 'Mona', emoji: '🐙' },
  { id: 'wintry', label: 'Wintry', emoji: '🌨️' },
  { id: 'crimson', label: 'Crimson', emoji: '🔴' },
  { id: 'mint', label: 'Mint', emoji: '🍃' },
  { id: 'rose', label: 'Rose', emoji: '🌷' },
  { id: 'sahara', label: 'Sahara', emoji: '🏜️' },
  { id: 'hamlindigo', label: 'Hamlindigo', emoji: '👔' },
  { id: 'nouveau', label: 'Nouveau', emoji: '🎨' },
  { id: 'terminus', label: 'Terminus', emoji: '🌑' },
  { id: 'vox', label: 'Vox', emoji: '👾' },
  { id: 'catppuccin', label: 'Catppuccin', emoji: '🐱' },
] as const;

export type ThemeId = typeof themes[number]['id'];

export const DEFAULT_THEME: ThemeId = 'cerberus';
export const DEFAULT_DARK = false;