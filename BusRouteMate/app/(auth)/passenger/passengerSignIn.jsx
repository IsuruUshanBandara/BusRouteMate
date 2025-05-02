import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView, ImageBackground } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { auth } from '../../db/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';

const PassengerSignIn = () => {
    const router = useRouter();
    const [passengerEmail, setPassengerEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSignIn = () => {
        if (!passengerEmail || !password) {
            console.error('All fields are required.');
            return;
        }
    
        signInWithEmailAndPassword(auth, passengerEmail, password)
            .then((userCredential) => {
                const user = userCredential.user;
                console.log("Passenger signed in successfully:", user);
                router.push('../../screens/passenger/passengerHome');
            })
            .catch((error) => {
                console.error("Error signing in passenger:", error.message);
            });
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

                                <TextInput
                                    style={styles.input}
                                    label="Email"
                                    value={passengerEmail}
                                    onChangeText={text => setPassengerEmail(text)}
                                    mode='outlined'
                                    outlineColor="#1976d2"
                                    activeOutlineColor="#1976d2"
                                    theme={{ colors: { primary: '#1976d2' } }}
                                    left={<TextInput.Icon icon="email" color="#1976d2" />}
                                />

                                <TextInput
                                    style={styles.input}
                                    label="Password"
                                    value={password}
                                    onChangeText={text => setPassword(text)}
                                    mode='outlined'
                                    secureTextEntry={!showPassword}
                                    outlineColor="#1976d2"
                                    activeOutlineColor="#1976d2"
                                    theme={{ colors: { primary: '#1976d2' } }}
                                    left={<TextInput.Icon icon="lock" color="#1976d2" />}
                                    right={
                                        <TextInput.Icon
                                            icon={showPassword ? 'eye-off' : 'eye'}
                                            color="#1976d2"
                                            onPress={() => setShowPassword(!showPassword)}
                                        />
                                    }
                                />
                                
                                <TouchableOpacity onPress={() => router.push('passenger/passengerForgotPassword')}>
                                    <Text style={styles.forgotPassword}>Forgot Password?</Text>
                                </TouchableOpacity>
                                
                                <Button 
                                    mode='contained' 
                                    style={styles.signInButton} 
                                    labelStyle={styles.buttonText}
                                    onPress={handleSignIn}
                                    buttonColor="#1976d2"
                                >
                                    Sign In
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
        marginVertical: 10,
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
});