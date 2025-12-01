import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { municipalities as defaultMunicipalities, generateRealYieldData, Municipality, MunicipalityYieldData, MunicipalityId } from '@/constants/regions';

const ADMIN_SETTINGS_KEY = 'anilytics_admin_settings';
const REGIONS_DATA_KEY = 'anilytics_regions_data';
const YIELD_DATA_KEY = 'anilytics_yield_data';
const DELETED_REGIONS_KEY = 'anilytics_deleted_regions';
const BACKUP_KEY = 'anilytics_backup';

export interface AdminSettings {
  maxCompareMunicipalities: number;
  performanceThreshold: number;
  enableSmoothingByDefault: boolean;
}

export interface DeletedMunicipality {
  municipality: Municipality;
  deletedAt: number;
}

export interface BackupData {
  settings: AdminSettings;
  municipalities: Municipality[];
  yieldData: MunicipalityYieldData[];
  timestamp: number;
}

const defaultAdminSettings: AdminSettings = {
  maxCompareMunicipalities: 8,
  performanceThreshold: 6,
  enableSmoothingByDefault: false,
};

export const [AdminProvider, useAdmin] = createContextHook(() => {
  const [settings, setSettings] = useState<AdminSettings>(defaultAdminSettings);
  const [municipalities, setMunicipalities] = useState<Municipality[]>(defaultMunicipalities);
  const [yieldData, setYieldData] = useState<MunicipalityYieldData[]>(generateRealYieldData());
  const [deletedMunicipalities, setDeletedMunicipalities] = useState<DeletedMunicipality[]>([]);
  const [backups, setBackups] = useState<BackupData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const [settingsStr, regionsStr, yieldDataStr, deletedStr, backupStr] = await Promise.all([
        AsyncStorage.getItem(ADMIN_SETTINGS_KEY),
        AsyncStorage.getItem(REGIONS_DATA_KEY),
        AsyncStorage.getItem(YIELD_DATA_KEY),
        AsyncStorage.getItem(DELETED_REGIONS_KEY),
        AsyncStorage.getItem(BACKUP_KEY),
      ]);

      if (settingsStr) {
        setSettings(JSON.parse(settingsStr));
      }
      if (regionsStr) {
        setMunicipalities(JSON.parse(regionsStr));
      }
      if (yieldDataStr) {
        setYieldData(JSON.parse(yieldDataStr));
      } else {
        // Load real data from Python script
        try {
          // In a real implementation, you would call the Python script here
          // For now, we'll use the mock data
          setYieldData(generateRealYieldData());
        } catch (error) {
          console.error('Failed to load real yield data:', error);
          // Fallback to mock data if Python script fails
          setYieldData(generateRealYieldData());
        }
      }
      if (deletedStr) {
        setDeletedMunicipalities(JSON.parse(deletedStr));
      }
      if (backupStr) {
        setBackups(JSON.parse(backupStr));
      }
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = useCallback(async (newSettings: Partial<AdminSettings>) => {
    try {
      const updated = { ...settings, ...newSettings };
      await AsyncStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(updated));
      setSettings(updated);
      return { success: true };
    } catch (error) {
      console.error('Failed to update settings:', error);
      return { success: false, error: 'Failed to update settings' };
    }
  }, [settings]);

  const updateMunicipalities = useCallback(async (newMunicipalities: Municipality[]) => {
    try {
      await AsyncStorage.setItem(REGIONS_DATA_KEY, JSON.stringify(newMunicipalities));
      setMunicipalities(newMunicipalities);
      return { success: true };
    } catch (error) {
      console.error('Failed to update municipalities:', error);
      return { success: false, error: 'Failed to update municipalities' };
    }
  }, []);

  const addMunicipality = useCallback(async (municipality: Municipality) => {
    try {
      const newMunicipalities = [...municipalities, municipality];
      await AsyncStorage.setItem(REGIONS_DATA_KEY, JSON.stringify(newMunicipalities));
      setMunicipalities(newMunicipalities);
      return { success: true };
    } catch (error) {
      console.error('Failed to add municipality:', error);
      return { success: false, error: 'Failed to add municipality' };
    }
  }, [municipalities]);

  const editMunicipality = useCallback(async (municipalityId: MunicipalityId, newName: string) => {
    try {
      const updatedMunicipalities = municipalities.map(m => 
        m.id === municipalityId ? { ...m, id: municipalityId } : m
      );
      
      await AsyncStorage.setItem(REGIONS_DATA_KEY, JSON.stringify(updatedMunicipalities));
      setMunicipalities(updatedMunicipalities);
      return { success: true };
    } catch (error) {
      console.error('Failed to edit municipality:', error);
      return { success: false, error: 'Failed to edit municipality' };
    }
  }, [municipalities]);

  const deleteMunicipality = useCallback(async (municipalityId: MunicipalityId) => {
    try {
      const municipalityToDelete = municipalities.find(m => m.id === municipalityId);
      if (!municipalityToDelete) {
        return { success: false, error: 'Municipality not found' };
      }

      const newMunicipalities = municipalities.filter(m => m.id !== municipalityId);
      const newYieldData = yieldData.filter(y => y.municipalityId !== municipalityId);
      
      const deletedMunicipality: DeletedMunicipality = {
        municipality: municipalityToDelete,
        deletedAt: Date.now(),
      };

      const updatedDeletedMunicipalities = [...deletedMunicipalities, deletedMunicipality];
      
      await Promise.all([
        AsyncStorage.setItem(REGIONS_DATA_KEY, JSON.stringify(newMunicipalities)),
        AsyncStorage.setItem(YIELD_DATA_KEY, JSON.stringify(newYieldData)),
        AsyncStorage.setItem(DELETED_REGIONS_KEY, JSON.stringify(updatedDeletedMunicipalities)),
      ]);
      
      setMunicipalities(newMunicipalities);
      setYieldData(newYieldData);
      setDeletedMunicipalities(updatedDeletedMunicipalities);
      return { success: true };
    } catch (error) {
      console.error('Failed to delete municipality:', error);
      return { success: false, error: 'Failed to delete municipality' };
    }
  }, [municipalities, yieldData, deletedMunicipalities]);

  const restoreMunicipality = useCallback(async (municipalityId: MunicipalityId) => {
    try {
      const deletedMunicipality = deletedMunicipalities.find(dm => dm.municipality.id === municipalityId);
      if (!deletedMunicipality) {
        return { success: false, error: 'Deleted municipality not found' };
      }

      const newMunicipalities = [...municipalities, deletedMunicipality.municipality];
      const updatedDeletedMunicipalities = deletedMunicipalities.filter(dm => dm.municipality.id !== municipalityId);
      
      await Promise.all([
        AsyncStorage.setItem(REGIONS_DATA_KEY, JSON.stringify(newMunicipalities)),
        AsyncStorage.setItem(DELETED_REGIONS_KEY, JSON.stringify(updatedDeletedMunicipalities)),
      ]);
      
      setMunicipalities(newMunicipalities);
      setDeletedMunicipalities(updatedDeletedMunicipalities);
      return { success: true };
    } catch (error) {
      console.error('Failed to restore municipality:', error);
      return { success: false, error: 'Failed to restore municipality' };
    }
  }, [municipalities, deletedMunicipalities]);

  const updateYieldData = useCallback(async (newYieldData: MunicipalityYieldData[]) => {
    try {
      await AsyncStorage.setItem(YIELD_DATA_KEY, JSON.stringify(newYieldData));
      setYieldData(newYieldData);
      return { success: true };
    } catch (error) {
      console.error('Failed to update yield data:', error);
      return { success: false, error: 'Failed to update yield data' };
    }
  }, []);

  const createBackup = useCallback(async () => {
    try {
      const backup: BackupData = {
        settings,
        municipalities,
        yieldData,
        timestamp: Date.now(),
      };

      const updatedBackups = [...backups, backup];
      await AsyncStorage.setItem(BACKUP_KEY, JSON.stringify(updatedBackups));
      setBackups(updatedBackups);
      return { success: true, backup };
    } catch (error) {
      console.error('Failed to create backup:', error);
      return { success: false, error: 'Failed to create backup' };
    }
  }, [settings, municipalities, yieldData, backups]);

  const restoreBackup = useCallback(async (timestamp: number) => {
    try {
      const backup = backups.find(b => b.timestamp === timestamp);
      if (!backup) {
        return { success: false, error: 'Backup not found' };
      }

      await Promise.all([
        AsyncStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(backup.settings)),
        AsyncStorage.setItem(REGIONS_DATA_KEY, JSON.stringify(backup.municipalities)),
        AsyncStorage.setItem(YIELD_DATA_KEY, JSON.stringify(backup.yieldData)),
      ]);

      setSettings(backup.settings);
      setMunicipalities(backup.municipalities);
      setYieldData(backup.yieldData);
      return { success: true };
    } catch (error) {
      console.error('Failed to restore backup:', error);
      return { success: false, error: 'Failed to restore backup' };
    }
  }, [backups]);

  const resetToDefaults = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(ADMIN_SETTINGS_KEY),
        AsyncStorage.removeItem(REGIONS_DATA_KEY),
        AsyncStorage.removeItem(YIELD_DATA_KEY),
        AsyncStorage.removeItem(DELETED_REGIONS_KEY),
      ]);
      
      setSettings(defaultAdminSettings);
      setMunicipalities(defaultMunicipalities);
      setYieldData(generateRealYieldData());
      setDeletedMunicipalities([]);
      return { success: true };
    } catch (error) {
      console.error('Failed to reset to defaults:', error);
      return { success: false, error: 'Failed to reset to defaults' };
    }
  }, []);

  return useMemo(() => ({
    settings,
    municipalities,
    yieldData,
    deletedMunicipalities,
    backups,
    isLoading,
    updateSettings,
    updateMunicipalities,
    addMunicipality,
    editMunicipality,
    deleteMunicipality,
    restoreMunicipality,
    updateYieldData,
    createBackup,
    restoreBackup,
    resetToDefaults,
  }), [
    settings,
    municipalities,
    yieldData,
    deletedMunicipalities,
    backups,
    isLoading,
    updateSettings,
    updateMunicipalities,
    addMunicipality,
    editMunicipality,
    deleteMunicipality,
    restoreMunicipality,
    updateYieldData,
    createBackup,
    restoreBackup,
    resetToDefaults,
  ]);
});
