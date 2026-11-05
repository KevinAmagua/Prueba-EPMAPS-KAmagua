/**
 * Paleta y sombras definidas en PROJECT_CONTEXT.md para el Taller 7
 * (mapa Leaflet + Lottie + registro de lecturas con GPS).
 *
 * Se mantiene separada de `Colors` para no alterar el tema institucional
 * que ya usan las pantallas offline-first existentes.
 */
export const TallerColors = {
  brand: '#1E40AF',
  accent: '#3B82F6',
  success: '#10B981',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  danger: '#DC2626',
  warning: '#F59E0B',
  softBrand: '#DBEAFE',
  softSuccess: '#D1FAE5',
  softDanger: '#FEE2E2',
  overlay: 'rgba(15, 23, 42, 0.55)',
} as const;

export const cardShadow = {
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.08,
  shadowRadius: 10,
  elevation: 3,
} as const;
