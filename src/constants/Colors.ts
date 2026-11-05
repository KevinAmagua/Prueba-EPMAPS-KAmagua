/** Paleta semántica institucional usada por las pantallas de campo EPMAPS. */

export const Colors = {
  primary: '#357ca5',
  secondary: '#001F3F',
  background: '#e2e4e9',
  surface: '#FFFFFF',
  textPrimary: '#111111',
  textSecondary: '#001F3F',
  danger: '#d33724',
  success: '#5ac594',
  border: '#b5bbc8',
  warning: '#f7bf65',
  process: '#357ca5',
  analytics: '#001F3F',
  special: '#d33724',
  info: '#357ca5',
  successText: '#111111',
} as const;

export type EpmapsColorKey = keyof typeof Colors;
