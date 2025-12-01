import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Pressable,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Globe, Moon, Info, Shield, Type } from 'lucide-react-native';
import { useState, useRef } from 'react';

import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFontSize, FontSize } from '@/contexts/FontSizeContext';
import hapticFeedback from '@/lib/haptics';
import colors from '@/constants/colors';
import type { Language } from '@/constants/translations';
import type { ThemeMode } from '@/contexts/ThemeContext';
import { responsive } from '@/constants/dimensions';

const ADMIN_PASSWORD = 'admin2025';

interface AnimatedOptionButtonProps {
  mode: string;
  isSelected: boolean;
  label: string;
  onPress: () => void;
  theme: any;
}

const AnimatedOptionButton = ({ mode, isSelected, label, onPress, theme }: AnimatedOptionButtonProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.94,
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
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.optionButton,
          {
            backgroundColor: isSelected ? theme.primary : theme.surface,
            borderColor: isSelected ? theme.primary : theme.border,
          },
        ]}
        onPress={handlePress}
        activeOpacity={1}
      >
        <Text
          style={[
            styles.optionText,
            {
              color: isSelected ? '#FFFFFF' : theme.text,
            },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function SettingsScreen() {
  const router = useRouter();
  const { isDark, themeMode, setThemeMode } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const { fontSize, setFontSize, multiplier } = useFontSize();
  const theme = isDark ? colors.dark : colors.light;

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [loginStep, setLoginStep] = useState<1 | 2>(1);

  const handleLanguageChange = (lang: Language) => {
    hapticFeedback.selection();
    setLanguage(lang);
  };

  const handleThemeChange = (mode: ThemeMode) => {
    hapticFeedback.selection();
    setThemeMode(mode);
  };

  const handleFontSizeChange = (size: FontSize) => {
    hapticFeedback.selection();
    setFontSize(size);
  };

  const handleAdminAccess = () => {
    if (Platform.OS === 'web') {
      setShowAdminModal(true);
      setPassword1('');
      setPassword2('');
      setLoginStep(1);
    }
  };

  const handleAdminLongPress = () => {
    hapticFeedback.heavy();
    setShowAdminModal(true);
    setPassword1('');
    setPassword2('');
    setLoginStep(1);
  };

  const handlePasswordSubmit = async () => {
    if (loginStep === 1) {
      if (password1 === ADMIN_PASSWORD) {
        hapticFeedback.success();
        setLoginStep(2);
        setPassword2('');
      } else {
        hapticFeedback.error();
        Alert.alert('Error', t.wrongPassword);
        setPassword1('');
      }
    } else {
      if (password2 === ADMIN_PASSWORD && password1 === password2) {
        hapticFeedback.success();
        setShowAdminModal(false);
        setPassword1('');
        setPassword2('');
        setLoginStep(1);
        router.push('/admin');
      } else {
        hapticFeedback.error();
        Alert.alert('Error', t.wrongPassword);
        setPassword2('');
        setLoginStep(1);
        setPassword1('');
      }
    }
  };

  const scaledFontSize = (size: number) => Math.round(size * multiplier);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: t.settings,
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
            <Globe size={24} color={theme.primary} />
            <Text style={[styles.cardTitle, { color: theme.text, fontSize: scaledFontSize(responsive.fontSize.xlarge) }]}>
              {t.language}
            </Text>
          </View>

          <View style={styles.optionGroup}>
            {(['en', 'fil'] as Language[]).map(lang => (
              <AnimatedOptionButton
                key={lang}
                mode={lang}
                isSelected={language === lang}
                label={lang === 'en' ? 'English' : 'Filipino'}
                onPress={() => handleLanguageChange(lang)}
                theme={theme}
              />
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.cardHeader}>
            <Moon size={24} color={theme.primary} />
            <Text style={[styles.cardTitle, { color: theme.text, fontSize: scaledFontSize(responsive.fontSize.xlarge) }]}>
              {t.theme}
            </Text>
          </View>

          <View style={styles.optionGroup}>
            {(['light', 'dark', 'system'] as ThemeMode[]).map(mode => (
              <AnimatedOptionButton
                key={mode}
                mode={mode}
                isSelected={themeMode === mode}
                label={t[mode]}
                onPress={() => handleThemeChange(mode)}
                theme={theme}
              />
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.cardHeader}>
            <Type size={24} color={theme.primary} />
            <Text style={[styles.cardTitle, { color: theme.text, fontSize: scaledFontSize(responsive.fontSize.xlarge) }]}>
              {t.fontSize}
            </Text>
          </View>

          <View style={styles.optionGroup}>
            {(['small', 'medium', 'large'] as FontSize[]).map(size => (
              <AnimatedOptionButton
                key={size}
                mode={size}
                isSelected={fontSize === size}
                label={t[`font${size.charAt(0).toUpperCase() + size.slice(1)}` as keyof typeof t] as string}
                onPress={() => handleFontSizeChange(size)}
                theme={theme}
              />
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.card }]}
          onPress={() => {
            hapticFeedback.light();
            setShowAboutModal(true);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <Info size={24} color={theme.primary} />
            <Text style={[styles.cardTitle, { color: theme.text, fontSize: scaledFontSize(responsive.fontSize.xlarge) }]}>
              {t.about}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary, fontSize: scaledFontSize(responsive.fontSize.medium) }]}>
              {t.version}
            </Text>
            <Text style={[styles.infoValue, { color: theme.text, fontSize: scaledFontSize(responsive.fontSize.medium) }]}>
              1.0.0
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.adminButton, { backgroundColor: theme.surface }]}
          onPress={handleAdminAccess}
          onLongPress={handleAdminLongPress}
          activeOpacity={0.7}
        >
          <Shield size={20} color={theme.textSecondary} />
          <Text style={[styles.adminButtonText, { color: theme.textSecondary }]}>
            {t.admin}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showAboutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAboutModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowAboutModal(false)}
        >
          <Pressable
            style={[styles.aboutModalContent, { backgroundColor: theme.card }]}
            onPress={e => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Info size={32} color={theme.primary} />
              <Text style={[styles.modalTitle, { color: theme.text, fontSize: scaledFontSize(responsive.fontSize.xxlarge) }]}>
                {t.about}
              </Text>
            </View>

            <ScrollView style={styles.aboutScrollView}>
              <Text style={[styles.aboutText, { color: theme.text, fontSize: scaledFontSize(responsive.fontSize.regular) }]}>
                {t.aboutContent}
              </Text>
            </ScrollView>

            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: theme.primary }]}
              onPress={() => {
                hapticFeedback.light();
                setShowAboutModal(false);
              }}
            >
              <Text style={[styles.closeButtonText, { fontSize: scaledFontSize(responsive.fontSize.medium) }]}>
                {t.cancel}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showAdminModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAdminModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowAdminModal(false)}
        >
          <Pressable
            style={[styles.modalContent, { backgroundColor: theme.card }]}
            onPress={e => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Shield size={32} color={theme.primary} />
              <Text style={[styles.modalTitle, { color: theme.text, fontSize: scaledFontSize(responsive.fontSize.xxlarge) }]}>
                {t.admin}
              </Text>
              <Text style={[styles.modalSubtitle, { color: theme.textSecondary, fontSize: scaledFontSize(responsive.fontSize.regular) }]}>
                {loginStep === 1 ? t.enterPassword : t.confirmPassword}
              </Text>
            </View>

            <TextInput
              style={[
                styles.passwordInput,
                {
                  backgroundColor: theme.surface,
                  color: theme.text,
                  borderColor: theme.border,
                  fontSize: scaledFontSize(16),
                },
              ]}
              placeholder={loginStep === 1 ? t.enterPassword : t.confirmPassword}
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              value={loginStep === 1 ? password1 : password2}
              onChangeText={loginStep === 1 ? setPassword1 : setPassword2}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.surface },
                ]}
                onPress={() => setShowAdminModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.text, fontSize: scaledFontSize(responsive.fontSize.medium) }]}>
                  {t.cancel}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.primary },
                ]}
                onPress={handlePasswordSubmit}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF', fontSize: scaledFontSize(responsive.fontSize.medium) }]}>
                  {t.login}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
    padding: responsive.spacing.large,
    borderRadius: responsive.borderRadius.large,
    marginBottom: responsive.spacing.medium,
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
  optionGroup: {
    gap: 12,
  },
  optionButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  optionText: {
    fontSize: responsive.fontSize.medium,
    fontWeight: '600' as const,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontWeight: '500' as const,
  },
  infoValue: {
    fontWeight: '600' as const,
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  adminButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  aboutModalContent: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  aboutScrollView: {
    maxHeight: 400,
    marginBottom: 20,
  },
  aboutText: {
    lineHeight: 24,
  },
  closeButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  modalTitle: {
    fontWeight: '700' as const,
  },
  modalSubtitle: {
    textAlign: 'center',
  },
  passwordInput: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontWeight: '600' as const,
  },
});
