import { MD3LightTheme, configureFonts } from 'react-native-paper';

export const theme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary: '#4f46e5', // Indigo 600
        onPrimary: '#ffffff',
        primaryContainer: '#e0e7ff',
        onPrimaryContainer: '#312e81',
        secondary: '#0f172a', // Slate 900
        onSecondary: '#ffffff',
        secondaryContainer: '#f1f5f9',
        onSecondaryContainer: '#1e293b',
        tertiary: '#10b981', // Emerald 500
        onTertiary: '#ffffff',
        tertiaryContainer: '#d1fae5',
        onTertiaryContainer: '#064e3b',
        error: '#ef4444', // Red 500
        background: '#f8fafc',
        outline: '#e2e8f0',
        surface: '#ffffff',
        surfaceVariant: '#f1f5f9',
    },
    roundness: 8,
};

export const COLORS = {
    indigo: {
        50: '#eef2ff',
        100: '#e0e7ff',
        500: '#6366f1',
        600: '#4f46e5',
        700: '#4338ca',
    },
    slate: {
        50: '#f8fafc',
        100: '#f1f5f9',
        400: '#94a3b8',
        600: '#475569',
        900: '#0f172a',
    },
    emerald: {
        50: '#ecfdf5',
        500: '#10b981',
        600: '#059669',
    },
};
