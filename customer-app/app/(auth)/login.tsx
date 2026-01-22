import { useState } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, Surface, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { Phone, ArrowRight, ShieldCheck } from 'lucide-react-native';


export default function LoginScreen() {
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1); // 1: Phone, 2: OTP
    const [isLoading, setIsLoading] = useState(false);

    const theme = useTheme();
    const router = useRouter();
    const { login } = useAuthStore();

    const handleSendOTP = async () => {
        setIsLoading(true);
        // Mock API call
        setTimeout(() => {
            setStep(2);
            setIsLoading(false);
        }, 1500);
    };

    const handleVerifyOTP = async () => {
        setIsLoading(true);
        // Mock verification
        setTimeout(async () => {
            await login({ id: '1', name: 'John Doe', phone }, 'mock-jwt-token');
            router.replace('/(tabs)');
            setIsLoading(false);
        }, 1500);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <View style={[styles.logoContainer, { backgroundColor: theme.colors.primary }]}>
                        <Image
                            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png' }}
                            style={styles.logo}
                        />
                    </View>
                    <Text variant="headlineMedium" style={styles.title}>PORTER</Text>
                    <Text variant="bodyLarge" style={styles.subtitle}>Direct Logistics. Simplified.</Text>
                </View>

                <Surface style={styles.card} elevation={1}>
                    <View style={styles.cardHeader}>
                        <Text variant="titleLarge" style={styles.cardTitle}>
                            {step === 1 ? 'Welcome back' : 'Verify Identity'}
                        </Text>
                        <Text variant="bodyMedium" style={styles.cardSubtitle}>
                            {step === 1
                                ? 'Enter your phone number to continue'
                                : `Enter the code sent to ${phone}`}
                        </Text>
                    </View>

                    {step === 1 ? (
                        <View style={styles.form}>
                            <TextInput
                                label="Phone Number"
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
                                contentStyle={styles.buttonContent}
                                style={styles.button}
                            >
                                Get OTP
                            </Button>
                        </View>
                    ) : (
                        <View style={styles.form}>
                            <TextInput
                                label="Verification Code"
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
                                contentStyle={styles.buttonContent}
                                style={styles.button}
                            >
                                Verify & Login
                            </Button>
                            <Button
                                mode="text"
                                onPress={() => setStep(1)}
                                style={styles.backButton}
                            >
                                Change Number
                            </Button>
                        </View>
                    )}
                </Surface>

                <View style={styles.footer}>
                    <Text variant="bodySmall" style={styles.footerText}>
                        By continuing, you agree to our Terms of Service and Privacy Policy.
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        elevation: 4,
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    logo: {
        width: 48,
        height: 48,
        tintColor: '#ffffff',
    },
    title: {
        fontWeight: '900',
        letterSpacing: 2,
        color: '#0f172a',
    },
    subtitle: {
        color: '#64748b',
        marginTop: 4,
        fontWeight: '500',
    },
    card: {
        padding: 24,
        borderRadius: 24,
        backgroundColor: '#ffffff',
    },
    cardHeader: {
        marginBottom: 24,
    },
    cardTitle: {
        fontWeight: '800',
        color: '#0f172a',
    },
    cardSubtitle: {
        color: '#94a3b8',
        marginTop: 4,
    },
    form: {
        gap: 16,
    },
    input: {
        backgroundColor: '#ffffff',
    },
    button: {
        marginTop: 8,
        borderRadius: 12,
    },
    buttonContent: {
        height: 56,
    },
    backButton: {
        marginTop: 8,
    },
    footer: {
        marginTop: 40,
        alignItems: 'center',
    },
    footerText: {
        textAlign: 'center',
        color: '#94a3b8',
        lineHeight: 18,
    },
});
