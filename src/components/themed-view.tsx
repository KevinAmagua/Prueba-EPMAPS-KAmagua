import { View, type ViewProps } from 'react-native';

import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedViewProps = ViewProps & {
  /** Props heredadas del tema; actualmente no se usan para elegir el fondo. */
  lightColor?: string;
  darkColor?: string;
  /** Clave del color de fondo dentro de la paleta activa. */
  type?: ThemeColor;
};

/** Contenedor cuyo fondo se elige de la paleta activa mediante `type`. */
export function ThemedView({ style, lightColor, darkColor, type, ...otherProps }: ThemedViewProps) {
  const theme = useTheme();

  return <View style={[{ backgroundColor: theme[type ?? 'background'] }, style]} {...otherProps} />;
}
