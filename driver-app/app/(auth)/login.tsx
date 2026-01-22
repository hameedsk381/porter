import { useState } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, Surface, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { Phone, ArrowRight, ShieldCheck, Truck } from 'lucide-react-native';
import { authAPI } from '../../src/services/api';


export default function LoginScreen() {
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const theme = useTheme();
    const router = useRouter();
    const { login } = useAuthStore();

    const handleSendOTP = async () => {
        if (!phone || phone.length < 10) return;
        setIsLoading(true);
        try {
            const response = await authAPI.sendOTP(phone, 'driver');
            if (response.data.status === 'success') {
                setStep(2);
            } else {
                alert(response.data.message || 'Failed to send OTP');
            }
        } catch (error: any) {
            console.error('Send OTP Error:', error);
            alert(error.response?.data?.message || 'Failed to connect to server');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp || otp.length < 4) return;
        setIsLoading(true);
        try {
            const response = await authAPI.verifyOTP(phone, otp, 'driver');
            if (response.data.status === 'success') {
                const { user, accessToken } = response.data.data;
                await login(user, accessToken);
                router.replace('/(tabs)');
            } else {
                alert(response.data.message || 'Invalid OTP');
            }
        } catch (error: any) {
            console.error('Verify OTP Error:', error);
            alert(error.response?.data?.message || 'OTP verification failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View
                    style={styles.header}
                >
                    <View style={[styles.logoContainer, { backgroundColor: '#0f172a' }]}>
                        <Truck size={40} color="#ffffff" />
                    </View>
                    <Text variant="headlineMedium" style={styles.title}>PORTER PARTNER</Text>
                    <Text variant="bodyLarge" style={styles.subtitle}>Empowering your logistics journey.</Text>
                </View>

                <Surface style={styles.card} elevation={1}>
                    <View style={styles.cardHeader}>
                        <Text variant="titleLarge" style={styles.cardTitle}>
                            {step === 1 ? 'Partner Login' : 'Verify Driver'}
                        </Text>
                        <Text variant="bodyMedium" style={styles.cardSubtitle}>
                            {step === 1
                                ? 'Login with your registered mobile number'
                                : `Enter the code sent to ${phone}`}
                        </Text>
                    </View>

                    {step === 1 ? (
                        <View style={styles.form}>
                            <TextInput
                                label="Registered Mobile"
                                value={phone}
                                onChangeText={setPhone}
                                mode="outlined"
                                keyboardType="phone-pad"
                                left={<TextInput.Icon icon={() => <Phone size={20} color={theme.colors.outline} />} />}
                                style={styles.input}
                            />
                            <Button
                                mode="contained"
                                onPress={handleSendOTP}
                                loading={isLoading}
                                disabled={phone.length < 10 || isLoading}
                                buttonColor={theme.colors.secondary}
                                contentStyle={styles.buttonContent}
                                style={styles.button}
                            >
                                Send Code
                            </Button>
                        </View>
                    ) : (
                        <View style={styles.form}>
                            <TextInput
                                label="Enter 6-digit Code"
                                value={otp}
                                onChangeText={setOtp}
                                mode="outlined"
                                keyboardType="number-pad"
                                maxLength={6}
                                left={<TextInput.Icon icon={() => <ShieldCheck size={20} color={theme.colors.outline} />} />}
                                style={styles.input}
                            />
                            <Button
                                mode="contained"
                                onPress={handleVerifyOTP}
                                loading={isLoading}
                                disabled={otp.length < 4 || isLoading}
                                buttonColor={theme.colors.secondary}
                                contentStyle={styles.buttonContent}
                                style={styles.button}
                            >
                                Start Working
                            </Button>
                            <Button mode="text" onPress={() => setStep(1)} textColor={theme.colors.secondary}>
                                Back to Login
                            </Button>
                        </View>
                    )}
                </Surface>

                <View style={styles.footer}>
                    <Text variant="bodySmall" style={styles.footerText}>
                        Ensuring safe and reliable logistics across India.
                    </Text>
                    <Text variant="labelSmall" style={styles.version}>v.4.2.0-STABLE</Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontWeight: '900',
        letterSpacing: 1,
        color: '#0f172a',
    },
    subtitle: {
        color: '#64748b',
        marginTop: 4,
        fontWeight: '500',
    },
    card: {
        padding: 32,
        borderRadius: 32,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    cardHeader: {
        marginBottom: 32,
    },
    cardTitle: {
        fontWeight: '900',
        color: '#0f172a',
        fontSize: 24,
    },
    cardSubtitle: {
        color: '#94a3b8',
        marginTop: 6,
        lineHeight: 20,
    },
    form: {
        gap: 16,
    },
    input: {
        backgroundColor: '#ffffff',
    },
    button: {
        marginTop: 8,
        borderRadius: 16,
    },
    buttonContent: {
        height: 60,
    },
    footer: {
        marginTop: 48,
        alignItems: 'center',
    },
    footerText: {
        color: '#94a3b8',
        textAlign: 'center',
    },
    version: {
        marginTop: 12,
        fontWeight: '800',
        color: '#e2e8f0',
        letterSpacing: 1,
    },
});
