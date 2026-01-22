import { View, StyleSheet, FlatList, ScrollView } from 'react-native';
import { Text, Surface, IconButton, useTheme, Chip, Button } from 'react-native-paper';
import { Truck, MapPin, Calendar, ChevronRight, Clock } from 'lucide-react-native';


export default function ActivityScreen() {
    const theme = useTheme();

    const history = [
        {
            id: '1',
            type: 'Mini Truck',
            date: 'Oct 24, 10:30 AM',
            status: 'Completed',
            pickup: 'Andheri West S.V Road',
            drop: 'Powai Business Park',
            price: '₹340'
        },
        {
            id: '2',
            type: '3-Wheeler',
            date: 'Oct 22, 02:15 PM',
            status: 'Cancelled',
            pickup: 'Dadar Station East',
            drop: 'Worli Sea Link',
            price: '₹210'
        },
        {
            id: '3',
            type: 'Pickup',
            date: 'Oct 20, 11:00 AM',
            status: 'Completed',
            pickup: 'Borivali Highway',
            drop: 'Vile Parle East',
            price: '₹560'
        },
    ];

    const renderItem = ({ item, index }: { item: any; index: number }) => (
        <View>
            <Surface style={styles.card} elevation={0}>
                <View style={styles.cardHeader}>
                    <View style={styles.typeContainer}>
                        <View style={[styles.iconBox, { backgroundColor: theme.colors.primaryContainer }]}>
                            <Truck size={20} color={theme.colors.primary as any} />
                        </View>
                        <View>
                            <Text variant="titleMedium" style={styles.vType}>{item.type}</Text>
                            <Text variant="bodySmall" style={styles.date}>{item.date}</Text>
                        </View>
                    </View>
                    <Chip
                        style={[
                            styles.statusChip,
                            { backgroundColor: item.status === 'Completed' ? '#ecfdf5' : '#fef2f2' }
                        ]}
                        textStyle={{ color: item.status === 'Completed' ? '#059669' : '#ef4444', fontSize: 10, fontWeight: '900' }}
                    >
                        {item.status.toUpperCase()}
                    </Chip>
                </View>

                <View style={styles.locations}>
                    <View style={styles.locationRow}>
                        <View style={styles.dot} />
                        <Text variant="bodySmall" style={styles.locationText} numberOfLines={1}>{item.pickup}</Text>
                    </View>
                    <View style={styles.dashLine} />
                    <View style={styles.locationRow}>
                        <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
                        <Text variant="bodySmall" style={styles.locationText} numberOfLines={1}>{item.drop}</Text>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <Text variant="titleMedium" style={styles.price}>{item.price}</Text>
                    <Button mode="text" labelStyle={styles.detailsBtn} onPress={() => { }}>
                        Rebook
                    </Button>
                </View>
            </Surface>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text variant="headlineSmall" style={styles.title}>Your Activity</Text>
                <Text variant="bodyMedium" style={styles.subtitle}>Last 30 days logistics history</Text>
            </View>

            <FlatList
                data={history}
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
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 16,
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
    typeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    vType: {
        fontWeight: '800',
        color: '#0f172a',
    },
    date: {
        color: '#94a3b8',
    },
    statusChip: {
        height: 24,
    },
    locations: {
        paddingLeft: 4,
        marginBottom: 16,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#e2e8f0',
    },
    locationText: {
        color: '#475569',
        fontWeight: '500',
    },
    dashLine: {
        width: 2,
        height: 12,
        backgroundColor: '#f1f5f9',
        marginLeft: 3,
        marginVertical: 4,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f8fafc',
    },
    price: {
        fontWeight: '900',
        color: '#0f172a',
    },
    detailsBtn: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
});
