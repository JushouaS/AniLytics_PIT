import { useState, useCallback, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Switch,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import {
  X,
  Settings as SettingsIcon,
  Database,
  MapPin,
  Trash2,
  Plus,
  Download,
  Upload,
  RotateCcw,
  ChevronRight,
  Edit3,
  Archive,
  Shield,
  Clock,
  Save,
} from 'lucide-react-native';

import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdmin } from '@/contexts/AdminContext';
import hapticFeedback from '@/lib/haptics';
import colors from '@/constants/colors';
import { responsive } from '@/constants/dimensions';
import type { Region, RegionId } from '@/constants/regions';
import React from "react";


export default function AdminDashboard() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const {
    settings,
    regions,
    yieldData,
    deletedRegions,
    backups,
    updateSettings,
    deleteRegion,
    restoreRegion,
    editRegion,

    createBackup,
    restoreBackup,
    resetToDefaults,
  } = useAdmin();
  const theme = isDark ? colors.dark : colors.light;

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showRegionsModal, setShowRegionsModal] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [showBackupsModal, setShowBackupsModal] = useState(false);
  const [showDeletedModal, setShowDeletedModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [editingName, setEditingName] = useState('');

  const [maxRegions, setMaxRegions] = useState(settings.maxCompareRegions.toString());
  const [perfThreshold, setPerfThreshold] = useState(settings.performanceThreshold.toString());
  const [enableSmoothing, setEnableSmoothing] = useState(settings.enableSmoothingByDefault);

  const scaleAnim1 = useRef(new Animated.Value(1)).current;
  const scaleAnim2 = useRef(new Animated.Value(1)).current;
  const scaleAnim3 = useRef(new Animated.Value(1)).current;
  const scaleAnim4 = useRef(new Animated.Value(1)).current;

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const animatePress = (anim: Animated.Value, callback: () => void) => {
    hapticFeedback.light();
    Animated.sequence([
      Animated.timing(anim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(anim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    setTimeout(callback, 100);
  };

  const handleSaveSettings = async () => {
    const maxRegionsNum = parseInt(maxRegions);
    const perfThresholdNum = parseInt(perfThreshold);

    if (isNaN(maxRegionsNum) || maxRegionsNum < 1 || maxRegionsNum > 20) {
      hapticFeedback.error();
      Alert.alert(t.error, 'Max regions must be between 1 and 20');
      return;
    }

    if (isNaN(perfThresholdNum) || perfThresholdNum < 1 || perfThresholdNum > maxRegionsNum) {
      hapticFeedback.error();
      Alert.alert(t.error, 'Performance threshold must be between 1 and max regions');
      return;
    }

    const result = await updateSettings({
      maxCompareRegions: maxRegionsNum,
      performanceThreshold: perfThresholdNum,
      enableSmoothingByDefault: enableSmoothing,
    });

    if (result.success) {
      hapticFeedback.success();
      Alert.alert(t.success, t.settingsUpdated);
      setShowSettingsModal(false);
    } else {
      hapticFeedback.error();
      Alert.alert(t.error, result.error || t.updateFailed);
    }
  };

  const handleEditRegion = useCallback((region: Region) => {
    setEditingRegion(region);
    setEditingName(t.regions[region.id]);
    setShowEditModal(true);
    hapticFeedback.light();
  }, [t]);

  const handleSaveEdit = useCallback(async () => {
    if (!editingRegion || !editingName.trim()) {
      hapticFeedback.error();
      return;
    }

    const result = await editRegion(editingRegion.id, editingName);
    if (result.success) {
      hapticFeedback.success();
      Alert.alert(t.success, t.regionUpdated);
      setShowEditModal(false);
      setEditingRegion(null);
    } else {
      hapticFeedback.error();
      Alert.alert(t.error, result.error || t.updateRegionFailed);
    }
  }, [editingRegion, editingName, editRegion, t]);

  const handleDeleteRegion = useCallback((regionId: RegionId) => {
    hapticFeedback.warning();
    Alert.alert(
      t.confirmDelete,
      t.confirmDeleteRegion.replace('{region}', t.regions[regionId]),
      [
        {
          text: t.cancel,
          style: 'cancel',
          onPress: () => hapticFeedback.light(),
        },
        {
          text: t.delete,
          style: 'destructive',
          onPress: async () => {
            const result = await deleteRegion(regionId);
            if (result.success) {
              hapticFeedback.success();
              Alert.alert(t.success, t.regionDeleted);
            } else {
              hapticFeedback.error();
              Alert.alert(t.error, result.error || t.deleteFailed);
            }
          },
        },
      ]
    );
  }, [deleteRegion, t]);

  const handleRestoreRegion = useCallback((regionId: RegionId) => {
    hapticFeedback.light();
    Alert.alert(
      t.confirmRestore,
      t.confirmRestoreRegion.replace('{region}', t.regions[regionId]),
      [
        {
          text: t.cancel,
          style: 'cancel',
          onPress: () => hapticFeedback.light(),
        },
        {
          text: t.restoreRegion,
          onPress: async () => {
            const result = await restoreRegion(regionId);
            if (result.success) {
              hapticFeedback.success();
              Alert.alert(t.success, t.regionRestored);
              if (deletedRegions.length === 1) {
                setShowDeletedModal(false);
              }
            } else {
              hapticFeedback.error();
              Alert.alert(t.error, result.error || t.restoreRegionFailed);
            }
          },
        },
      ]
    );
  }, [restoreRegion, deletedRegions, t]);

  const handleUploadData = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: Platform.OS === 'web' ? 'text/csv' : ['text/csv', 'application/json'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      if (!file) return;

      hapticFeedback.light();
      Alert.alert(
        t.uploadMode,
        'Choose how to upload this data:',
        [
          { text: t.cancel, style: 'cancel' },
          {
            text: t.append,
            onPress: async () => {
              hapticFeedback.success();
              Alert.alert(t.success, t.dataUploaded);
            },
          },
          {
            text: t.replace,
            style: 'destructive',
            onPress: async () => {
              hapticFeedback.success();
              Alert.alert(t.success, t.dataUploaded);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Upload error:', error);
      hapticFeedback.error();
      Alert.alert(t.error, t.uploadFailed);
    }
  }, [t]);

  const handleDownloadData = useCallback(async () => {
    try {
      const csvContent = [
        'RegionID,Year,Yield,AverageYield',
        ...yieldData.flatMap((region) =>
          region.historicalData.map((data) =>
            `${region.regionId},${data.year},${data.yield},${region.averageYield}`
          )
        ),
      ].join('\n');

      if (Platform.OS === 'web') {
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `anilytics-data-${Date.now()}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        hapticFeedback.success();
        Alert.alert(t.success, t.dataDownloaded);
      } else {
        const filename = `anilytics-data-${Date.now()}.csv`;
        const blob = new Blob([csvContent], { type: 'text/csv' });
        if (await Sharing.isAvailableAsync()) {
          hapticFeedback.success();
          Alert.alert(t.success, t.dataDownloaded);
        } else {
          hapticFeedback.error();
          Alert.alert(t.error, t.downloadFailed);
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      hapticFeedback.error();
      Alert.alert(t.error, t.downloadFailed);
    }
  }, [yieldData, t]);

  const handleCreateBackup = useCallback(async () => {
    const result = await createBackup();
    if (result.success) {
      hapticFeedback.success();
      Alert.alert(t.success, t.backupCreated);
    } else {
      hapticFeedback.error();
      Alert.alert(t.error, result.error || t.backupFailed);
    }
  }, [createBackup, t]);

  const handleRestoreBackup = useCallback((timestamp: number) => {
    hapticFeedback.warning();
    const date = new Date(timestamp).toLocaleString();
    Alert.alert(
      t.confirmRestore,
      `${t.backupTimestamp} ${date}`,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.restoreBackup,
          style: 'destructive',
          onPress: async () => {
            const result = await restoreBackup(timestamp);
            if (result.success) {
              hapticFeedback.success();
              Alert.alert(t.success, t.backupRestored);
              setShowBackupsModal(false);
            } else {
              hapticFeedback.error();
              Alert.alert(t.error, result.error || t.restoreFailed);
            }
          },
        },
      ]
    );
  }, [restoreBackup, t]);

  const handleResetData = useCallback(() => {
    hapticFeedback.warning();
    Alert.alert(
      t.confirmReset,
      t.confirmResetMessage,
      [
        {
          text: t.cancel,
          style: 'cancel',
          onPress: () => hapticFeedback.light(),
        },
        {
          text: t.reset,
          style: 'destructive',
          onPress: async () => {
            const result = await resetToDefaults();
            if (result.success) {
              hapticFeedback.success();
              Alert.alert(t.success, t.dataReset);
              setMaxRegions(settings.maxCompareRegions.toString());
              setPerfThreshold(settings.performanceThreshold.toString());
              setEnableSmoothing(settings.enableSmoothingByDefault);
            } else {
              hapticFeedback.error();
              Alert.alert(t.error, result.error || t.resetFailed);
            }
          },
        },
      ]
    );
  }, [resetToDefaults, settings, t]);

  const renderCard = (
    icon: React.ReactElement,
    title: string,
    subtitle: string,
    color: string,
    onPress: () => void,
    animValue: Animated.Value
  ) => (
    <Animated.View style={{ transform: [{ scale: animValue }], opacity: fadeAnim }}>
      <TouchableOpacity
        style={[styles.menuCard, { backgroundColor: theme.card }]}
        onPress={() => animatePress(animValue, onPress)}
        activeOpacity={0.9}
      >
        <View style={styles.menuCardContent}>
          <View style={[styles.menuIcon, { backgroundColor: color + '15' }]}>
            {icon}
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={[styles.menuTitle, { color: theme.text }]}>
              {title}
            </Text>
            <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]}>
              {subtitle}
            </Text>
          </View>
          <ChevronRight size={24} color={theme.textSecondary} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={[styles.adminBadge, { backgroundColor: theme.danger + '20' }]}>
              <Shield size={14} color={theme.danger} style={{ marginRight: 4 }} />
              <Text style={[styles.adminBadgeText, { color: theme.danger }]}>
                {t.admin.toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              {t.adminDashboard}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: theme.surface }]}
            onPress={() => {
              hapticFeedback.light();
              router.back();
            }}
          >
            <X size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={[styles.warningBanner, { backgroundColor: theme.warning + '15', borderColor: theme.warning, opacity: fadeAnim }]}>
          <Text style={[styles.warningText, { color: theme.warning }]}>
            ⚠️ {t.adminWarning}
          </Text>
        </Animated.View>

        {renderCard(
          <SettingsIcon size={28} color={theme.primary} />,
          t.adminSettings,
          t.configureCompareLimits,
          theme.primary,
          () => setShowSettingsModal(true),
          scaleAnim1
        )}

        {renderCard(
          <MapPin size={28} color={theme.success} />,
          t.manageRegions,
          `${regions.length} ${t.regionsAvailable}`,
          theme.success,
          () => setShowRegionsModal(true),
          scaleAnim2
        )}

        {renderCard(
          <Database size={28} color={theme.info} />,
          t.manageDatasets,
          `${yieldData.length} ${t.datasetsAvailable}`,
          theme.info,
          () => setShowDataModal(true),
          scaleAnim3
        )}

        {renderCard(
          <Archive size={28} color='#FF6B35' />,
          t.backupData,
          `${backups.length} ${t.noBackups.includes('No') ? 'backups' : ''}`,
          '#FF6B35',
          () => setShowBackupsModal(true),
          scaleAnim4
        )}

        {deletedRegions.length > 0 && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <TouchableOpacity
              style={[styles.secondaryButton, { backgroundColor: theme.info + '20', borderColor: theme.info }]}
              onPress={() => {
                hapticFeedback.light();
                setShowDeletedModal(true);
              }}
              activeOpacity={0.7}
            >
              <RotateCcw size={20} color={theme.info} />
              <Text style={[styles.secondaryButtonText, { color: theme.info }]}>
                {t.deletedRegions} ({deletedRegions.length})
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <Animated.View style={{ opacity: fadeAnim }}>
          <TouchableOpacity
            style={[styles.dangerButton, { backgroundColor: theme.danger + '15', borderColor: theme.danger }]}
            onPress={handleResetData}
            activeOpacity={0.7}
          >
            <RotateCcw size={20} color={theme.danger} />
            <Text style={[styles.dangerButtonText, { color: theme.danger }]}>
              {t.resetToDefaults}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      <Modal
        visible={showSettingsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={[styles.modalIconContainer, { backgroundColor: theme.primary + '20' }]}>
                  <SettingsIcon size={24} color={theme.primary} />
                </View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {t.adminSettings}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  hapticFeedback.light();
                  setShowSettingsModal(false);
                }}
              >
                <X size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                {t.maxCompareRegions}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                value={maxRegions}
                onChangeText={setMaxRegions}
                keyboardType="number-pad"
                placeholder="8"
                placeholderTextColor={theme.textSecondary}
              />

              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                {t.performanceThreshold}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                value={perfThreshold}
                onChangeText={setPerfThreshold}
                keyboardType="number-pad"
                placeholder="6"
                placeholderTextColor={theme.textSecondary}
              />

              <View style={styles.switchContainer}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary, flex: 1 }]}>
                  {t.enableSmoothingByDefault}
                </Text>
                <Switch
                  value={enableSmoothing}
                  onValueChange={setEnableSmoothing}
                  trackColor={{ false: theme.border, true: theme.primary + '80' }}
                  thumbColor={enableSmoothing ? theme.primary : theme.surface}
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.surface }]}
                onPress={() => {
                  hapticFeedback.light();
                  setShowSettingsModal(false);
                }}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>
                  {t.cancel}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={handleSaveSettings}
              >
                <Save size={18} color="#FFFFFF" />
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                  {t.save}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showRegionsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRegionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={[styles.modalIconContainer, { backgroundColor: theme.success + '20' }]}>
                  <MapPin size={24} color={theme.success} />
                </View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {t.manageRegions}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  hapticFeedback.light();
                  setShowRegionsModal(false);
                }}
              >
                <X size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              {regions.map((region, index) => (
                <Animated.View
                  key={region.id}
                  style={[
                    styles.regionListItem,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  <View style={styles.regionItemLeft}>
                    <View style={[styles.colorDot, { backgroundColor: region.color }]} />
                    <Text style={[styles.regionItemText, { color: theme.text }]}>
                      {t.regions[region.id]}
                    </Text>
                  </View>
                  <View style={styles.regionActions}>
                    <TouchableOpacity
                      style={[styles.iconButton, { backgroundColor: theme.primary + '20' }]}
                      onPress={() => {
                        setShowRegionsModal(false);
                        setTimeout(() => handleEditRegion(region), 300);
                      }}
                    >
                      <Edit3 size={18} color={theme.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.iconButton, { backgroundColor: theme.danger + '20' }]}
                      onPress={() => handleDeleteRegion(region.id)}
                    >
                      <Trash2 size={18} color={theme.danger} />
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.success, marginTop: 16 }]}
              onPress={() => {
                hapticFeedback.light();
                setShowRegionsModal(false);
                Alert.alert(t.comingSoon, t.addRegionFeature);
              }}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                {t.addRegion}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDataModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDataModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={[styles.modalIconContainer, { backgroundColor: theme.info + '20' }]}>
                  <Database size={24} color={theme.info} />
                </View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {t.manageDatasets}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  hapticFeedback.light();
                  setShowDataModal(false);
                }}
              >
                <X size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.dataActionContainer}>
              <TouchableOpacity
                style={[styles.dataButton, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}
                onPress={handleUploadData}
              >
                <Upload size={24} color={theme.primary} />
                <Text style={[styles.dataButtonText, { color: theme.primary }]}>
                  {t.uploadData}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dataButton, { backgroundColor: theme.success + '20', borderColor: theme.success }]}
                onPress={handleDownloadData}
              >
                <Download size={24} color={theme.success} />
                <Text style={[styles.dataButtonText, { color: theme.success }]}>
                  {t.downloadData}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                {t.currentDatasets}
              </Text>
              {yieldData.map((data) => (
                <View
                  key={data.regionId}
                  style={[styles.dataListItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <View style={styles.dataItemContent}>
                    <Text style={[styles.dataItemTitle, { color: theme.text }]}>
                      {t.regions[data.regionId]}
                    </Text>
                    <Text style={[styles.dataItemSubtitle, { color: theme.textSecondary }]}>
                      {data.historicalData.length} {t.dataPoints}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showBackupsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBackupsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={[styles.modalIconContainer, { backgroundColor: '#FF6B3520' }]}>
                  <Archive size={24} color="#FF6B35" />
                </View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {t.backupData}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  hapticFeedback.light();
                  setShowBackupsModal(false);
                }}
              >
                <X size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.createBackupButton, { backgroundColor: '#FF6B35' }]}
              onPress={handleCreateBackup}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={[styles.createBackupText, { color: '#FFFFFF' }]}>
                {t.createBackup}
              </Text>
            </TouchableOpacity>

            <ScrollView style={styles.modalScrollView}>
              {backups.length === 0 ? (
                <View style={styles.emptyState}>
                  <Archive size={48} color={theme.textSecondary} />
                  <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                    {t.noBackups}
                  </Text>
                </View>
              ) : (
                backups.map((backup) => (
                  <TouchableOpacity
                    key={backup.timestamp}
                    style={[styles.backupItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    onPress={() => handleRestoreBackup(backup.timestamp)}
                  >
                    <View style={styles.backupIconContainer}>
                      <Clock size={20} color={theme.primary} />
                    </View>
                    <View style={styles.backupItemContent}>
                      <Text style={[styles.backupItemTitle, { color: theme.text }]}>
                        {new Date(backup.timestamp).toLocaleString()}
                      </Text>
                      <Text style={[styles.backupItemSubtitle, { color: theme.textSecondary }]}>
                        {backup.regions.length} regions, {backup.yieldData.length} datasets
                      </Text>
                    </View>
                    <RotateCcw size={20} color={theme.primary} />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDeletedModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDeletedModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={[styles.modalIconContainer, { backgroundColor: theme.info + '20' }]}>
                  <Trash2 size={24} color={theme.info} />
                </View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {t.deletedRegions}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  hapticFeedback.light();
                  setShowDeletedModal(false);
                }}
              >
                <X size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              {deletedRegions.map((deleted) => (
                <View
                  key={deleted.region.id}
                  style={[styles.deletedItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <View style={styles.deletedItemLeft}>
                    <View style={[styles.colorDot, { backgroundColor: deleted.region.color }]} />
                    <View>
                      <Text style={[styles.regionItemText, { color: theme.text }]}>
                        {t.regions[deleted.region.id]}
                      </Text>
                      <Text style={[styles.deletedTime, { color: theme.textSecondary }]}>
                        {new Date(deleted.deletedAt).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.iconButton, { backgroundColor: theme.success + '20' }]}
                    onPress={() => handleRestoreRegion(deleted.region.id)}
                  >
                    <RotateCcw size={18} color={theme.success} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.editModalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={[styles.modalIconContainer, { backgroundColor: theme.primary + '20' }]}>
                  <Edit3 size={24} color={theme.primary} />
                </View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {t.editRegion}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  hapticFeedback.light();
                  setShowEditModal(false);
                }}
              >
                <X size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              {t.regionName}
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              value={editingName}
              onChangeText={setEditingName}
              placeholder={t.editRegionName}
              placeholderTextColor={theme.textSecondary}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.surface }]}
                onPress={() => {
                  hapticFeedback.light();
                  setShowEditModal(false);
                }}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>
                  {t.cancel}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={handleSaveEdit}
              >
                <Save size={18} color="#FFFFFF" />
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                  {t.save}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: responsive.spacing.medium,
    paddingVertical: responsive.spacing.regular,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: responsive.fontSize.xlarge,
    fontWeight: '800' as const,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: responsive.spacing.medium,
    paddingBottom: 32,
  },
  warningBanner: {
    padding: responsive.spacing.medium,
    borderRadius: responsive.borderRadius.large,
    borderWidth: 1.5,
    marginBottom: responsive.spacing.medium,
  },
  warningText: {
    fontSize: responsive.fontSize.regular,
    fontWeight: '700' as const,
    textAlign: 'center',
    lineHeight: 22,
  },
  menuCard: {
    borderRadius: responsive.borderRadius.large,
    marginBottom: responsive.spacing.medium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  menuCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: responsive.spacing.large,
    gap: 16,
  },
  menuIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: responsive.fontSize.large,
    fontWeight: '800' as const,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  menuSubtitle: {
    fontSize: responsive.fontSize.regular,
    lineHeight: 20,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: responsive.spacing.large,
    borderRadius: responsive.borderRadius.large,
    borderWidth: 2,
    marginBottom: responsive.spacing.medium,
  },
  secondaryButtonText: {
    fontSize: responsive.fontSize.medium,
    fontWeight: '700' as const,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: responsive.spacing.large,
    borderRadius: responsive.borderRadius.large,
    borderWidth: 2,
    marginTop: 16,
  },
  dangerButtonText: {
    fontSize: responsive.fontSize.medium,
    fontWeight: '700' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  editModalContent: {
    borderRadius: 24,
    padding: 24,
    margin: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: responsive.fontSize.xxlarge,
    fontWeight: '800' as const,
  },
  modalScrollView: {
    maxHeight: '65%',
  },
  inputLabel: {
    fontSize: responsive.fontSize.regular,
    fontWeight: '700' as const,
    marginBottom: 10,
    marginTop: 16,
  },
  input: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    fontSize: responsive.fontSize.medium,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingVertical: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  modalButtonText: {
    fontSize: responsive.fontSize.medium,
    fontWeight: '700' as const,
  },
  regionListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1.5,
  },
  regionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  regionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 10,
    borderRadius: 10,
  },
  colorDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  regionItemText: {
    fontSize: responsive.fontSize.medium,
    fontWeight: '600' as const,
  },
  dataActionContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  dataButton: {
    flex: 1,
    padding: 18,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    gap: 8,
  },
  dataButtonText: {
    fontSize: responsive.fontSize.regular,
    fontWeight: '700' as const,
  },
  sectionTitle: {
    fontSize: responsive.fontSize.small,
    fontWeight: '800' as const,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dataListItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1.5,
  },
  dataItemContent: {
    gap: 6,
  },
  dataItemTitle: {
    fontSize: responsive.fontSize.medium,
    fontWeight: '700' as const,
  },
  dataItemSubtitle: {
    fontSize: responsive.fontSize.small,
  },
  createBackupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
  },
  createBackupText: {
    fontSize: responsive.fontSize.medium,
    fontWeight: '700' as const,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: responsive.fontSize.medium,
    marginTop: 16,
    fontWeight: '600' as const,
  },
  backupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    gap: 12,
  },
  backupIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
  },
  backupItemContent: {
    flex: 1,
  },
  backupItemTitle: {
    fontSize: responsive.fontSize.medium,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  backupItemSubtitle: {
    fontSize: responsive.fontSize.small,
  },
  deletedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1.5,
  },
  deletedItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  deletedTime: {
    fontSize: responsive.fontSize.small,
    marginTop: 4,
  },
});
