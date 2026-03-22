import React from 'react';
import { View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { theme } from '../theme';

interface Props {
  isPositive: boolean;
  width?: number;
  height?: number;
}

export const SparklineRow = ({ isPositive, width = 60, height = 24 }: Props) => {
  const points = React.useMemo(() => {
    let y = height / 2;
    return Array.from({ length: 7 }).map((_, i) => {
      const x = (i / 6) * width;
      const step = (Math.random() - 0.5) * (height / 2);
      y += step;
      if (isPositive && i > 3) y -= Math.random() * (height / 3);
      if (!isPositive && i > 3) y += Math.random() * (height / 3);
      
      y = Math.max(2, Math.min(height - 2, y));
      return `${x},${y}`;
    }).join(' ');
  }, [isPositive, width, height]);

  return (
    <View style={{ width, height, justifyContent: 'center' }}>
      <Svg width={width} height={height}>
        <Polyline
          points={points}
          fill="none"
          stroke={isPositive ? theme.colors.accent : theme.colors.danger}
          strokeWidth="2"
        />
      </Svg>
    </View>
  );
};
