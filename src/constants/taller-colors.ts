/**
 * Tokens visuales compartidos por las pantallas de campo, mapas y estados.
 */
export const TallerColors = {
  brand: '#001F3F',
  accent: '#357ca5',
  success: '#5ac594',
  background: '#e2e4e9',
  surface: '#FFFFFF',
  textPrimary: '#111111',
  textSecondary: '#001F3F',
  border: '#b5bbc8',
  danger: '#d33724',
  warning: '#f7bf65',
  softBrand: '#e2e4e9',
  softSuccess: '#5ac594',
  softDanger: '#FFFFFF',
  successText: '#111111',
  overlay: 'rgba(0, 31, 63, 0.62)',
} as const;

export const cardShadow = {
  shadowColor: '#001F3F',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.14,
  shadowRadius: 12,
  elevation: 4,
} as const;

export const FontFamily = {
  display: 'BigShoulders_700Bold',
  regular: 'SpaceGrotesk_400Regular',
  medium: 'SpaceGrotesk_500Medium',
  semibold: 'SpaceGrotesk_600SemiBold',
  bold: 'SpaceGrotesk_700Bold',
} as const;
