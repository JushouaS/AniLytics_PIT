export const colors = {
  light: {
    background: '#FFFFFF',
    surface: '#F5F5F5',
    card: '#FFFFFF',
    text: '#1A1A1A',
    textSecondary: '#666666',
    border: '#E0E0E0',
    primary: '#2E7D32',
    primaryDark: '#1B5E20',
    primaryLight: '#4CAF50',
    success: '#4CAF50',
    warning: '#FF9800',
    danger: '#F44336',
    info: '#2196F3',
    tabIconDefault: '#9E9E9E',
    tabIconSelected: '#2E7D32',
    shadow: '#000000',
  },
  dark: {
    background: '#121212',
    surface: '#1E1E1E',
    card: '#2C2C2C',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    border: '#3D3D3D',
    primary: '#4CAF50',
    primaryDark: '#388E3C',
    primaryLight: '#66BB6A',
    success: '#66BB6A',
    warning: '#FFB74D',
    danger: '#E57373',
    info: '#64B5F6',
    tabIconDefault: '#757575',
    tabIconSelected: '#4CAF50',
    shadow: '#000000',
  },
};

export type ThemeColors = typeof colors.light;

export default colors;
