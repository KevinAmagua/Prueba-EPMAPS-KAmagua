/** Paleta semántica institucional usada por las pantallas de campo EPMAPS. */

export const Colors = {
  primary: '#1E40AF',
  secondary: '#2563EB',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  danger: '#DC2626',
  success: '#047857',
  border: '#E2E8F0',
  warning: '#F59E0B',
  process: '#EF6C00',
  analytics: '#7B1FA2',
  special: '#C2185B',
  info: '#64B5F6',
} as const;

export type EpmapsColorKey = keyof typeof Colors;
