import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';

export type FontSize = 'small' | 'medium' | 'large';

const FONT_SIZE_STORAGE_KEY = 'anilytics_font_size';

export const fontSizeMultipliers: Record<FontSize, number> = {
  small: 1,
  medium: 1.15,
  large: 1.3,
};

export const [FontSizeProvider, useFontSize] = createContextHook(() => {
  const [fontSize, setFontSizeState] = useState<FontSize>('small');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFontSize();
  }, []);

  const loadFontSize = async () => {
    try {
      const stored = await AsyncStorage.getItem(FONT_SIZE_STORAGE_KEY);
      if (stored === 'small' || stored === 'medium' || stored === 'large') {
        setFontSizeState(stored);
      }
    } catch (error) {
      console.error('Failed to load font size:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setFontSize = useCallback(async (size: FontSize) => {
    try {
      await AsyncStorage.setItem(FONT_SIZE_STORAGE_KEY, size);
      setFontSizeState(size);
    } catch (error) {
      console.error('Failed to save font size:', error);
    }
  }, []);

  const multiplier = useMemo(() => fontSizeMultipliers[fontSize], [fontSize]);

  return useMemo(() => ({
    fontSize,
    setFontSize,
    multiplier,
    isLoading,
  }), [fontSize, setFontSize, multiplier, isLoading]);
});
