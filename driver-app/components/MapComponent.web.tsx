import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Map as MapIcon } from 'lucide-react-native';

interface MapComponentProps {
    location: any;
    mapStyle: any;
}

export default function MapComponent({ location, mapStyle }: MapComponentProps) {
    return (
        <View style={[styles.map, { backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' }]}>
            <MapIcon size={48} color="#94a3b8" />
            <Text variant="bodyMedium" style={{ marginTop: 12, color: '#64748b' }}>
                Demand Heatmap optimized for Partner App.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    map: {
        flex: 1,
    },
});
