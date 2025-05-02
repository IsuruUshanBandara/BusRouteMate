import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import React, { useState } from 'react';
import { TextInput, Button, Provider, Avatar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';  
import { auth, db } from '../../db/firebaseConfig'; 
import { doc, setDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

const PrivateBusSignUp = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [nationalIdentityNum, setNationalIdentityNum] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { t } = useTranslation();

    const handleSignUp = async () => {
        if (!email || !phoneNumber || !nationalIdentityNum || !password || !confirmPassword) {
            console.error('All fields are required.');
            return;
        }
        if (password !== confirmPassword) {
            console.error("Passwords do not match");
            return;
        }
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, "ownerDetails", email), {
                email: email,
                phoneNumber: phoneNumber,
                nationalId: nationalIdentityNum,
                role: "privateOwners",
                createdAt: new Date()
            });
            console.log("User created successfully:", user);
            router.push('owner/privateSignIn');
        } catch(error) {
            console.error("Error creating user:", error.message);
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
                                        icon="bus" 
                                        style={styles.avatar} 
                                        color="#fff" 
                                        backgroundColor="#1976d2"
                                    />
                                    <Text style={styles.mainHeading}>Bus Route Mate</Text>
                                    <Text style={styles.subHeadingText}>Bus Owner Registration</Text>
                                </View>

                                <View style={styles.formContainer}>
                                    <Text style={styles.formTitle}>Create Your Account</Text>

                                    <TextInput 
                                        style={styles.input}
                                        label={t('email')}
                                        value={email}
                                        onChangeText={text => setEmail(text)}
                                        mode="outlined"
                                        outlineColor="#1976d2"
                                        activeOutlineColor="#1976d2"
                                        theme={{ colors: { primary: '#1976d2' } }}
                                        left={<TextInput.Icon icon="email" color="#1976d2" />}
                                    />

                                    <TextInput 
                                        style={styles.input}
                                        label="Phone Number"
                                        value={phoneNumber}
                                        onChangeText={text => setPhoneNumber(text)}
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
                                        value={nationalIdentityNum}
                                        onChangeText={text => setNationalIdentityNum(text)}
                                        mode="outlined"
                                        outlineColor="#1976d2"
                                        activeOutlineColor="#1976d2"
                                        theme={{ colors: { primary: '#1976d2' } }}
                                        left={<TextInput.Icon icon="card-account-details" color="#1976d2" />}
                                    />

                                    <TextInput 
                                        style={styles.input}
                                        label={t('Password')}
                                        value={password}
                                        onChangeText={text => setPassword(text)}
                                        mode="outlined"
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

                                    <TextInput 
                                        style={styles.input}
                                        label="Confirm Password"
                                        value={confirmPassword}
                                        onChangeText={text => setConfirmPassword(text)}
                                        mode="outlined"
                                        secureTextEntry={!showConfirmPassword}
                                        outlineColor="#1976d2"
                                        activeOutlineColor="#1976d2"
                                        theme={{ colors: { primary: '#1976d2' } }}
                                        left={<TextInput.Icon icon="lock-check" color="#1976d2" />}
                                        right={
                                            <TextInput.Icon 
                                                icon={showConfirmPassword ? 'eye-off' : 'eye'} 
                                                color="#1976d2"
                                                onPress={() => setShowConfirmPassword(!showConfirmPassword)} 
                                            />
                                        }
                                    />

                                    <Button 
                                        mode="contained" 
                                        style={styles.signUpButton} 
                                        labelStyle={styles.buttonText}
                                        onPress={handleSignUp}
                                        buttonColor="#1976d2"
                                        icon="account-plus"
                                    >
                                        Register Now
                                    </Button>
                                    
                                    <Button 
                                        mode="text" 
                                        onPress={() => router.push('owner/privateSignIn')}
                                        style={styles.backButton}
                                        labelStyle={styles.backButtonText}
                                    >
                                        Already have an account? Sign In
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

export default PrivateBusSignUp;

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
    signUpButton: {
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