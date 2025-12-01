import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertCircle, RefreshCw } from 'lucide-react-native';
import colors from '@/constants/colors';
import { responsive } from '@/constants/dimensions';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: colors.light.danger + '20' }]}>
              <AlertCircle size={48} color={colors.light.danger} />
            </View>
            <Text style={styles.title}>Oops! Something went wrong</Text>
            <Text style={styles.message}>
              The app encountered an unexpected error. Please try again.
            </Text>
            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorText}>{this.state.error.toString()}</Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.light.primary }]}
              onPress={this.handleReset}
              activeOpacity={0.8}
            >
              <RefreshCw size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: responsive.spacing.xlarge,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: responsive.spacing.xlarge,
  },
  title: {
    fontSize: responsive.fontSize.xxlarge,
    fontWeight: '700' as const,
    color: colors.light.text,
    marginBottom: responsive.spacing.regular,
    textAlign: 'center',
  },
  message: {
    fontSize: responsive.fontSize.medium,
    color: colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: responsive.spacing.xlarge,
    lineHeight: 24,
  },
  errorDetails: {
    backgroundColor: colors.light.surface,
    padding: responsive.spacing.medium,
    borderRadius: responsive.borderRadius.regular,
    marginBottom: responsive.spacing.large,
    maxWidth: '100%',
  },
  errorText: {
    fontSize: responsive.fontSize.small,
    color: colors.light.danger,
    fontFamily: 'monospace',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsive.spacing.small,
    paddingVertical: responsive.spacing.medium,
    paddingHorizontal: responsive.spacing.xlarge,
    borderRadius: responsive.borderRadius.regular,
  },
  buttonText: {
    fontSize: responsive.fontSize.medium,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
