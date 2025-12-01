import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Polyline } from 'react-native-svg';

interface AppLogoProps {
  size?: number;
  color?: string;
  showText?: boolean;
}

export default function AppLogo({ size = 80, color = '#2E7D32', showText = true }: AppLogoProps) {
  const iconSize = size * 0.6;
  const fontSize = size * 0.25;

  return (
    <View style={styles.container}>
      <Svg width={iconSize} height={iconSize} viewBox="0 0 100 100">
        <Path
          d="M50 10 L50 70"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
        />
        
        <Path
          d="M40 20 Q35 25 40 30"
          stroke={color}
          strokeWidth="3"
          fill="none"
        />
        <Path
          d="M45 25 Q42 30 45 35"
          stroke={color}
          strokeWidth="3"
          fill="none"
        />
        <Path
          d="M55 25 Q58 30 55 35"
          stroke={color}
          strokeWidth="3"
          fill="none"
        />
        <Path
          d="M60 20 Q65 25 60 30"
          stroke={color}
          strokeWidth="3"
          fill="none"
        />
        
        <Path
          d="M35 15 Q30 22 35 29"
          stroke={color}
          strokeWidth="2.5"
          fill="none"
        />
        <Path
          d="M65 15 Q70 22 65 29"
          stroke={color}
          strokeWidth="2.5"
          fill="none"
        />
        
        <Circle cx="50" cy="72" r="3" fill={color} />
        <Circle cx="48" cy="75" r="2" fill={color} opacity="0.7" />
        <Circle cx="52" cy="75" r="2" fill={color} opacity="0.7" />
        
        <Polyline
          points="20,90 30,75 40,82 50,65 60,78 70,70 80,85"
          stroke="#F4C542"
          strokeWidth="3"
          fill="none"
          strokeLinejoin="round"
        />
        <Circle cx="20" cy="90" r="2.5" fill="#F4C542" />
        <Circle cx="30" cy="75" r="2.5" fill="#F4C542" />
        <Circle cx="40" cy="82" r="2.5" fill="#F4C542" />
        <Circle cx="50" cy="65" r="2.5" fill="#F4C542" />
        <Circle cx="60" cy="78" r="2.5" fill="#F4C542" />
        <Circle cx="70" cy="70" r="2.5" fill="#F4C542" />
        <Circle cx="80" cy="85" r="2.5" fill="#F4C542" />
      </Svg>
      
      {showText && (
        <View style={styles.textContainer}>
          <Text style={[styles.text, { fontSize, color }]}>
            <Text style={styles.textBold}>Ani</Text>
            <Text>Lytics</Text>
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    marginTop: 8,
  },
  text: {
    fontWeight: '400' as const,
  },
  textBold: {
    fontWeight: '700' as const,
  },
});
