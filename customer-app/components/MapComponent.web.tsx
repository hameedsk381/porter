import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';

const { width, height } = Dimensions.get('window');

interface MapComponentProps {
    location: any;
    theme: any;
    mapStyle: any;
}

export default function MapComponent({ location, theme, mapStyle }: MapComponentProps) {
    return (
        <View style={[styles.map, { backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ color: '#6b7280', fontWeight: 'bold' }}>Map View (Web Preview)</Text>
            <Text style={{ color: '#9ca3af', fontSize: 12 }}>
                Lat: {location?.latitude?.toFixed(4) || '19.0760'}, Lng: {location?.longitude?.toFixed(4) || '72.8777'}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    map: {
        width: width,
        height: height,
    },
});
