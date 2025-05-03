import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView } from 'react-native';
import { TextInput, Button, HelperText } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { auth } from '../../db/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { LogBox } from 'react-native';

// Suppress Firebase auth error messages that appear from the bottom
LogBox.ignoreLogs(['firebase/wrong-password', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-email', 'auth/too-many-requests','Error (auth/invalid-credential)']);
import { LinearGradient } from 'expo-linear-gradient';

const PrivateBusSignIn = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [generalError, setGeneralError] = useState('');
    const { t } = useTranslation();

    const handleSignIn = () => {
        // Reset previous errors
        setEmailError('');
        setPasswordError('');
        setGeneralError('');

        // Validation
        if (!email) {
            setEmailError(t('Email is required'));
            return;
        }
        
        if (!password) {
            setPasswordError(t('Password is required'));
            return;
        }

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => { 
                const user = userCredential.user;
                console.log("User signed in successfully:", user);
                router.push('../../screens/owner/ownerHome');
            }).catch((error) => {
                console.error("Error signing user:", error.message);
                
                // Handle specific Firebase Auth errors
                switch (error.code) {
                    case 'auth/invalid-email':
                        setEmailError(t('Invalid email address format'));
                        break;
                    case 'auth/user-not-found':
                        setEmailError(t('No account found with this email'));
                        break;
                    case 'auth/invalid-credential':
                        setPasswordError(t('Incorrect password'));
                        break;
                    case 'auth/too-many-requests':
                        setGeneralError(t('Too many failed attempts. Please try again later'));
                        break;
                    case 'auth/network-request-failed':
                        setGeneralError(t('Network error. Please check your connection'));
                        break;
                    default:
                        setGeneralError(t('Sign in failed. Please try again'));
                        break;
                }
            });
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
                                <Text style={styles.logoSubText}>Bus Owner Portal</Text>
                            </View>

                            <View style={styles.formContainer}>
                                <Text style={styles.subHeading}>{t('signIn')}</Text>

                                {generalError ? (
                                    <View style={styles.generalErrorContainer}>
                                        <Text style={styles.generalErrorText}>{generalError}</Text>
                                    </View>
                                ) : null}

                                <TextInput
                                    style={styles.input}
                                    label={t('email')}
                                    value={email}
                                    onChangeText={text => {
                                        setEmail(text);
                                        setEmailError(''); // Clear error when typing
                                    }}
                                    mode='outlined'
                                    outlineColor={emailError ? "#FF0000" : "#1976d2"}
                                    activeOutlineColor={emailError ? "#FF0000" : "#1976d2"}
                                    theme={{ colors: { primary: emailError ? "#FF0000" : "#1976d2" } }}
                                    left={<TextInput.Icon icon="email" color={emailError ? "#FF0000" : "#1976d2"} />}
                                    error={!!emailError}
                                />
                                {emailError ? (
                                    <HelperText type="error" visible={!!emailError}>
                                        {emailError}
                                    </HelperText>
                                ) : null}

                                <TextInput
                                    style={styles.input}
                                    label={t('Password')}
                                    value={password}
                                    onChangeText={text => {
                                        setPassword(text);
                                        setPasswordError(''); // Clear error when typing
                                    }}
                                    mode='outlined'
                                    secureTextEntry={!showPassword}
                                    outlineColor={passwordError ? "#FF0000" : "#1976d2"}
                                    activeOutlineColor={passwordError ? "#FF0000" : "#1976d2"}
                                    theme={{ colors: { primary: passwordError ? "#FF0000" : "#1976d2" } }}
                                    left={<TextInput.Icon icon="lock" color={passwordError ? "#FF0000" : "#1976d2"} />}
                                    right={
                                        <TextInput.Icon
                                            icon={showPassword ? 'eye-off' : 'eye'}
                                            color={passwordError ? "#FF0000" : "#1976d2"}
                                            onPress={() => setShowPassword(!showPassword)}
                                        />
                                    }
                                    error={!!passwordError}
                                />
                                {passwordError ? (
                                    <HelperText type="error" visible={!!passwordError}>
                                        {passwordError}
                                    </HelperText>
                                ) : null}
                                
                                <TouchableOpacity onPress={() => router.push('owner/privateForgotPassword')}>
                                    <Text style={styles.forgotPassword}>{t('forgot password')}</Text>
                                </TouchableOpacity>
                                
                                <Button 
                                    mode='contained' 
                                    style={styles.signInButton} 
                                    labelStyle={styles.buttonText}
                                    onPress={handleSignIn}
                                    buttonColor="#1976d2"
                                >
                                    {t('signIn')}
                                </Button>
                                
                                <Text style={styles.orText}>OR</Text>
                                
                                <Button 
                                    mode='outlined' 
                                    style={styles.createAccountButton} 
                                    labelStyle={styles.createAccountButtonText}
                                    onPress={() => router.push('owner/privateSignUp')}
                                    textColor="#1976d2"
                                    buttonColor="white"
                                >
                                    {t('create account')}
                                </Button>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </LinearGradient>
        </SafeAreaView>
    );
};

export default PrivateBusSignIn;

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
        marginTop: 10,
        backgroundColor: 'white',
    },
    forgotPassword: {
        textAlign: 'right',
        marginTop: 8,
        marginBottom: 20,
        color: '#1976d2',
        fontWeight: '500',
    },
    signInButton: {
        padding: 5,
        borderRadius: 10,
        elevation: 2,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    orText: {
        textAlign: 'center',
        margin: 15,
        color: '#666',
    },
    createAccountButton: {
        padding: 5,
        borderRadius: 10,
        borderColor: '#1976d2',
        borderWidth: 1,
    },
    createAccountButtonText: {
        color: '#1976d2',
        fontWeight: '600',
    },
    generalErrorContainer: {
        backgroundColor: '#ffebee',
        padding: 10,
        borderRadius: 5,
        marginBottom: 15,
    },
    generalErrorText: {
        color: '#d32f2f',
        textAlign: 'center',
    }
});