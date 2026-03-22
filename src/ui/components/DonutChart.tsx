import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { G, Circle } from 'react-native-svg';
import { theme } from '../theme';

interface Props {
  data: { type: string; value: number }[];
  totalValue: number;
}

const COLORS = {
  Stock: '#00E676', // accent green
  ETF: '#00B0FF',   // info blue
  MF: '#D500F9',    // purple
};

export const DonutChart = ({ data, totalValue }: Props) => {
  const size = 160;
  const strokeWidth = 20;
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  let currentAngle = 0;

  if (totalValue === 0) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Svg width={size} height={size}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={theme.colors.navyLight}
            strokeWidth={strokeWidth}
            fill="none"
          />
        </Svg>
        <View style={styles.centerContent}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>$0.00</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${center}, ${center}`}>
          {data.map((item, index) => {
            const percentage = item.value / totalValue;
            const strokeDasharray = `${circumference * percentage} ${circumference}`;
            const strokeDashoffset = -currentAngle;
            
            currentAngle += circumference * percentage;

            return (
              <Circle
                key={index}
                cx={center}
                cy={center}
                r={radius}
                stroke={COLORS[item.type as keyof typeof COLORS] || theme.colors.textMuted}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="butt"
              />
            );
          })}
        </G>
      </Svg>
      <View style={styles.centerContent}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>
          ${totalValue >= 1000 ? (totalValue / 1000).toFixed(1) + 'k' : totalValue.toFixed(0)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { justifyContent: 'center', alignItems: 'center' },
  centerContent: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  totalLabel: { color: theme.colors.textMuted, fontSize: 12 },
  totalValue: { color: theme.colors.textPrimary, fontSize: 20, fontWeight: 'bold' },
});
