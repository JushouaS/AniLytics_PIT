import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, Animated, Easing, StyleSheet, TouchableWithoutFeedback } from "react-native";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { FontSizeProvider } from "@/contexts/FontSizeContext";
import AppLogo from "@/components/AppLogo";
import ErrorBoundary from "@/components/ErrorBoundary";
import colors from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="admin" options={{ presentation: "modal", headerShown: false }} />
    </Stack>
  );
}

function SplashAnimation({ onFinish }: { onFinish: () => void }) {
  const { isDark } = useTheme();
  const theme = isDark ? colors.dark : colors.light;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    const skipTimer = setTimeout(() => setCanSkip(true), 500);
    const finishTimer = setTimeout(onFinish, 2500);
    
    return () => {
      clearTimeout(skipTimer);
      clearTimeout(finishTimer);
    };
  }, [fadeAnim, scaleAnim, onFinish]);

  const handleSkip = () => {
    if (canSkip) {
      onFinish();
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handleSkip}>
      <View style={[styles.splashContainer, { backgroundColor: theme.primary }]}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }}
        >
          <AppLogo size={120} color="#FFFFFF" />
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ErrorBoundary>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <LanguageProvider>
              <ThemeProvider>
                <FontSizeProvider>
                  <AdminProvider>
                    {showSplash ? (
                      <SplashAnimation onFinish={() => setShowSplash(false)} />
                    ) : (
                      <RootLayoutNav />
                    )}
                  </AdminProvider>
                </FontSizeProvider>
              </ThemeProvider>
            </LanguageProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </trpc.Provider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
