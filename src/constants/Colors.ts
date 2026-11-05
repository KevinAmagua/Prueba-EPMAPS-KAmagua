/** Paleta semántica institucional usada por las pantallas de campo EPMAPS. */

export const Colors = {
  primary: '#1F3C88',
  secondary: '#4C78C4',
  background: '#F4F6F9',
  surface: '#FFFFFF',
  textPrimary: '#1A2530',
  textSecondary: '#5A6B7C',
  danger: '#C62828',
  success: '#2E7D32',
  border: '#D7DEE8',
  warning: '#C0CA33',
  process: '#EF6C00',
  analytics: '#7B1FA2',
  special: '#C2185B',
  info: '#64B5F6',
} as const;

export type EpmapsColorKey = keyof typeof Colors;
