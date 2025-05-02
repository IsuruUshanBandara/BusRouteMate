import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, ScrollView, Platform, Pressable } from 'react-native';
import React, { useState } from 'react';
import { TextInput, Button, Menu, Provider, Avatar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import {createUserWithEmailAndPassword} from 'firebase/auth';  
import {auth,db} from'../../db/firebaseConfig'; 
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';

const PassengerSignUp = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [securityQuestionAns, setSecurityQuestionAns] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [securityQuestion, setSecurityQuestion] = useState('');
    const [menuVisible, setMenuVisible] = useState(false);

    const handleSignUp = async () => {
        if (!email || !password || !confirmPassword || !phoneNumber || !securityQuestion || !securityQuestionAns) {
            return;
        }

        if (password !== confirmPassword) {
            return;
        }

        try {
            // Create user in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Reference to Firestore document
            const userDocRef = doc(db, "passengerDetails", email);

            // Check if the document already exists
            const docSnapshot = await getDoc(userDocRef);
            if (!docSnapshot.exists()) {
                // Store user details in Firestore with email as document ID
                await setDoc(userDocRef, {
                    email,
                    phoneNumber,
                    securityQuestion,
                    securityQuestionAns,
                    createdAt: new Date(),
                });

                console.error("sucessfully created passenger account");
                router.push('passenger/passengerSignIn');
            }
        } catch (error) {
            console.error("Sign-up error:", error);
        }
    };

    const securityQuestions = [
        "What is your mother's maiden name?",
        "What was the name of your first pet?",
        "What is the name of your hometown?",
        "What was your first car model?",
        "What is your favorite book?",
        "What is your favorite color?"
    ];

    const toggleMenuVisibility = () => {
        setMenuVisible(!menuVisible);
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
                                        icon="account-plus" 
                                        style={styles.avatar} 
                                        color="#fff" 
                                        backgroundColor="#1976d2"
                                    />
                                    <Text style={styles.mainHeading}>Bus Route Mate</Text>
                                    <Text style={styles.subHeadingText}>Passenger Registration</Text>
                                </View>

                                <View style={styles.formContainer}>
                                    <Text style={styles.formTitle}>Create Your Account</Text>

                                    <TextInput 
                                        style={styles.input}
                                        label="Email"
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
                                        label="Password"
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

                                    {/* Security Question Selection */}
                                    <Menu
                                        visible={menuVisible}
                                        onDismiss={() => setMenuVisible(false)}
                                        anchor={
                                            <Pressable onPress={toggleMenuVisibility} style={styles.input}>
                                                <TextInput
                                                    label="Security Question"
                                                    value={securityQuestion || ""}
                                                    placeholder={!securityQuestion ? "Select a security question" : ""}
                                                    mode="outlined"
                                                    editable={false}
                                                    outlineColor="#1976d2"
                                                    activeOutlineColor="#1976d2"
                                                    theme={{ colors: { primary: '#1976d2' } }}
                                                    left={<TextInput.Icon icon="shield-account" color="#1976d2" />}
                                                    right={
                                                        <TextInput.Icon 
                                                            icon={menuVisible ? 'chevron-up' : 'chevron-down'} 
                                                            color="#1976d2"
                                                            onPress={toggleMenuVisibility} 
                                                        />
                                                    }
                                                />
                                            </Pressable>
                                        }
                                        contentStyle={[styles.menuContent, { width: '100%' }]}
                                    >
                                        <ScrollView style={{ maxHeight: 150 }}>
                                            {securityQuestions.map((question, index) => (
                                                <Menu.Item
                                                    key={index}
                                                    onPress={() => {
                                                        setSecurityQuestion(question);
                                                        setMenuVisible(false);
                                                    }}
                                                    title={question}
                                                    style={styles.menuItem}
                                                />
                                            ))}
                                        </ScrollView>
                                    </Menu>

                                    <TextInput 
                                        style={styles.input}
                                        label="Answer to the Selected Security Question"
                                        value={securityQuestionAns}
                                        onChangeText={text => setSecurityQuestionAns(text)}
                                        mode="outlined"
                                        outlineColor="#1976d2"
                                        activeOutlineColor="#1976d2"
                                        theme={{ colors: { primary: '#1976d2' } }}
                                        left={<TextInput.Icon icon="key" color="#1976d2" />}
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
                                        onPress={() => router.push('passenger/passengerSignIn')}
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

export default PassengerSignUp;

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
    menuContent: {
        maxWidth: '100%',
        paddingHorizontal: 10,
        backgroundColor: 'white',
    },
    menuItem: {
        paddingHorizontal: 10,
        justifyContent: 'center',
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