import { Dimensions, Platform, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const isTablet = SCREEN_WIDTH >= 600;
export const isSmallPhone = SCREEN_WIDTH < 375;

const baseWidth = 375;
const scale = SCREEN_WIDTH / baseWidth;

export function normalize(size: number): number {
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  }
  return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
}

export const responsive = {
  fontSize: {
    tiny: normalize(10),
    small: normalize(12),
    regular: normalize(14),
    medium: normalize(16),
    large: normalize(18),
    xlarge: normalize(20),
    xxlarge: normalize(24),
    huge: normalize(32),
    massive: normalize(48),
  },
  spacing: {
    tiny: normalize(4),
    small: normalize(8),
    regular: normalize(12),
    medium: normalize(16),
    large: normalize(20),
    xlarge: normalize(24),
    xxlarge: normalize(32),
    huge: normalize(48),
  },
  iconSize: {
    small: normalize(16),
    regular: normalize(20),
    medium: normalize(24),
    large: normalize(32),
    xlarge: normalize(40),
  },
  borderRadius: {
    small: normalize(8),
    regular: normalize(12),
    large: normalize(16),
    xlarge: normalize(24),
  },
};

export { SCREEN_WIDTH, SCREEN_HEIGHT };
