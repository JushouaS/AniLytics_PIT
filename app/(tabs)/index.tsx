import { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { Stack } from 'expo-router';
import { TrendingUp, MapPin, CheckCircle, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdmin } from '@/contexts/AdminContext';
import { useFontSize } from '@/contexts/FontSizeContext';
import hapticFeedback from '@/lib/haptics';
import colors from '@/constants/colors';
import { MunicipalityId } from '@/constants/regions';
import { responsive, isTablet } from '@/constants/dimensions';
import type { ThemeColors } from '@/constants/colors';
import type { Municipality } from '@/constants/regions';

interface AnimatedRegionButtonProps {
  region: Municipality;
  isSelected: boolean;
  onPress: () => void;
  theme: ThemeColors;
  text: string;
  fontSize: number;
}

const AnimatedRegionButton = ({ region, isSelected, onPress, theme, text, fontSize }: AnimatedRegionButtonProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.92,
        duration: 100,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        width: isTablet ? '30%' : '47%',
      }}
    >
      <TouchableOpacity
        style={[
          styles.regionButton,
          {
            backgroundColor: isSelected ? theme.primary : theme.surface,
            borderColor: isSelected ? theme.primary : theme.border,
          },
        ]}
        onPress={handlePress}
        activeOpacity={1}
      >
        {isSelected && (
          <CheckCircle
            size={18}
            color="#FFFFFF"
            style={styles.checkIcon}
          />
        )}
        <Text
          style={[
            styles.regionButtonText,
            {
              color: isSelected ? '#FFFFFF' : theme.text,
              fontSize,
            },
          ]}
          numberOfLines={2}
        >
          {text}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const CustomLoadingIndicator = ({ theme }: { theme: ThemeColors }) => {
  const rotation1 = useRef(new Animated.Value(0)).current;
  const rotation2 = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation1, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(rotation2, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.2,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [rotation1, rotation2, scale]);

  const spin1 = rotation1.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const spin2 = rotation2.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  return (
    <View style={styles.loadingContainer}>
      <Animated.View
        style={[
          styles.loadingRing,
          {
            borderColor: '#FFFFFF',
            transform: [{ rotate: spin1 }, { scale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.loadingRingInner,
          {
            borderColor: 'rgba(255, 255, 255, 0.6)',
            transform: [{ rotate: spin2 }],
          },
        ]}
      />
      <TrendingUp size={20} color="#FFFFFF" style={styles.loadingIcon} />
    </View>
  );
};

export default function DashboardScreen() {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { multiplier } = useFontSize();
  const { municipalities: adminMunicipalities, yieldData: adminYieldData } = useAdmin();
  const theme = isDark ? colors.dark : colors.light;

  const [selectedRegion, setSelectedRegion] = useState<MunicipalityId | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [prediction, setPrediction] = useState<{
    yield: number;
    confidence: number;
    level: 'high' | 'medium' | 'low';
  } | null>(null);

  const predictScaleAnim = useRef(new Animated.Value(1)).current;
  const predictionFadeAnim = useRef(new Animated.Value(0)).current;

  const scaledFontSize = (size: number) => Math.round(size * multiplier);

  const animatePress = (scaleAnim: Animated.Value) => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePredict = async () => {
    if (!selectedRegion) return;

    animatePress(predictScaleAnim);
    hapticFeedback.medium();
    setIsPredicting(true);
    setPrediction(null);
    predictionFadeAnim.setValue(0);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const regionData = adminYieldData.find(r => r.municipalityId === selectedRegion);
    if (regionData) {
      const baseYield = regionData.averageYield;
      const variance = (Math.random() - 0.5) * 0.4;
      const predictedYield = Math.max(0, baseYield + variance);
      const confidence = 75 + Math.random() * 20;

      let level: 'high' | 'medium' | 'low' = 'medium';
      if (predictedYield >= 4.5) level = 'high';
      else if (predictedYield < 3.5) level = 'low';

      setPrediction({
        yield: parseFloat(predictedYield.toFixed(2)),
        confidence: parseFloat(confidence.toFixed(1)),
        level,
      });

      Animated.timing(predictionFadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();

      if (level === 'high') {
        hapticFeedback.success();
      } else if (level === 'low') {
        hapticFeedback.warning();
      } else {
        hapticFeedback.light();
      }
    }

    setIsPredicting(false);
  };

  const levelColors = {
    high: theme.success,
    medium: theme.warning,
    low: theme.danger,
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: t.dashboard,
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.text,
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <LinearGradient
          colors={isDark ? ['#1B5E20', '#2E7D32', '#388E3C'] : ['#2E7D32', '#388E3C', '#4CAF50']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerIconContainer}>
            <View style={styles.iconWrapper}>
              <TrendingUp size={40} color="#FFFFFF" strokeWidth={2.5} />
            </View>
            <Sparkles size={24} color="#F4C542" style={styles.sparkleIcon} />
          </View>
          <Text style={[styles.headerTitle, { fontSize: scaledFontSize(responsive.fontSize.xxlarge + 2) }]}>{t.welcome}</Text>
          <Text style={[styles.headerSubtitle, { fontSize: scaledFontSize(responsive.fontSize.medium) }]}>{t.welcomeSubtitle}</Text>
          <View style={styles.headerDecoration} />
        </LinearGradient>

        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.cardHeader}>
            <MapPin size={24} color={theme.primary} />
            <Text style={[styles.cardTitle, { color: theme.text, fontSize: scaledFontSize(responsive.fontSize.xlarge) }]}>
              {t.selectRegion}
            </Text>
          </View>

          <View style={styles.regionGrid}>
            {(adminMunicipalities || []).map((region: any) => {
              const isSelected = selectedRegion === region.id;
              return (
                <AnimatedRegionButton
                  key={region.id}
                  region={region}
                  isSelected={isSelected}
                  onPress={() => {
                    hapticFeedback.selection();
                    setSelectedRegion(region.id);
                  }}
                  theme={theme}
                  text={t.regions[region.id as keyof typeof t.regions]}
                  fontSize={scaledFontSize(responsive.fontSize.regular)}
                />
              );
            })}
          </View>
        </View>

        <Animated.View
          style={{
            transform: [{ scale: predictScaleAnim }],
          }}
        >
          <TouchableOpacity
            style={[
              styles.predictButton,
              {
                backgroundColor: selectedRegion ? theme.primary : theme.border,
              },
            ]}
            onPress={handlePredict}
            disabled={!selectedRegion || isPredicting}
            activeOpacity={1}
          >
            {isPredicting ? (
              <CustomLoadingIndicator theme={theme} />
            ) : (
              <>
                <TrendingUp size={24} color="#FFFFFF" />
                <Text style={[styles.predictButtonText, { fontSize: scaledFontSize(responsive.fontSize.large) }]}>
                  {t.predictYield}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        {prediction && (
          <Animated.View
            style={[
              styles.card,
              {
                backgroundColor: theme.card,
                borderLeftWidth: 4,
                borderLeftColor: levelColors[prediction.level],
                opacity: predictionFadeAnim,
                transform: [
                  {
                    translateY: predictionFadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.text, fontSize: scaledFontSize(responsive.fontSize.xlarge) }]}>
              {t.lastPrediction}
            </Text>

            <View style={styles.predictionContent}>
              <View style={styles.predictionRow}>
                <Text style={[styles.predictionLabel, { color: theme.textSecondary, fontSize: scaledFontSize(responsive.fontSize.medium) }]}>
                  {t.expectedYield}
                </Text>
                <View style={styles.predictionValueContainer}>
                  <Text
                    style={[
                      styles.predictionValue,
                      { color: levelColors[prediction.level], fontSize: scaledFontSize(responsive.fontSize.xxlarge) },
                    ]}
                  >
                    {prediction.yield}
                  </Text>
                  <Text style={[styles.predictionUnit, { color: theme.textSecondary, fontSize: scaledFontSize(responsive.fontSize.regular) }]}>
                    {t.tonsPerHectare}
                  </Text>
                </View>
              </View>

              <View style={styles.predictionRow}>
                <Text style={[styles.predictionLabel, { color: theme.textSecondary, fontSize: scaledFontSize(responsive.fontSize.medium) }]}>
                  {t.confidence}
                </Text>
                <Text style={[styles.predictionValue, { color: theme.text, fontSize: scaledFontSize(responsive.fontSize.xxlarge) }]}>
                  {prediction.confidence}%
                </Text>
              </View>

              <View
                style={[
                  styles.levelBadge,
                  { backgroundColor: levelColors[prediction.level] + '20' },
                ]}
              >
                <Text
                  style={[
                    styles.levelBadgeText,
                    { color: levelColors[prediction.level], fontSize: scaledFontSize(responsive.fontSize.regular) },
                  ]}
                >
                  {t[prediction.level].toUpperCase()}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {!selectedRegion && !prediction && (
          <View style={[styles.emptyState, { backgroundColor: theme.surface }]}>
            <MapPin size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyStateText, { color: theme.textSecondary, fontSize: scaledFontSize(responsive.fontSize.medium) }]}>
              {t.noRegionSelected}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  headerIconContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  sparkleIcon: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  headerDecoration: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#F4C542',
    opacity: 0.6,
  },
  headerTitle: {
    fontWeight: '800' as const,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.95,
    fontWeight: '500' as const,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  card: {
    margin: responsive.spacing.medium,
    padding: responsive.spacing.large,
    borderRadius: responsive.borderRadius.large,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: '700' as const,
  },
  regionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  regionButton: {
    padding: responsive.spacing.medium,
    borderRadius: responsive.borderRadius.regular,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: isTablet ? 90 : 70,
    position: 'relative',
  },
  checkIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  regionButtonText: {
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  predictButton: {
    marginHorizontal: responsive.spacing.medium,
    marginTop: responsive.spacing.small,
    padding: responsive.spacing.large + 2,
    borderRadius: responsive.borderRadius.regular,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: responsive.spacing.regular,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    minHeight: 60,
  },
  predictButtonText: {
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  loadingContainer: {
    position: 'relative',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  loadingRingInner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  loadingIcon: {
    position: 'absolute',
  },
  predictionContent: {
    gap: 16,
  },
  predictionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  predictionLabel: {
    fontWeight: '500' as const,
  },
  predictionValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  predictionValue: {
    fontWeight: '700' as const,
  },
  predictionUnit: {
  },
  levelBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  levelBadgeText: {
    fontWeight: '700' as const,
  },
  emptyState: {
    margin: 16,
    padding: 48,
    borderRadius: 16,
    alignItems: 'center',
    gap: 16,
  },
  emptyStateText: {
    textAlign: 'center',
  },
});
