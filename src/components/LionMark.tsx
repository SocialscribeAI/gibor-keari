import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

/**
 * Stylized standing lion mark — geometric, monastic, dignified.
 * Used on splash, profile header, milestone hero.
 *
 * Pure SVG so it scales perfectly and inherits theme colors.
 */
interface LionMarkProps {
  size?: number;
  color?: string;
  accentColor?: string;
}

export const LionMark: React.FC<LionMarkProps> = ({
  size = 96,
  color = '#C89A3C',
  accentColor,
}) => {
  const detail = accentColor ?? color;
  return (
    <Svg width={size} height={size} viewBox="0 0 96 96" fill="none">
      {/* Mane — radiating geometric triangles around the head */}
      <Path
        d="M48 6 L54 18 L62 12 L60 24 L72 22 L66 32 L78 36 L68 42 L80 50 L68 52 L74 62 L64 60 L66 72 L56 66 L54 76 L48 68 L42 76 L40 66 L30 72 L32 60 L22 62 L28 52 L16 50 L28 42 L18 36 L30 32 L24 22 L36 24 L34 12 L42 18 Z"
        fill={color}
        opacity={0.95}
      />
      {/* Face */}
      <Circle cx={48} cy={46} r={16} fill={detail} opacity={0.22} />
      {/* Eyes — dignified, watchful */}
      <Circle cx={42} cy={44} r={1.8} fill={detail} />
      <Circle cx={54} cy={44} r={1.8} fill={detail} />
      {/* Nose */}
      <Path d="M46 50 L50 50 L48 53 Z" fill={detail} />
      {/* Mouth — subtle, closed (strength, restraint) */}
      <Path
        d="M44 56 Q48 58 52 56"
        stroke={detail}
        strokeWidth={1.2}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
};
