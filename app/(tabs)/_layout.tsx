import { Tabs } from 'expo-router';
import { Home, BarChart3, Settings } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import colors from '@/constants/colors';
import { useRef, useEffect } from 'react';
import { Animated, Easing, Platform } from 'react-native';
import hapticFeedback from '@/lib/haptics';

const AnimatedTabBarIcon = ({ 
  Icon, 
  color, 
  size, 
  focused 
}: { 
  Icon: any; 
  color: string; 
  size: number; 
  focused: boolean;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (focused) {
      if (Platform.OS !== 'web') {
        hapticFeedback.light();
      }
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.2,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [focused, scaleAnim, rotateAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '5deg'],
  });

  return (
    <Animated.View
      style={{
        transform: [
          { scale: scaleAnim },
          { rotate },
        ],
      }}
    >
      <Icon size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
    </Animated.View>
  );
};

export default function TabLayout() {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const theme = isDark ? colors.dark : colors.light;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.dashboard,
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabBarIcon 
              Icon={Home} 
              color={color} 
              size={size} 
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: t.analytics,
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabBarIcon 
              Icon={BarChart3} 
              color={color} 
              size={size} 
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.settings,
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabBarIcon 
              Icon={Settings} 
              color={color} 
              size={size} 
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}
