import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';

const { width } = Dimensions.get('window');

interface MapComponentProps {
    location: any;
    mapStyle: any;
}

export default function MapComponent({ location, mapStyle }: MapComponentProps) {
    return (
        <View style={[styles.map, { backgroundColor: '#242f3e', justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ color: '#94a3b8', fontWeight: 'bold' }}>Map View (Web Preview)</Text>
            <Text style={{ color: '#64748b', fontSize: 12 }}>
                Lat: {location?.latitude?.toFixed(4) || '19.0760'}, Lng: {location?.longitude?.toFixed(4) || '72.8777'}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    map: {
        flex: 1,
    },
});
