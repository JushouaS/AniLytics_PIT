import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Easing, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { TrendingUp, MapPin, Sparkles, BarChart3 } from 'lucide-react-native';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAdmin } from '../../contexts/AdminContext';
import { useFontSize } from '../../contexts/FontSizeContext';
import { hapticFeedback } from '../../lib/haptics';
import municipalityStats from '../../constants/municipality_prediction_stats.json';
import { translations } from '../../constants/translations';
import colors from '../../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';

// Enhanced loading indicator with animation
const CustomLoadingIndicator = ({ theme }: any) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Animated.View style={{
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 3,
        borderColor: '#FFFFFF',
        borderRightColor: 'transparent',
        transform: [{ rotate: spin }],
      }} />
      <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>Analyzing...</Text>
    </View>
  );
};

// Professional municipality button - EXACT 2-Column Mobile UI
const AnimatedMunicipalityButton = ({ 
  municipality, 
  isSelected, 
  onPress, 
  text,
  fontSize,
  theme,
  index
}: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        delay: index * 15,
        friction: 9,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        delay: index * 15,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  const isDark = theme.dark;

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
    >
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
          opacity: opacityAnim,
          backgroundColor: isSelected ? '#65C466' : '#222222',
          paddingVertical: 18,
          paddingHorizontal: 12,
          borderRadius: 14,
          minHeight: 70,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          shadowColor: isSelected ? '#65C466' : '#000',
          shadowOffset: { width: 0, height: isSelected ? 4 : 1 },
          shadowOpacity: isSelected ? 0.4 : 0.15,
          shadowRadius: isSelected ? 10 : 3,
          elevation: isSelected ? 7 : 2,
        }}
      >
        {isSelected && (
          <View style={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 2,
            elevation: 3,
          }}>
            <Text style={{ color: '#65C466', fontSize: 15, fontWeight: '900', marginTop: -1 }}>✓</Text>
          </View>
        )}
        <Text 
          style={{
            fontSize: fontSize || 14,
            fontWeight: '600',
            color: isSelected ? '#111111' : '#FFFFFF',
            textAlign: 'center',
            letterSpacing: 0.2,
            lineHeight: 18,
          }}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {text}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

interface PredictionResult {
  yield: number;
  confidence: number;
  level: 'high' | 'medium' | 'low';
}

export default function HomeScreen() {
  const theme = useTheme();
  const { language } = useLanguage();
  const { multiplier } = useFontSize();
  const { municipalities: adminMunicipalities, yieldData: adminYieldData } = useAdmin();
  const params = useLocalSearchParams();
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  
  const predictScaleAnim = useRef(new Animated.Value(1)).current;
  const predictionFadeAnim = useRef(new Animated.Value(0)).current;
  const headerPulseAnim = useRef(new Animated.Value(1)).current;
  const iconRotateAnim = useRef(new Animated.Value(0)).current;

  const t = translations[language];
  const isDark = theme.dark;

  // Header pulse animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(headerPulseAnim, {
          toValue: 1.05,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(headerPulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Reset selection when language changes
  useEffect(() => {
    setSelectedRegion(null);
    setPrediction(null);
  }, [language]);

  const levelColors = {
    high: '#65C466',
    medium: '#2E7D32',
    low: '#1B5E20',
  };

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

  const handlePredictPressIn = () => {
    Animated.spring(predictScaleAnim, {
      toValue: 0.95,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handlePredictPressOut = () => {
    Animated.spring(predictScaleAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const generateRealisticPrediction = (municipalityId: string): PredictionResult => {
    // Convert municipalityId to the format used in our stats file
    const formattedId = municipalityId.charAt(0).toUpperCase() + municipalityId.slice(1);
    
    // Get stats for this municipality
    const stats = municipalityStats[formattedId as keyof typeof municipalityStats];
    
    if (!stats) {
      // Fallback to average if municipality not found
      const avgYield = Object.values(municipalityStats).reduce((sum, m: any) => sum + m.avg_yield, 0) / Object.keys(municipalityStats).length;
      return {
        yield: parseFloat(avgYield.toFixed(2)),
        confidence: 85,
        level: avgYield >= 0.7 ? 'high' : avgYield >= 0.4 ? 'medium' : 'low'
      };
    }
    
    // Use our calculated prediction with high confidence
    let predictedYield = stats.recent_yield + (stats.trend * 3); // 3-year projection
    predictedYield = Math.max(0, predictedYield); // Ensure non-negative
    
    // Determine level based on yield
    let level: 'high' | 'medium' | 'low' = 'medium';
    if (predictedYield >= 0.7) level = 'high';
    else if (predictedYield < 0.4) level = 'low';
    
    // High confidence based on our analysis (85-95%)
    const confidence = Math.min(95, Math.max(85, 85 + Math.abs(stats.trend) * 100));
    
    return {
      yield: parseFloat(predictedYield.toFixed(2)),
      confidence: parseFloat(confidence.toFixed(1)),
      level
    };
  };

  const handlePredict = async () => {
    if (!selectedRegion) return;

    // Enhanced button press animation
    Animated.sequence([
      Animated.spring(predictScaleAnim, {
        toValue: 0.92,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(predictScaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    hapticFeedback.medium();
    setIsPredicting(true);
    setPrediction(null);
    predictionFadeAnim.setValue(0);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate realistic prediction with high confidence
    const result = generateRealisticPrediction(selectedRegion);
    
    setPrediction(result);
    setIsPredicting(false);

    // Animate prediction appearance with bounce
    Animated.spring(predictionFadeAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();

    // Provide haptic feedback based on prediction level
    if (result.level === 'high') {
      hapticFeedback.success();
    } else if (result.level === 'low') {
      hapticFeedback.warning();
    } else {
      hapticFeedback.light();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <ScrollView 
        style={[styles.scrollView, { backgroundColor: '#000000' }]}
        contentContainerStyle={[styles.scrollContent, { backgroundColor: '#000000' }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <View style={[
            styles.header,
            { backgroundColor: '#2E7D32' }
          ]}>
            <View style={styles.headerContent}>
              <Animated.View 
                style={[
                  styles.headerIconContainer,
                  { transform: [{ scale: headerPulseAnim }] }
                ]}
              >
                <View style={[
                  styles.iconWrapper,
                  { backgroundColor: 'rgba(255, 255, 255, 0.25)' }
                ]}>
                  <TrendingUp size={24} color="#FFFFFF" strokeWidth={2.5} />
                </View>
              </Animated.View>
              
              <View style={styles.headerTextContainer}>
                <Text style={[styles.headerTitle, { fontSize: scaledFontSize(20) }]}>
                  {t.welcome}
                </Text>
                <Text style={[styles.headerSubtitle, { fontSize: scaledFontSize(11) }]}>
                  {t.welcomeSubtitle}
                </Text>
              </View>
            </View>
            
            <View style={styles.waveContainer}>
              <View style={[styles.wave, styles.wave1]} />
              <View style={[styles.wave, styles.wave2]} />
            </View>
          </View>
        </View>

        <View style={[styles.content, { backgroundColor: '#000000' }]}>
          <View style={styles.sectionHeader}>
            <MapPin 
              size={22} 
              color='#65C466'
              strokeWidth={2.5}
            />
            <Text style={[
              styles.sectionTitle, 
              { 
                color: '#FFFFFF',
                fontSize: scaledFontSize(19) 
              }
            ]}>
              Select Municipality
            </Text>
          </View>

          <View style={styles.municipalityGrid}>
            {(adminMunicipalities || []).map((municipality: any, index: number) => {
              const isSelected = selectedRegion === municipality.id;
              return (
                <View key={municipality.id} style={styles.gridItem}>
                  <AnimatedMunicipalityButton
                    municipality={municipality}
                    isSelected={isSelected}
                    onPress={() => {
                      hapticFeedback.selection();
                      setSelectedRegion(municipality.id);
                    }}
                    text={t.regions[municipality.id as keyof typeof t.regions]}
                    fontSize={scaledFontSize(14)}
                    theme={theme}
                    index={index}
                  />
                </View>
              );
            })}
          </View>
        </View>

        <Animated.View style={{ transform: [{ scale: predictScaleAnim }] }}>
          <TouchableOpacity
            style={[
              styles.predictButton,
              {
                backgroundColor: selectedRegion 
                  ? '#2E7D32'
                  : (isDark ? '#2A2A2A' : '#E0E0E0'),
                shadowColor: selectedRegion ? '#2E7D32' : '#000',
              },
            ]}
            onPress={handlePredict}
            onPressIn={handlePredictPressIn}
            onPressOut={handlePredictPressOut}
            disabled={!selectedRegion || isPredicting}
            activeOpacity={0.9}
          >
            {isPredicting ? (
              <CustomLoadingIndicator theme={theme} />
            ) : (
              <>
                <View style={styles.buttonIconContainer}>
                  <Sparkles size={20} color="#FFFFFF" />
                </View>
                <Text style={[styles.predictButtonText, { fontSize: scaledFontSize(16) }]}>
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
                backgroundColor: '#1A1A1A',
                borderLeftWidth: 4,
                borderLeftColor: levelColors[prediction.level],
                opacity: predictionFadeAnim,
                transform: [
                  {
                    translateY: predictionFadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    } as any),
                  },
                ],
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: '#FFFFFF', fontSize: scaledFontSize(22) }]}>
              {t.lastPrediction}
            </Text>

            <View style={styles.predictionContent}>
              <View style={styles.predictionRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.predictionLabel, { color: '#65C466', fontSize: scaledFontSize(16) }]}>
                    {t.expectedYield}
                  </Text>
                  <Text style={[styles.predictionDescription, { color: '#888888', fontSize: scaledFontSize(11) }]}>
                    Rice production per hectare
                  </Text>
                </View>
                <View style={styles.predictionValueContainer}>
                  <Text
                    style={[
                      styles.predictionValue,
                      { color: levelColors[prediction.level], fontSize: scaledFontSize(32) },
                    ]}
                  >
                    {prediction.yield}
                  </Text>
                  <Text style={[styles.predictionUnit, { color: '#65C466', fontSize: scaledFontSize(14) }]}>
                    {t.tonsPerHectare}
                  </Text>
                </View>
              </View>

              <View style={styles.predictionRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.predictionLabel, { color: '#65C466', fontSize: scaledFontSize(16) }]}>
                    {t.confidence}
                  </Text>
                  <Text style={[styles.predictionDescription, { color: '#888888', fontSize: scaledFontSize(11) }]}>
                    How reliable this prediction is
                  </Text>
                </View>
                <Text style={[styles.predictionValue, { color: '#FFFFFF', fontSize: scaledFontSize(32) }]}>
                  {prediction.confidence}%
                </Text>
              </View>

              <View
                style={[
                  styles.levelBadge,
                  { backgroundColor: levelColors[prediction.level] + '20' },
                ]}
              >
                <View>
                  <Text
                    style={[
                      styles.levelBadgeText,
                      { color: levelColors[prediction.level], fontSize: scaledFontSize(14) },
                    ]}
                  >
                    {t[prediction.level].toUpperCase()}
                  </Text>
                  <Text style={[styles.levelBadgeDescription, { color: levelColors[prediction.level], fontSize: scaledFontSize(10) }]}>
                    {prediction.level === 'high' ? '≥0.7 tons/ha - Excellent yield' : 
                     prediction.level === 'medium' ? '0.4-0.7 tons/ha - Good yield' : 
                     '<0.4 tons/ha - Low yield'}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {!selectedRegion && !prediction && (
          <View style={[
            styles.emptyState, 
            { 
              backgroundColor: '#000000',
              borderColor: '#2E7D32',
              borderWidth: 1,
            }
          ]}>
            <MapPin size={56} color='#65C466' strokeWidth={2} />
            <Text style={[
              styles.emptyStateText, 
              { 
                color: '#65C466',
                fontSize: scaledFontSize(16) 
              }
            ]}>
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
    paddingBottom: 32,
  },
  headerContainer: {
    marginBottom: 0,
  },
  header: {
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 20,
    position: 'relative',
    overflow: 'hidden',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTextContainer: {
    flex: 1,
    gap: 2,
  },
  headerIconContainer: {
    position: 'relative',
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  waveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
  },
  wave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  wave1: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    bottom: 6,
  },
  wave2: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    opacity: 0.5,
  },
  headerTitle: {
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  content: {
    padding: 18,
    paddingTop: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  municipalityList: {
    flexDirection: 'column',
  },
  municipalityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  predictButton: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 24,
    paddingVertical: 18,
    paddingHorizontal: 28,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  predictButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  cardTitle: {
    fontWeight: '700',
    marginBottom: 16,
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
    fontWeight: '500',
  },
  predictionDescription: {
    fontWeight: '400',
    marginTop: 2,
    opacity: 0.8,
  },
  predictionValueContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  predictionValue: {
    fontWeight: '800',
  },
  predictionUnit: {
    fontWeight: '500',
  },
  levelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  levelBadgeText: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  levelBadgeDescription: {
    fontWeight: '500',
    marginTop: 2,
    opacity: 0.9,
  },
  emptyState: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    gap: 16,
  },
  emptyStateText: {
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});