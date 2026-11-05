import { Fragment, useMemo } from 'react';
import { Platform, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

const VIEWBOX_WIDTH = 400;
const VIEWBOX_HEIGHT = 900;
export const COLORES_CURVAS_DE_NIVEL = {
  fondo: '#DCEBFF',
  lineas: '#1F3C88',
  maestras: '#FFFFFF',
  cumbre: '#4C78C4',
} as const;

type ColoresCurvas = Partial<Record<keyof typeof COLORES_CURVAS_DE_NIVEL, string>>;

type Curva = {
  d: string;
  maestra: boolean;
};

type CentroCurvas = {
  x: number;
  y: number;
  cantidad: number;
  separacion: number;
  fase: number;
};

const centros: CentroCurvas[] = [
  { x: 82, y: 145, cantidad: 10, separacion: 17, fase: 0.2 },
  { x: 325, y: 430, cantidad: 10, separacion: 17, fase: 1.6 },
  { x: 95, y: 755, cantidad: 9, separacion: 17, fase: 2.8 },
];

function generarCurvas(): Curva[] {
  const puntosPorCurva = 80;
  const curvas: Curva[] = [];

  for (const centro of centros) {
    for (let nivel = 0; nivel < centro.cantidad; nivel += 1) {
      const radio = 18 + nivel * centro.separacion;
      const puntos: string[] = [];

      for (let indice = 0; indice < puntosPorCurva; indice += 1) {
        const angulo = (indice / puntosPorCurva) * Math.PI * 2;
        const variacion =
          1 +
          0.075 * Math.sin(angulo * 3 + centro.fase + nivel * 0.13) +
          0.035 * Math.cos(angulo * 5 - centro.fase);
        const x = centro.x + radio * variacion * Math.cos(angulo) * 1.13;
        const y = centro.y + radio * variacion * Math.sin(angulo) * 0.76;

        puntos.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
      }

      curvas.push({
        d: `M ${puntos.join(' L ')} Z`,
        maestra: (nivel + 1) % 4 === 0,
      });
    }
  }

  return curvas;
}

type CurvasDeNivelProps = {
  colores?: ColoresCurvas;
};

export function CurvasDeNivel({ colores: coloresPersonalizados }: CurvasDeNivelProps) {
  const curvas = useMemo(() => generarCurvas(), []);
  const colores = { ...COLORES_CURVAS_DE_NIVEL, ...coloresPersonalizados };
  const accessibilityProps =
    Platform.OS === 'web'
      ? {}
      : {
          accessibilityElementsHidden: true,
          importantForAccessibility: 'no-hide-descendants' as const,
        };

  return (
    <Svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      preserveAspectRatio="xMidYMin slice"
      style={styles.svg}
      pointerEvents="none"
      {...accessibilityProps}>
      <Rect
        x={0}
        y={0}
        width={VIEWBOX_WIDTH}
        height={VIEWBOX_HEIGHT}
        fill={colores.fondo}
      />
      {curvas.map((curva, indice) => (
        <Path
          key={indice}
          d={curva.d}
          fill="none"
          stroke={curva.maestra ? colores.maestras : colores.lineas}
          strokeWidth={curva.maestra ? 1.8 : 1}
          strokeOpacity={curva.maestra ? 0.9 : 0.3}
        />
      ))}
      {centros.map((centro) => (
        <Fragment key={`${centro.x}-${centro.y}`}>
          <Circle cx={centro.x} cy={centro.y} r={3.5} fill={colores.cumbre} />
          <Circle
            cx={centro.x}
            cy={centro.y}
            r={7}
            fill="none"
            stroke={colores.cumbre}
            strokeOpacity={0.65}
            strokeWidth={1}
          />
        </Fragment>
      ))}
    </Svg>
  );
}

const styles = StyleSheet.create({
  svg: {
    ...StyleSheet.absoluteFill,
  },
});
