import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Avatar, Surface, IconButton, useTheme, List, Button, Divider, ProgressBar } from 'react-native-paper';
import { useAuthStore } from '../../src/stores/authStore';
import { useRouter } from 'expo-router';
import {
    Truck,
    Settings,
    CreditCard,
    User,
    ShieldCheck,
    LogOut,
    ChevronRight,
    HelpCircle,
    FileText,
    Wallet
} from 'lucide-react-native';


export default function DriverProfile() {
    const theme = useTheme();
    const router = useRouter();
    const { user, logout } = useAuthStore();

    const handleLogout = async () => {
        await logout();
        router.replace('/(auth)/login');
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View
                style={styles.header}
            >
                <Surface style={styles.profileCard} elevation={2}>
                    <View style={styles.topRow}>
                        <Avatar.Text
                            size={64}
                            label={user?.name?.substring(0, 2).toUpperCase() || 'RK'}
                            style={{ backgroundColor: '#1e293b' }}
                            labelStyle={{ color: '#fff' }}
                        />
                        <View style={styles.mainInfo}>
                            <Text variant="titleLarge" style={styles.name}>{user?.name || 'Rajesh Kumar'}</Text>
                            <Text variant="bodySmall" style={styles.role}>Commercial Partner</Text>
                            <View style={styles.ratingRow}>
                                <IconButton icon="star" size={14} iconColor="#f59e0b" style={{ margin: 0 }} />
                                <Text variant="labelLarge" style={styles.rating}>4.92</Text>
                                <Text variant="labelSmall" style={styles.ratingCount}>(842 reviews)</Text>
                            </View>
                        </View>
                        <View style={styles.verifiedBadge}>
                            <ShieldCheck size={24} color="#10b981" />
                        </View>
                    </View>

                    <Divider style={styles.headerDivider} />

                    <View style={styles.vehicleInfo}>
                        <View style={styles.vcItem}>
                            <Text variant="labelSmall" style={styles.vcLabel}>VEHICLE</Text>
                            <Text variant="titleSmall" style={styles.vcValue}>Tata Ace (Mini)</Text>
                        </View>
                        <View style={styles.vcItem}>
                            <Text variant="labelSmall" style={styles.vcLabel}>NUMBER</Text>
                            <Text variant="titleSmall" style={styles.vcValue}>MH-02-AX-4829</Text>
                        </View>
                    </View>
                </Surface>
            </View>

            <View style={styles.content}>
                {/* Wallet Brief */}
                <Surface style={styles.walletCard} elevation={0}>
                    <View style={styles.walletContent}>
                        <View style={styles.walletIcon}>
                            <Wallet size={24} color="#4f46e5" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 16 }}>
                            <Text variant="labelSmall" style={styles.walletLabel}>PENDING SETTLEMENT</Text>
                            <Text variant="titleLarge" style={styles.walletAmount}>₹12,450.00</Text>
                        </View>
                        <Button mode="text" labelStyle={{ fontWeight: '800' }}>Withdraw</Button>
                    </View>
                </Surface>

                <Text variant="titleSmall" style={styles.sectionTitle}>Business Tools</Text>
                <Surface style={styles.menuCard} elevation={0}>
                    <List.Item
                        title="Earnings Reports"
                        left={() => <FileText size={20} color="#64748b" style={styles.listIcon} />}
                        right={() => <ChevronRight size={18} color="#cbd5e1" />}
                        onPress={() => { }}
                        style={styles.listItem}
                    />
                    <Divider style={styles.divider} />
                    <List.Item
                        title="Vehicle Documents"
                        description="Verified"
                        descriptionStyle={{ color: '#10b981' }}
                        left={() => <Truck size={20} color="#64748b" style={styles.listIcon} />}
                        right={() => <ChevronRight size={18} color="#cbd5e1" />}
                        onPress={() => { }}
                        style={styles.listItem}
                    />
                    <Divider style={styles.divider} />
                    <List.Item
                        title="Preferences"
                        left={() => <Settings size={20} color="#64748b" style={styles.listIcon} />}
                        right={() => <ChevronRight size={18} color="#cbd5e1" />}
                        onPress={() => { }}
                        style={styles.listItem}
                    />
                </Surface>

                <Button
                    mode="contained"
                    onPress={handleLogout}
                    style={styles.logoutBtn}
                    buttonColor="#fef2f2"
                    textColor="#ef4444"
                    icon="logout"
                    contentStyle={{ height: 56 }}
                >
                    Partner Sign Out
                </Button>

                <View style={styles.footer}>
                    <Text variant="bodySmall" style={styles.version}>Driver SDK v4.2.0 (ENCRYPTED)</Text>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        padding: 24,
        paddingTop: 80,
        backgroundColor: '#0f172a',
        paddingBottom: 60,
    },
    profileCard: {
        padding: 24,
        borderRadius: 32,
        backgroundColor: '#fff',
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    mainInfo: {
        flex: 1,
        marginLeft: 16,
    },
    name: {
        fontWeight: '900',
        color: '#0f172a',
    },
    role: {
        color: '#64748b',
        fontWeight: '600',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    rating: {
        fontWeight: '900',
        color: '#0f172a',
        marginLeft: -4,
    },
    ratingCount: {
        color: '#94a3b8',
        marginLeft: 6,
    },
    verifiedBadge: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#ecfdf5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerDivider: {
        marginVertical: 20,
        backgroundColor: '#f1f5f9',
    },
    vehicleInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    vcItem: {
        flex: 1,
    },
    vcLabel: {
        color: '#94a3b8',
        fontWeight: '800',
        fontSize: 9,
        letterSpacing: 1,
    },
    vcValue: {
        fontWeight: '700',
        color: '#334155',
    },
    content: {
        padding: 24,
        marginTop: -40,
    },
    walletCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        marginBottom: 24,
    },
    walletContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    walletIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#eef2ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    walletLabel: {
        color: '#94a3b8',
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    walletAmount: {
        color: '#0f172a',
        fontWeight: '900',
    },
    sectionTitle: {
        color: '#64748b',
        marginBottom: 12,
        marginLeft: 8,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    menuCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        marginBottom: 24,
    },
    listItem: {
        paddingVertical: 12,
    },
    listIcon: {
        marginLeft: 16,
        marginTop: 4,
    },
    divider: {
        backgroundColor: '#f8fafc',
        marginHorizontal: 16,
    },
    logoutBtn: {
        borderRadius: 16,
        marginTop: 8,
    },
    footer: {
        marginTop: 40,
        alignItems: 'center',
        paddingBottom: 40,
    },
    version: {
        color: '#94a3b8',
        fontWeight: '600',
        fontSize: 10,
    },
});
