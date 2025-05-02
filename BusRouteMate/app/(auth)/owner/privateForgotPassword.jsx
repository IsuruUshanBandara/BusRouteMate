import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import React, { useState } from 'react';
import { TextInput, Button, Provider, Avatar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { auth, db } from '../../db/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';

const PrivateBusForgotPassword = () => {
    const router = useRouter();
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotPwdphoneNumber, setForgotPwdPhoneNumber] = useState('');
    const [forgotPwdNationalIdentityNum, setForgotPwdNationalIdentityNum] = useState('');

    const handleForgotPassword = async() => {
        if (!forgotEmail || !forgotPwdphoneNumber || !forgotPwdNationalIdentityNum ) {
            console.error('All fields are required.');
            return;
        }
        try {
            // Get user details from Firestore
            const userDocRef = doc(db, "ownerDetails", forgotEmail);
            const userDocSnap = await getDoc(userDocRef);
    
            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
    
                // Validate entered phone number and national ID
                if (userData.phoneNumber === forgotPwdphoneNumber && userData.nationalId === forgotPwdNationalIdentityNum) {
                    // Send password reset email via Firebase
                    await sendPasswordResetEmail(auth, forgotEmail);
                    console.error('Password reset email sent successfully');
                    router.push('owner/privateSignIn');
                } else {
                    console.error('Invalid phone number or national ID');
                }
            } else {
                console.error('User not found with this email');
            }
        } catch (error) {
            console.error('Error in forgot password process:', error.message);
        }
    };

    return (
        <Provider>
            <SafeAreaView style={styles.container}>
                <LinearGradient
                    colors={['#1976d2', '#64b5f6', '#bbdefb']}
                    style={styles.gradient}
                >
                    <KeyboardAvoidingView 
                        style={styles.keyboardView} 
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    >
                        <ScrollView contentContainerStyle={styles.scrollContainer}>
                            <View style={styles.centeredContent}>
                                <View style={styles.headerContainer}>
                                    <Avatar.Icon 
                                        size={80} 
                                        icon="lock-reset" 
                                        style={styles.avatar} 
                                        color="#fff" 
                                        backgroundColor="#1976d2"
                                    />
                                    <Text style={styles.mainHeading}>Bus Route Mate</Text>
                                    <Text style={styles.subHeadingText}>Reset Your Password</Text>
                                </View>

                                <View style={styles.formContainer}>
                                    <Text style={styles.formTitle}>Password Recovery</Text>

                                    <TextInput 
                                        style={styles.input}
                                        label="Email"
                                        value={forgotEmail}
                                        onChangeText={text => setForgotEmail(text)}
                                        mode="outlined"
                                        outlineColor="#1976d2"
                                        activeOutlineColor="#1976d2"
                                        theme={{ colors: { primary: '#1976d2' } }}
                                        left={<TextInput.Icon icon="email" color="#1976d2" />}
                                    />

                                    <TextInput 
                                        style={styles.input}
                                        label="Phone Number"
                                        value={forgotPwdphoneNumber}
                                        onChangeText={text => setForgotPwdPhoneNumber(text)}
                                        mode="outlined"
                                        keyboardType="phone-pad"
                                        outlineColor="#1976d2"
                                        activeOutlineColor="#1976d2"
                                        theme={{ colors: { primary: '#1976d2' } }}
                                        left={<TextInput.Icon icon="phone" color="#1976d2" />}
                                    />

                                    <TextInput 
                                        style={styles.input}
                                        label="National Identity Card Number"
                                        value={forgotPwdNationalIdentityNum}
                                        onChangeText={text => setForgotPwdNationalIdentityNum(text)}
                                        mode="outlined"
                                        outlineColor="#1976d2"
                                        activeOutlineColor="#1976d2"
                                        theme={{ colors: { primary: '#1976d2' } }}
                                        left={<TextInput.Icon icon="card-account-details" color="#1976d2" />}
                                    />

                                    <Button 
                                        mode="contained" 
                                        style={styles.resetButton} 
                                        labelStyle={styles.buttonText}
                                        onPress={handleForgotPassword}
                                        buttonColor="#1976d2"
                                        icon="email-send"
                                    >
                                        Send Reset Email
                                    </Button>
                                    
                                    <Button 
                                        mode="text" 
                                        onPress={() => router.push('owner/privateSignIn')}
                                        style={styles.backButton}
                                        labelStyle={styles.backButtonText}
                                    >
                                        Back to Sign In
                                    </Button>
                                </View>
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </LinearGradient>
            </SafeAreaView>
        </Provider>
    );
};

export default PrivateBusForgotPassword;

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
        paddingVertical: 20,
    },
    centeredContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    avatar: {
        marginBottom: 10,
    },
    mainHeading: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 3,
    },
    subHeadingText: {
        fontSize: 18,
        color: 'white',
        marginTop: 5,
    },
    formContainer: {
        backgroundColor: 'white',
        width: '100%',
        borderRadius: 15,
        paddingHorizontal: 20,
        paddingVertical: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    formTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#1976d2',
    },
    input: {
        marginVertical: 8,
        width: '100%',
        backgroundColor: 'white',
    },
    resetButton: {
        marginTop: 20,
        paddingVertical: 8,
        width: '100%',
        alignSelf: 'center',
        borderRadius: 10,
        elevation: 2,
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
    },
});