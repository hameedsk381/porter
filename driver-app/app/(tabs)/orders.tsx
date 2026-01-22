import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Surface, IconButton, useTheme, Chip, Button } from 'react-native-paper';
import { Truck, MapPin, Calendar, Clock, ArrowUpRight, CheckCircle2 } from 'lucide-react-native';


export default function TripsHistory() {
    const theme = useTheme();

    const orders = [
        {
            id: 'T101',
            type: 'Mini Truck',
            customer: 'Aman S.',
            earnings: '₹285.00',
            time: '10:45 AM',
            date: 'Today',
            distance: '12.4 km',
            pickup: 'Terminal 2, Mumbai Airport',
            drop: 'Bandra BKC, G Block'
        },
        {
            id: 'T100',
            type: 'Pickup',
            customer: 'LogiCorp Ltd',
            earnings: '₹740.00',
            time: '08:20 AM',
            date: 'Today',
            distance: '24.1 km',
            pickup: 'Vashi MIDC Sector 2',
            drop: 'Nariman Point, Marine Drive'
        },
        {
            id: 'T099',
            type: 'Mini Truck',
            customer: 'Priya K.',
            earnings: '₹310.00',
            time: '06:15 PM',
            date: 'Yesterday',
            distance: '15.2 km',
            pickup: 'Kurla West',
            drop: 'Thane West'
        },
    ];

    const renderItem = ({ item, index }: { item: any; index: number }) => (
        <View>
            <Surface style={styles.card} elevation={0}>
                <View style={styles.cardHeader}>
                    <View style={styles.idContainer}>
                        <Text variant="labelSmall" style={styles.orderId}>TRIP #{item.id}</Text>
                        <Text variant="titleMedium" style={styles.customer}>{item.customer}</Text>
                    </View>
                    <Text variant="titleLarge" style={styles.earnings}>{item.earnings}</Text>
                </View>

                <View style={styles.tripDetails}>
                    <View style={styles.detailItem}>
                        <MapPin size={14} color="#94a3b8" />
                        <Text variant="bodySmall" style={styles.detailText}>{item.distance}</Text>
                    </View>
                    <View style={styles.detailDivider} />
                    <View style={styles.detailItem}>
                        <Clock size={14} color="#94a3b8" />
                        <Text variant="bodySmall" style={styles.detailText}>{item.time}</Text>
                    </View>
                    <View style={styles.detailDivider} />
                    <View style={styles.detailItem}>
                        <Calendar size={14} color="#94a3b8" />
                        <Text variant="bodySmall" style={styles.detailText}>{item.date}</Text>
                    </View>
                </View>

                <View style={styles.routeContainer}>
                    <View style={styles.routeItem}>
                        <View style={styles.routeIconLine}>
                            <View style={styles.circle} />
                            <View style={styles.dash} />
                            <CheckCircle2 size={16} color="#10b981" />
                        </View>
                        <View style={styles.routeTextContainer}>
                            <Text variant="labelSmall" style={styles.routeLabel}>PICKUP</Text>
                            <Text variant="bodySmall" style={styles.address} numberOfLines={1}>{item.pickup}</Text>
                            <View style={{ height: 12 }} />
                            <Text variant="labelSmall" style={styles.routeLabel}>DROPOFF</Text>
                            <Text variant="bodySmall" style={styles.address} numberOfLines={1}>{item.drop}</Text>
                        </View>
                    </View>
                </View>

                <Button mode="text" onPress={() => { }} contentStyle={styles.detailsBtn}>
                    View Trip Invoice
                </Button>
            </Surface>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text variant="headlineSmall" style={styles.title}>Trip Activity</Text>
                <Text variant="bodyMedium" style={styles.subtitle}>Review your performance and earnings</Text>
            </View>

            <FlatList
                data={orders}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        padding: 24,
        paddingTop: 60,
        backgroundColor: '#fff',
    },
    title: {
        fontWeight: '900',
        color: '#0f172a',
    },
    subtitle: {
        color: '#64748b',
        marginTop: 4,
    },
    listContent: {
        padding: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    idContainer: {
        flex: 1,
    },
    orderId: {
        color: '#94a3b8',
        fontWeight: '800',
        letterSpacing: 1,
    },
    customer: {
        fontWeight: '800',
        color: '#1e293b',
        marginTop: 2,
    },
    earnings: {
        fontWeight: '900',
        color: '#10b981',
    },
    tripDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
        backgroundColor: '#f8fafc',
        padding: 8,
        borderRadius: 12,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    detailText: {
        color: '#64748b',
        fontWeight: '600',
    },
    detailDivider: {
        width: 1,
        height: 12,
        backgroundColor: '#e2e8f0',
    },
    routeContainer: {
        marginBottom: 16,
    },
    routeItem: {
        flexDirection: 'row',
        gap: 16,
    },
    routeIconLine: {
        alignItems: 'center',
        paddingTop: 4,
    },
    circle: {
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#4f46e5',
    },
    dash: {
        width: 2,
        height: 32,
        backgroundColor: '#f1f5f9',
        marginVertical: 4,
    },
    routeTextContainer: {
        flex: 1,
    },
    routeLabel: {
        color: '#94a3b8',
        fontWeight: '800',
        fontSize: 9,
        letterSpacing: 0.5,
    },
    address: {
        color: '#334155',
        fontWeight: '600',
        marginTop: 2,
    },
    detailsBtn: {
        justifyContent: 'flex-end',
    },
});
