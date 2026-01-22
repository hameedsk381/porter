import { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { Text, Searchbar, Surface, Button, IconButton, useTheme, Avatar } from 'react-native-paper';
import { MapPin, Navigation, Search, Menu, Bell, Truck } from 'lucide-react-native';

import * as Location from 'expo-location';
import MapComponent from '@/components/MapComponent';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const [location, setLocation] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const theme = useTheme();

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
    })();
  }, []);

  const vehicleTypes = [
    { id: '1', name: 'Mini Truck', price: '₹250', time: '5 mins', icon: 'truck-flatbed' },
    { id: '2', name: 'Pickup', price: '₹450', time: '8 mins', icon: 'truck' },
    { id: '3', name: '3-Wheeler', price: '₹180', time: '3 mins', icon: 'truck-delivery' },
  ];

  return (
    <View style={styles.container}>
      <MapComponent
        location={location}
        theme={theme}
        mapStyle={mapStyle}
      />

      {/* Header Overlay */}
      <View style={styles.headerOverlay}>
        <Surface style={styles.headerCard} elevation={2}>
          <IconButton icon="menu" size={24} onPress={() => { }} />
          <View style={styles.headerTitleContainer}>
            <Text variant="titleMedium" style={styles.headerTitle}>Porter</Text>
            <Text variant="bodySmall" style={styles.headerSubtitle}>Ready to move things?</Text>
          </View>
          <IconButton icon="bell-outline" size={24} onPress={() => { }} />
        </Surface>
      </View>

      {/* Bottom Sheet UI */}
      <View style={styles.bottomOverlay}>
        <View
          style={styles.bottomSheet}
        >
          <View style={styles.handle} />

          <Text variant="headlineSmall" style={styles.sheetTitle}>Where to?</Text>

          <Searchbar
            placeholder="Enter drop location"
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            icon={() => <Search size={20} color={theme.colors.primary} />}
            mode="bar"
            elevation={0}
          />

          <View style={styles.quickActions}>
            <Text variant="labelLarge" style={styles.sectionTitle}>Nearby Vehicles</Text>
            <View style={styles.vehicleList}>
              {vehicleTypes.map((v) => (
                <Surface key={v.id} style={styles.vehicleCard} elevation={0}>
                  <View style={[styles.vehicleIconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
                    <Truck size={24} color={theme.colors.primary} />
                  </View>
                  <View style={styles.vehicleInfo}>
                    <Text variant="titleSmall" style={styles.vehicleName}>{v.name}</Text>
                    <Text variant="labelSmall" style={styles.vehicleTime}>{v.time} away</Text>
                  </View>
                  <Text variant="titleMedium" style={styles.vehiclePrice}>{v.price}</Text>
                </Surface>
              ))}
            </View>
          </View>

          <Button
            mode="contained"
            onPress={() => { }}
            style={styles.bookButton}
            contentStyle={styles.bookButtonContent}
          >
            Check Price
          </Button>
        </View>
      </View>
    </View>
  );
}

const mapStyle = [
  {
    "featureType": "poi",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "transit",
    "stylers": [{ "visibility": "off" }]
  }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    width: width,
    height: height,
  },
  myLocationMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  myLocationInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  headerOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    right: 20,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  headerTitleContainer: {
    flex: 1,
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontWeight: '900',
    color: '#0f172a',
  },
  headerSubtitle: {
    color: '#94a3b8',
    marginTop: -2,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingTop: 12,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 16,
  },
  searchBar: {
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    marginBottom: 24,
  },
  quickActions: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#64748b',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  vehicleList: {
    gap: 12,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  vehicleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontWeight: '700',
    color: '#0f172a',
  },
  vehicleTime: {
    color: '#64748b',
  },
  vehiclePrice: {
    fontWeight: '800',
    color: '#4f46e5',
  },
  bookButton: {
    borderRadius: 16,
  },
  bookButtonContent: {
    height: 56,
  },
});
