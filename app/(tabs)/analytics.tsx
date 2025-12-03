import { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import { BarChart3, CheckSquare, Square, Info } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdmin } from '@/contexts/AdminContext';
import hapticFeedback from '@/lib/haptics';
import colors from '@/constants/colors';
import { municipalities, MunicipalityId } from '@/constants/regions';
import { SCREEN_WIDTH, isTablet } from '@/constants/dimensions';

export default function AnalyticsScreen() {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { settings, municipalities: adminMunicipalities, yieldData: adminYieldData } = useAdmin();
  const theme = isDark ? colors.dark : colors.light;

  const defaultVisible = Math.min(3, settings.maxCompareMunicipalities);
  const [selectedRegions, setSelectedRegions] = useState<MunicipalityId[]>(
    (adminMunicipalities || []).slice(0, defaultVisible).map((r: any) => r.id)
  );
  const [showPerformanceWarning, setShowPerformanceWarning] = useState(false);
  const [isLoading] = useState(false);

  const toggleRegion = useCallback((regionId: MunicipalityId) => {
    hapticFeedback.selection();
    setSelectedRegions(prev => {
      if (prev.includes(regionId)) {
        setShowPerformanceWarning(false);
        return prev.filter(r => r !== regionId);
      }
      
      if (prev.length >= settings.maxCompareMunicipalities) {
        hapticFeedback.warning();
        return prev;
      }
      
      const newSelection = [...prev, regionId];
      
      if (newSelection.length > settings.performanceThreshold) {
        setShowPerformanceWarning(true);
        hapticFeedback.warning();
      }
      
      return newSelection;
    });
  }, [settings.maxCompareMunicipalities, settings.performanceThreshold]);

  const selectAll = useCallback(() => {
    hapticFeedback.light();
    const allRegionIds = (adminMunicipalities || []).slice(0, settings.maxCompareMunicipalities).map((r: any) => r.id);
    setSelectedRegions(allRegionIds);
    if (allRegionIds.length > settings.performanceThreshold) {
      setShowPerformanceWarning(true);
    }
  }, [adminMunicipalities, settings.maxCompareMunicipalities, settings.performanceThreshold]);

  const deselectAll = useCallback(() => {
    hapticFeedback.light();
    setSelectedRegions([]);
    setShowPerformanceWarning(false);
  }, []);

  const abbreviateLabel = useCallback((label: string, maxLength: number = 12): string => {
    if (label.length <= maxLength) return label;
    
    const words = label.split(' ');
    
    if (words.length === 1) {
      return label.substring(0, maxLength - 3) + '...';
    }
    
    if (words.length === 2) {
      return words.map(w => w.charAt(0).toUpperCase()).join('.') + '.';
    }
    
    const acronym = words.map(w => w.charAt(0).toUpperCase()).join('.');
    if (acronym.length <= maxLength) return acronym;
    
    return label.substring(0, maxLength - 3) + '...';
  }, []);

  const chartData = useMemo(() => {
    const baseStrokeWidth = selectedRegions.length > 5 ? 2 : 3;
    
    return {
      labels: ['2019', '2020', '2021', '2022', '2023', '2024'],
      datasets: selectedRegions.map((regionId, index) => {
        const regionData = adminYieldData.find(r => r.municipalityId === regionId);
        const region = (adminMunicipalities || []).find((r: any) => r.id === regionId);
        
        const data = regionData?.historicalData.map(d => d.yield) || [];
        
        const smoothedData = settings.enableSmoothingByDefault && data.length > 2
          ? data.map((val, i) => {
              if (i === 0 || i === data.length - 1) return val;
              return (data[i - 1] + val + data[i + 1]) / 3;
            })
          : data;
        
        return {
          data: smoothedData,
          color: (opacity = 1) => region?.color || theme.primary,
          strokeWidth: baseStrokeWidth,
          withDots: selectedRegions.length <= 4,
        };
      }),
      legend: [],  // Disable default legend to prevent overlap
    };
  }, [selectedRegions, adminYieldData, adminMunicipalities, settings.enableSmoothingByDefault, theme.primary]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: t.analytics,
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.text,
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.cardHeader}>
            <BarChart3 size={24} color={theme.primary} />
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              {t.historicalData}
            </Text>
          </View>

          {selectedRegions.length > 0 ? (
            <View style={styles.chartContainer}>
              {isLoading ? (
                <View style={[styles.loadingContainer, { backgroundColor: theme.surface }]}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                    Loading chart data...
                  </Text>
                </View>
              ) : Platform.OS === 'web' ? (
                <View style={[styles.webChartFallback, { backgroundColor: theme.surface }]}>
                  <Info size={32} color={theme.textSecondary} />
                  <Text style={[styles.webChartText, { color: theme.text }]}>
                    Interactive chart is only available on mobile
                  </Text>
                  <View style={styles.legendContainer}>
                    {selectedRegions.map(id => {
                      const region = municipalities.find((r: any) => r.id === id);
                      return (
                        <View key={id} style={styles.legendItem}>
                          <View style={[styles.legendColor, { backgroundColor: region?.color }]} />
                          <Text style={[styles.legendText, { color: theme.text }]} numberOfLines={1}>
                            {t.regions[id as keyof typeof t.regions]}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ) : (
                <>
                  <LineChart
                    data={chartData}
                    width={Math.min(SCREEN_WIDTH - 64, isTablet ? 600 : 400)}
                    height={isTablet ? 300 : 240}
                    chartConfig={{
                      backgroundColor: theme.card,
                      backgroundGradientFrom: theme.card,
                      backgroundGradientTo: theme.card,
                      decimalPlaces: 1,
                      color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
                      labelColor: (opacity = 1) =>
                        isDark
                          ? `rgba(255, 255, 255, ${opacity})`
                          : `rgba(0, 0, 0, ${opacity})`,
                      style: {
                        borderRadius: 16,
                      },
                      propsForDots: {
                        r: isTablet ? '5' : '4',
                        strokeWidth: '2',
                      },
                    }}
                    bezier
                    style={styles.chart}
                    withInnerLines={false}
                    withOuterLines={true}
                    withVerticalLines={false}
                    withHorizontalLines={true}
                    segments={4}
                  />
                  {/* Custom legend below chart */}
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.customLegendContainer}
                    style={styles.customLegendScroll}
                  >
                    {selectedRegions.map(id => {
                      const region = municipalities.find((r: any) => r.id === id);
                      return (
                        <View key={id} style={styles.customLegendItem}>
                          <View style={[styles.customLegendDot, { backgroundColor: region?.color }]} />
                          <Text 
                            style={[styles.customLegendText, { color: theme.text }]}
                            numberOfLines={1}
                          >
                            {t.regions[id as keyof typeof t.regions]}
                          </Text>
                        </View>
                      );
                    })}
                  </ScrollView>
                </>
              )}
            </View>
          ) : (
            <View style={[styles.emptyChart, { backgroundColor: theme.surface }]}>
              <BarChart3 size={48} color={theme.textSecondary} />
              <Text style={[styles.emptyChartText, { color: theme.textSecondary }]}>
                {t.selectMunicipalities}
              </Text>
            </View>
          )}
        </View>

        {showPerformanceWarning && (
          <View style={[styles.warningCard, { backgroundColor: theme.warning + '20', borderColor: theme.warning }]}>
            <Text style={[styles.warningText, { color: theme.warning }]}>
              {t.performanceWarning} ({selectedRegions.length}/{settings.maxCompareMunicipalities})
            </Text>
          </View>
        )}

        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.selectorHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                {t.selectMunicipalities}
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                {t.selectUpTo} {settings.maxCompareMunicipalities} {t.municipalities_lower}
              </Text>
            </View>
            <View style={styles.bulkActions}>
              <TouchableOpacity
                style={[styles.bulkButton, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}
                onPress={selectAll}
                activeOpacity={0.7}
              >
                <Text style={[styles.bulkButtonText, { color: theme.primary }]}>
                  {t.selectAll}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.bulkButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={deselectAll}
                activeOpacity={0.7}
              >
                <Text style={[styles.bulkButtonText, { color: theme.text }]}>
                  {t.clearAll}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.regionList}>
            {(adminMunicipalities || []).map((municipality: any) => {
              const isSelected = selectedRegions.includes(municipality.id);
              return (
                <TouchableOpacity
                  key={municipality.id}
                  style={[
                    styles.regionItem,
                    {
                      backgroundColor: theme.surface,
                      borderColor: isSelected ? municipality.color : theme.border,
                      borderWidth: 2,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isSelected ? 0.1 : 0.05,
                      shadowRadius: 4,
                      elevation: isSelected ? 3 : 1,
                      marginBottom: 8,
                    },
                  ]}
                  onPress={() => toggleRegion(municipality.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.regionItemContent}>
                    <View
                      style={[
                        styles.colorIndicator,
                        { backgroundColor: municipality.color },
                      ]}
                    />
                    <Text
                      style={[
                        styles.regionItemText,
                        { color: theme.text },
                      ]}
                    >
                      {t.regions[municipality.id as keyof typeof t.regions]}
                    </Text>
                  </View>
                  {isSelected ? (
                    <CheckSquare size={24} color={municipality.color} />
                  ) : (
                    <Square size={24} color={theme.border} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
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
    padding: 16,
    paddingBottom: 24,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
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
    fontSize: 20,
    fontWeight: '700' as const,
  },
  subtitle: {
    fontSize: 14,
  },
  selectorHeader: {
    marginBottom: 16,
  },
  bulkActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  bulkButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  bulkButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  warningCard: {
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 2,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  chart: {
    borderRadius: 16,
  },
  emptyChart: {
    padding: 48,
    borderRadius: 16,
    alignItems: 'center',
    gap: 16,
  },
  emptyChartText: {
    fontSize: 16,
    textAlign: 'center',
  },
  regionList: {
    gap: 12,
  },
  regionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  regionItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  regionItemText: {
    fontSize: 16,
    fontWeight: '500' as const,
    flex: 1,
  },
  webChartFallback: {
    padding: 48,
    borderRadius: 16,
    alignItems: 'center',
    gap: 16,
  },
  webChartText: {
    fontSize: 16,
    textAlign: 'center',
  },
  legendContainer: {
    marginTop: 16,
    gap: 12,
    flexDirection: 'column',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendColor: {
    width: 32,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 14,
    flex: 1,
  },
  loadingContainer: {
    padding: 48,
    borderRadius: 16,
    alignItems: 'center' as const,
    gap: 16,
    justifyContent: 'center' as const,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center' as const,
    marginTop: 12,
  },
  customLegendScroll: {
    marginTop: 16,
    maxHeight: 100,
  },
  customLegendContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  customLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 16,
  },
  customLegendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  customLegendText: {
    fontSize: 13,
    fontWeight: '600' as const,
    maxWidth: 120,
  },
});
