import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Avatar, Surface, IconButton, useTheme, List, Button, Divider } from 'react-native-paper';
import { useAuthStore } from '../../src/stores/authStore';
import { useRouter } from 'expo-router';
import {
    User,
    Settings,
    CreditCard,
    MapPin,
    Shield,
    LogOut,
    ChevronRight,
    HelpCircle,
    Bell
} from 'lucide-react-native';


export default function ProfileScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { user, logout } = useAuthStore();

    const handleLogout = async () => {
        await logout();
        router.replace('/(auth)/login');
    };

    const menuItems = [
        { icon: MapPin, label: 'Saved Addresses', color: '#4f46e5' },
        { icon: CreditCard, label: 'Payments & Wallet', color: '#10b981' },
        { icon: Bell, label: 'Notifications', color: '#f59e0b' },
        { icon: Shield, label: 'Privacy & Security', color: '#ef4444' },
        { icon: HelpCircle, label: 'Support & Help', color: '#6366f1' },
    ];

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View
                style={styles.header}
            >
                <Surface style={styles.profileCard} elevation={2}>
                    <View style={styles.avatarRow}>
                        <Avatar.Text
                            size={80}
                            label={user?.name?.substring(0, 2).toUpperCase() || 'JD'}
                            style={{ backgroundColor: theme.colors.primaryContainer }}
                            labelStyle={{ color: theme.colors.primary, fontWeight: '900' }}
                        />
                        <View style={styles.profileInfo}>
                            <Text variant="headlineSmall" style={styles.name}>{user?.name || 'John Doe'}</Text>
                            <Text variant="bodyMedium" style={styles.phone}>{user?.phone || '+91 99999 88888'}</Text>
                            <View style={styles.badge}>
                                <Text variant="labelSmall" style={styles.badgeText}>ELITE CUSTOMER</Text>
                            </View>
                        </View>
                        <IconButton icon="pencil-outline" size={20} onPress={() => { }} />
                    </View>
                </Surface>
            </View>

            <View style={styles.content}>
                <Text variant="titleSmall" style={styles.sectionTitle}>Account Settings</Text>
                <Surface style={styles.menuCard} elevation={0}>
                    {menuItems.map((item, index) => (
                        <View key={index}>
                            <List.Item
                                title={item.label}
                                titleStyle={styles.menuLabel}
                                left={() => (
                                    <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
                                        <item.icon size={20} color={item.color} />
                                    </View>
                                )}
                                right={() => <ChevronRight size={18} color="#94a3b8" style={{ marginTop: 12 }} />}
                                onPress={() => { }}
                                style={styles.listItem}
                            />
                            {index < menuItems.length - 1 && <Divider style={styles.divider} />}
                        </View>
                    ))}
                </Surface>

                <Button
                    mode="contained"
                    onPress={handleLogout}
                    style={styles.logoutBtn}
                    buttonColor="#fef2f2"
                    textColor="#ef4444"
                    icon={() => <LogOut size={18} color="#ef4444" />}
                    contentStyle={styles.logoutContent}
                >
                    Sign Out
                </Button>

                <View style={styles.footer}>
                    <Text variant="bodySmall" style={styles.version}>Porter App v4.2.0 (STABLE)</Text>
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
        backgroundColor: '#4f46e5',
        paddingBottom: 60,
    },
    profileCard: {
        padding: 24,
        borderRadius: 32,
        backgroundColor: '#fff',
    },
    avatarRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileInfo: {
        flex: 1,
        marginLeft: 20,
    },
    name: {
        fontWeight: '900',
        color: '#0f172a',
    },
    phone: {
        color: '#64748b',
        marginTop: 2,
    },
    badge: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginTop: 8,
    },
    badgeText: {
        fontWeight: '900',
        color: '#475569',
        fontSize: 10,
    },
    content: {
        padding: 24,
        marginTop: -40,
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
        paddingVertical: 8,
    },
    menuIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 16,
        marginTop: 4,
    },
    menuLabel: {
        fontWeight: '700',
        color: '#334155',
    },
    divider: {
        backgroundColor: '#f8fafc',
        marginHorizontal: 16,
    },
    logoutBtn: {
        borderRadius: 16,
        marginTop: 8,
    },
    logoutContent: {
        height: 56,
    },
    footer: {
        marginTop: 40,
        alignItems: 'center',
        paddingBottom: 40,
    },
    version: {
        color: '#94a3b8',
        fontWeight: '600',
    },
});
