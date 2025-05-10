import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView } from 'react-native';
import { TextInput, Button, HelperText } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { auth, db } from '../../db/firebaseConfig';
import { sendPasswordResetEmail } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';

const DriverForgotPassword = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { t } = useTranslation();

    // Validation state
    const [emailError, setEmailError] = useState('');

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

    const handleResetPassword = async () => {
        // Reset messages
        setError('');
        setSuccess('');
        
        // Validate input
        const isEmailValid = validateEmail(email);
        
        if (!isEmailValid) {
            return;
        }

        try {
            setIsLoading(true);
            const trimmedEmail = email.trim().toLowerCase();
            
            // Check if a driver with this email exists in the driverDetails collection
            const driverExists = await checkDriverExists(trimmedEmail);
            
            if (!driverExists) {
                setError(t('No driver account found with this email address'));
                return;
            }
            
            // Send password reset email using Firebase Auth
            await sendPasswordResetEmail(auth, trimmedEmail);
            
            // Show success message
            setSuccess(t('Password reset link has been sent to your email'));
            setEmail(''); // Clear the email field after successful submission
            
        } catch (error) {
            console.error("Error sending password reset email:", error.message);
            
            // Handle different Firebase Auth errors
            switch (error.code) {
                case 'auth/invalid-email':
                    setError(t('Invalid email address'));
                    break;
                case 'auth/user-not-found':
                    setError(t('No account found with this email address'));
                    break;
                case 'auth/too-many-requests':
                    setError(t('Too many requests. Please try again later'));
                    break;
                default:
                    setError(t('Failed to send reset email. Please try again'));
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    // Check if driver exists with this email in driverDetails collection
    const checkDriverExists = async (email) => {
        try {
            // Query the driverDetails collection
            const driverCollectionRef = collection(db, "driverDetails");
            
            // We need to find documents where the ID ends with this email
            // Since we can't query by document ID suffix directly, we'll fetch all documents
            // and filter them manually (efficient for small collections)
            const querySnapshot = await getDocs(driverCollectionRef);
            
            // Check if any document ID ends with the email pattern
            // Document IDs are in format: licenseplate-email
            for (const doc of querySnapshot.docs) {
                const docId = doc.id;
                if (docId.indexOf('-') !== -1) {
                    const docEmail = docId.split('-')[1]; // Get the part after the dash
                    if (docEmail.toLowerCase() === email.toLowerCase()) {
                        return true; // Found a matching driver
                    }
                }
            }
            
            return false; // No matching driver found
        } catch (error) {
            console.error("Error checking driver existence:", error);
            throw error;
        }
    };

    const navigateToSignIn = () => {
        router.back(); // Go back to the sign-in screen
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
                                <Text style={styles.subHeading}>{t('Reset Password')}</Text>
                                <Text style={styles.instructions}>
                                    {t('Enter your email address below and we\'ll send you a link to reset your password')}
                                </Text>

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
                                
                                {!!error && (
                                    <View style={styles.errorContainer}>
                                        <Text style={styles.errorText}>{error}</Text>
                                    </View>
                                )}

                                {!!success && (
                                    <View style={styles.successContainer}>
                                        <Text style={styles.successText}>{success}</Text>
                                    </View>
                                )}
                                
                                <Button 
                                    mode='contained' 
                                    style={styles.resetButton} 
                                    labelStyle={styles.buttonText}
                                    onPress={handleResetPassword}
                                    loading={isLoading}
                                    disabled={isLoading}
                                    buttonColor="#1976d2"
                                >
                                    {isLoading ? t('Sending...') : t('Send Reset Link')}
                                </Button>

                                <Button 
                                    mode='text' 
                                    style={styles.backButton} 
                                    labelStyle={styles.backButtonText}
                                    onPress={navigateToSignIn}
                                >
                                    {t('Back to Sign In')}
                                </Button>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </LinearGradient>
        </SafeAreaView>
    );
};

export default DriverForgotPassword;

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
        marginBottom: 10,
        color: '#1976d2',
    },
    instructions: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
        color: '#757575',
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
    successContainer: {
        backgroundColor: '#E8F5E9',
        padding: 10,
        borderRadius: 5,
        marginVertical: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#2E7D32',
    },
    successText: {
        color: '#2E7D32',
        fontSize: 14,
    },
    resetButton: {
        padding: 5,
        borderRadius: 10,
        elevation: 2,
        marginTop: 20,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    backButton: {
        marginTop: 15,
    },
    backButtonText: {
        color: '#1976d2',
        fontSize: 14,
    },
});