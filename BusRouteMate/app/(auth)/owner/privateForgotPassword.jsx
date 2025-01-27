import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import React, { useState } from 'react';
import { TextInput, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import {auth,db} from '../../db/firebaseConfig';
import {doc,getDoc,updateDoc} from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';

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
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView 
                style={styles.container} 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <View style={styles.centeredContent}>
                        <View style={styles.subHeadingContainer}>
                            <Text style={styles.subHeading}>Forgot Password</Text>
                        </View>

                       <TextInput 
                            style={styles.input}
                            label="Email"
                            value={forgotEmail}
                            onChangeText={text => setForgotEmail(text)}
                            mode="outlined"
                        />

                        <TextInput 
                            style={styles.input}
                            label="Phone Number"
                            value={forgotPwdphoneNumber}
                            onChangeText={text => setForgotPwdPhoneNumber(text)}
                            mode="outlined"
                            keyboardType="phone-pad"
                        />

                        <TextInput 
                            style={styles.input}
                            label="National Identity Card Number"
                            value={forgotPwdNationalIdentityNum}
                            onChangeText={text => setForgotPwdNationalIdentityNum(text)}
                            mode="outlined"
                        />


                        <Button 
                            mode="contained" 
                            style={styles.signInButton} 
                            onPress={handleForgotPassword}
                        >
                            Reset Password
                        </Button>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default PrivateBusForgotPassword;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        paddingHorizontal: '5%',
        paddingBottom: '5%', // Extra padding to accommodate keyboard on smaller screens
    },
    centeredContent: {
        flex: 1,
        justifyContent: 'center', // Center the input fields vertically on the screen
    },
    subHeadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 20,
    },
    subHeading: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    input: {
        marginVertical: 10,
    },
    signInButton: {
        marginTop: 20,
        paddingVertical: 6,
        width: '100%',
        alignSelf: 'center',
    },
});
