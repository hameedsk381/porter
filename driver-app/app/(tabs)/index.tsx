import { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { Text, Switch, Surface, Button, IconButton, useTheme, Avatar } from 'react-native-paper';
import * as Location from 'expo-location';
import {
  Navigation,
  DollarSign,
  Clock,
  Map as MapIcon,
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react-native';

import MapComponent from '@/components/MapComponent';

const { width } = Dimensions.get('window');

export default function DriverDashboard() {
  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState<any>(null);
  const theme = useTheme();

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
    })();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text variant="titleLarge" style={styles.welcome}>Hello, Rajesh</Text>
          <Text variant="bodySmall" style={styles.statusLabel}>
            {isOnline ? 'Scanning for orders...' : 'You are currently offline'}
          </Text>
        </View>
        <View style={styles.toggleContainer}>
          <Text variant="labelLarge" style={[styles.onlineText, { color: isOnline ? '#10b981' : '#94a3b8' }]}>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </Text>
          <Switch
            value={isOnline}
            onValueChange={setIsOnline}
            color="#10b981"
          />
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Earnings Card */}
        <Surface style={styles.earningsCard} elevation={2}>
          <View style={styles.earningsMain}>
            <View>
              <Text variant="labelLarge" style={styles.earningsTitle}>Today's Earnings</Text>
              <Text variant="headlineMedium" style={styles.earningsAmount}>₹2,840.50</Text>
            </View>
            <View style={[styles.trendContainer, { backgroundColor: '#ecfdf5' }]}>
              <TrendingUp size={16} color="#059669" />
              <Text style={styles.trendText}>+12%</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text variant="labelSmall" style={styles.statTitle}>TRIPS</Text>
              <Text variant="titleMedium" style={styles.statValue}>14</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text variant="labelSmall" style={styles.statTitle}>HOURS</Text>
              <Text variant="titleMedium" style={styles.statValue}>8.5h</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text variant="labelSmall" style={styles.statTitle}>RATING</Text>
              <Text variant="titleMedium" style={styles.statValue}>4.92</Text>
            </View>
          </View>
        </Surface>

        {/* Map Preview */}
        <View style={styles.mapContainer}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Demand Heatmap</Text>
          <Surface style={styles.mapSurface} elevation={1}>
            <MapComponent
              location={location}
              mapStyle={darkMapStyle}
            />
            <View style={styles.mapOverlay}>
              <Button mode="contained" icon="map" onPress={() => { }} style={styles.expandMap}>
                View High Demand Areas
              </Button>
            </View>
          </Surface>
        </View>

        {/* Weekly Progress */}
        <Surface style={styles.milestoneCard} elevation={0}>
          <View style={styles.milestoneInfo}>
            <Award size={24} color="#f59e0b" />
            <View style={styles.milestoneContent}>
              <Text variant="titleSmall" style={styles.milestoneTitle}>Weekly Milestone</Text>
              <Text variant="bodySmall" style={styles.milestoneSub}>2 more trips to earn ₹500 bonus</Text>
            </View>
            <IconButton icon="chevron-right" size={20} />
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressInner, { width: '80%' }]} />
          </View>
        </Surface>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* New Order Alert Modal (Mock) */}
      {!isOnline && (
        <View
          style={styles.offlineOverlay}
        >
          <Text variant="titleMedium" style={styles.offlineTextLarge}>Going Online...</Text>
          <Text variant="bodySmall" style={styles.offlineSub}>Toggle the switch to start receiving orders</Text>
        </View>
      )}
    </View>
  );
}

const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  welcome: {
    fontWeight: '900',
    color: '#0f172a',
  },
  statusLabel: {
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '600',
  },
  toggleContainer: {
    alignItems: 'flex-end',
  },
  onlineText: {
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 4,
    letterSpacing: 1,
  },
  scroll: {
    flex: 1,
    padding: 20,
  },
  earningsCard: {
    backgroundColor: '#1e293b',
    borderRadius: 32,
    padding: 24,
    marginBottom: 24,
  },
  earningsMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  earningsTitle: {
    color: '#94a3b8',
    fontWeight: '700',
  },
  earningsAmount: {
    color: '#fff',
    fontWeight: '900',
    marginTop: 4,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  trendText: {
    color: '#059669',
    fontWeight: '800',
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statTitle: {
    color: '#64748b',
    fontWeight: '800',
    letterSpacing: 1,
  },
  statValue: {
    color: '#fff',
    fontWeight: '700',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#334155',
  },
  mapContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 16,
    marginLeft: 4,
  },
  mapSurface: {
    height: 180,
    borderRadius: 24,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandMap: {
    borderRadius: 12,
    backgroundColor: '#4f46e5',
  },
  milestoneCard: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  milestoneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  milestoneContent: {
    flex: 1,
    marginLeft: 16,
  },
  milestoneTitle: {
    fontWeight: '800',
    color: '#0f172a',
  },
  milestoneSub: {
    color: '#64748b',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressInner: {
    height: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 4,
  },
  offlineOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  offlineTextLarge: {
    fontWeight: '900',
    color: '#0f172a',
  },
  offlineSub: {
    color: '#94a3b8',
    marginTop: 4,
  }
});
