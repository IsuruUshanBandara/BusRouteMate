import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { TextInput, Button, HelperText } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { auth } from '../../db/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { db } from '../../db/firebaseConfig'; // Import Firestore
import { doc, getDoc } from 'firebase/firestore'; // Import Firestore functions
import { LinearGradient } from 'expo-linear-gradient';
import { LogBox } from 'react-native';
LogBox.ignoreLogs(['firebase/wrong-password', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-email', 'auth/too-many-requests','Error (auth/invalid-credential)']);

const PassengerSignIn = () => {
    const router = useRouter();
    const [passengerEmail, setPassengerEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [generalError, setGeneralError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSignIn = async () => {
        // Reset previous errors
        setEmailError('');
        setPasswordError('');
        setGeneralError('');
        setIsLoading(true); // Start loading indicator

        // Validation
        if (!passengerEmail) {
            setEmailError('Email is required');
            setIsLoading(false); // Stop loading on validation error
            return;
        }
        
        if (!password) {
            setPasswordError('Password is required');
            setIsLoading(false); // Stop loading on validation error
            return;
        }
    
        try {
            // Step 1: Authenticate with Firebase Auth
            const userCredential = await signInWithEmailAndPassword(auth, passengerEmail, password);
            const user = userCredential.user;
            console.log("Passenger authenticated successfully:", user.email);
            
            // Step 2: Check if user exists in passengerDetails collection
            const passengerDocRef = doc(db, "passengerDetails", passengerEmail);
            const passengerDocSnap = await getDoc(passengerDocRef);
            
            if (passengerDocSnap.exists()) {
                // User is a verified passenger, proceed to passenger home
                console.log("Passenger document exists, proceeding to passenger home");
                router.push('../../screens/passenger/passengerHome');
            } else {
                // No passenger document found for this user
                console.log("No passenger document found for:", passengerEmail);
                setGeneralError('You do not have a passenger account. Please create an account.');
                // Optional: Sign out the user since they're not a valid passenger
                auth.signOut();
            }
        } catch (error) {
            console.error("Error during sign in process:", error.message);
            
            // Handle specific Firebase Auth errors
            switch (error.code) {
                case 'auth/invalid-email':
                    setEmailError('Invalid email address format');
                    break;
                case 'auth/user-not-found':
                    setEmailError('No account found with this email');
                    break;
                case 'auth/invalid-credential':
                    setPasswordError('Incorrect password');
                    break;
                case 'auth/too-many-requests':
                    setGeneralError('Too many failed attempts. Please try again later');
                    break;
                case 'auth/network-request-failed':
                    setGeneralError('Network error. Please check your connection');
                    break;
                default:
                    setGeneralError('Sign in failed. Please try again');
                    break;
            }
        } finally {
            // Always stop loading when done, regardless of success or failure
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#1976d2', '#64b5f6', '#bbdefb']}
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
                                <Text style={styles.logoSubText}>Passenger Portal</Text>
                            </View>

                            <View style={styles.formContainer}>
                                <Text style={styles.subHeading}>Sign In</Text>

                                {generalError ? (
                                    <View style={styles.generalErrorContainer}>
                                        <Text style={styles.generalErrorText}>{generalError}</Text>
                                    </View>
                                ) : null}

                                <TextInput
                                    style={styles.input}
                                    label="Email"
                                    value={passengerEmail}
                                    onChangeText={text => {
                                        setPassengerEmail(text);
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
                                    label="Password"
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
                                
                                <TouchableOpacity onPress={() => router.push('passenger/passengerForgotPassword')}>
                                    <Text style={styles.forgotPassword}>Forgot Password?</Text>
                                </TouchableOpacity>
                                
                                <Button 
                                    mode='contained' 
                                    style={styles.signInButton} 
                                    labelStyle={styles.buttonText}
                                    onPress={handleSignIn}
                                    buttonColor="#1976d2"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <View style={styles.loadingContainer}>
                                            <ActivityIndicator size="small" color="white" />
                                            <Text style={styles.loadingText}>Signing in...</Text>
                                        </View>
                                    ) : (
                                        'Sign In'
                                    )}
                                </Button>
                                
                                <Text style={styles.orText}>OR</Text>
                                
                                <Button 
                                    mode='outlined' 
                                    style={styles.createAccountButton} 
                                    labelStyle={styles.createAccountButtonText}
                                    onPress={() => router.push('passenger/passengerSignUp')}
                                    textColor="#1976d2"
                                    buttonColor="white"
                                >
                                    Create New Account
                                </Button>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </LinearGradient>
        </SafeAreaView>
    );
};

export default PassengerSignIn;

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
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        color: 'white',
        marginLeft: 8,
        fontWeight: 'bold',
    }
});