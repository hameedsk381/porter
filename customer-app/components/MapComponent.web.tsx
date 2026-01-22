import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { Map as MapIcon } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface MapComponentProps {
    location: any;
    theme: any;
    mapStyle: any;
}

export default function MapComponent({ location, theme, mapStyle }: MapComponentProps) {
    return (
        <View style={[styles.map, { backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' }]}>
            <MapIcon size={48} color={theme.colors.outline} />
            <Text variant="bodyMedium" style={{ marginTop: 12, color: '#94a3b8' }}>
                Interactive maps are optimized for mobile devices.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    map: {
        width: '100%',
        height: height,
    },
});
