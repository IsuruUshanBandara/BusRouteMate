import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView } from 'react-native';
import { TextInput, Button, HelperText } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { auth, db } from '../../db/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';

const DriverSignIn = () => {
    const router = useRouter();
    const { category } = useLocalSearchParams();
    const [licensePlateNumber, setLicensePlateNumber] = useState('');
    const [email, setEmail] = useState('');
    const [driverPassword, setDriverPassword] = useState('');
    const [showDriverPassword, setShowDriverPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { t } = useTranslation();

    // Validation states
    const [emailError, setEmailError] = useState('');
    const [licensePlateError, setLicensePlateError] = useState('');

    // Validate email
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            setEmailError(t('Email is required'));
            return false;
        } else if (!emailRegex.test(email)) {
            setEmailError(t('Please enter a valid email address'));
            return false;
        } else {
            setEmailError('');
            return true;
        }
    };

    // Validate license plate
    const validateLicensePlate = (plate) => {
        if (!plate) {
            setLicensePlateError(t('License plate number is required'));
            return false;
        } else {
            setLicensePlateError('');
            return true;
        }
    };

    const handleSignIn = async () => {
        // Reset error message
        setError('');
        
        // Validate inputs
        const isEmailValid = validateEmail(email);
        const isPlateValid = validateLicensePlate(licensePlateNumber);
        
        if (!isEmailValid || !isPlateValid || !driverPassword) {
            if (!driverPassword) {
                setError(t('Password is required'));
            }
            return;
        }

        try {
            setIsLoading(true);
            
            // Create document ID in format "licenseplate-email"
            const docId = `${licensePlateNumber.trim()}-${email.trim().toLowerCase()}`;
            
            // Check if document exists in driverDetails collection
            const driverDocRef = doc(db, "driverDetails", docId);
            const driverDocSnap = await getDoc(driverDocRef);
            
            if (!driverDocSnap.exists()) {
                setError(t('Driver with this license plate and email combination not found'));
                setIsLoading(false);
                return;
            }
            
            // Document exists, proceed with authentication
            const userCredential = await signInWithEmailAndPassword(auth, email, driverPassword);
            const user = userCredential.user;
            console.log("Driver signed in successfully:", user);
            
            // Navigate to driver home screen
            router.push({ 
                pathname: '../../screens/driver/driverRideStartCancelScreen',
                params: { licensePlateNumber: licensePlateNumber }
            });
            
        } catch (error) {
            console.error("Error signing in driver:", error.message);
            
            // Handle different Firebase Auth errors
            switch (error.code) {
                case 'auth/invalid-credential':
                case 'auth/invalid-email':
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    setError(t('Invalid email or password'));
                    break;
                case 'auth/too-many-requests':
                    setError(t('Too many failed login attempts. Please try again later'));
                    break;
                default:
                    setError(t('Failed to sign in. Please try again'));
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#1976d2', '#2196f3', '#64b5f6']}
                style={styles.gradient}
            >
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                        <View style={styles.centeredContent}>
                            <View style={styles.logoContainer}>
                                <Text style={styles.logoText}>Bus Route Mate</Text>
                                <Text style={styles.logoSubText}>Driver Portal</Text>
                            </View>

                            <View style={styles.formContainer}>
                                <Text style={styles.subHeading}>{t('signIn')}</Text>

                                <TextInput
                                    style={styles.input}
                                    label={t('plate num')}
                                    value={licensePlateNumber}
                                    onChangeText={text => {
                                        setLicensePlateNumber(text);
                                        validateLicensePlate(text);
                                    }}
                                    mode='outlined'
                                    outlineColor={licensePlateError ? "#B00020" : "#1976d2"}
                                    activeOutlineColor="#1976d2"
                                    theme={{ colors: { primary: '#1976d2' } }}
                                    left={<TextInput.Icon icon="card-text" color="#1976d2" />}
                                    error={!!licensePlateError}
                                />
                                {!!licensePlateError && <HelperText type="error">{licensePlateError}</HelperText>}

                                <TextInput
                                    style={styles.input}
                                    label={t('email')}
                                    value={email}
                                    onChangeText={text => {
                                        setEmail(text);
                                        validateEmail(text);
                                    }}
                                    mode='outlined'
                                    keyboardType='email-address'
                                    autoCapitalize='none'
                                    outlineColor={emailError ? "#B00020" : "#1976d2"}
                                    activeOutlineColor="#1976d2"
                                    theme={{ colors: { primary: '#1976d2' } }}
                                    left={<TextInput.Icon icon="email" color="#1976d2" />}
                                    error={!!emailError}
                                />
                                {!!emailError && <HelperText type="error">{emailError}</HelperText>}

                                <TextInput
                                    style={styles.input}
                                    label={t('Password')}
                                    value={driverPassword}
                                    onChangeText={text => setDriverPassword(text)}
                                    mode='outlined'
                                    secureTextEntry={!showDriverPassword}
                                    outlineColor="#1976d2"
                                    activeOutlineColor="#1976d2"
                                    theme={{ colors: { primary: '#1976d2' } }}
                                    left={<TextInput.Icon icon="lock" color="#1976d2" />}
                                    right={
                                        <TextInput.Icon
                                            icon={showDriverPassword ? 'eye-off' : 'eye'}
                                            color="#1976d2"
                                            onPress={() => setShowDriverPassword(!showDriverPassword)}
                                        />
                                    }
                                />
                                
                                {!!error && (
                                    <View style={styles.errorContainer}>
                                        <Text style={styles.errorText}>{error}</Text>
                                    </View>
                                )}
                                
                                <Button 
                                    mode='contained' 
                                    style={styles.signInButton} 
                                    labelStyle={styles.buttonText}
                                    onPress={handleSignIn}
                                    loading={isLoading}
                                    disabled={isLoading}
                                    buttonColor="#1976d2"
                                >
                                    {isLoading ? t('Signing In...') : t('signIn')}
                                </Button>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </LinearGradient>
        </SafeAreaView>
    );
};

export default DriverSignIn;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
    },
    centeredContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logoText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 3,
    },
    logoSubText: {
        fontSize: 18,
        color: 'white',
        marginTop: 5,
    },
    formContainer: {
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 25,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    subHeading: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#1976d2',
    },
    input: {
        marginVertical: 8,
        backgroundColor: 'white',
    },
    errorContainer: {
        backgroundColor: '#FFEBEE',
        padding: 10,
        borderRadius: 5,
        marginVertical: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#B00020',
    },
    errorText: {
        color: '#B00020',
        fontSize: 14,
    },
    signInButton: {
        padding: 5,
        borderRadius: 10,
        elevation: 2,
        marginTop: 20,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});