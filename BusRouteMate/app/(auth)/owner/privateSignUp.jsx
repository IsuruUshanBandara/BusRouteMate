import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import React, { useState } from 'react';
import { TextInput, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import {createUserWithEmailAndPassword} from 'firebase/auth';  
import {auth,db} from'../../db/firebaseConfig'; 
import { doc,setDoc } from 'firebase/firestore';

const PrivateBusSignUp = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [nationalIdentityNum, setNationalIdentityNum] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    // const auth = getAuth();

    const handleSignUp = async () => {
        if (!email || !phoneNumber || !nationalIdentityNum || !password || !confirmPassword) {
            console.error('All fields are required.');
            return;
        }
        if (password !== confirmPassword) {
            console.error("Passwords do not match");
            return;
        }
        try{
        const userCredential = await createUserWithEmailAndPassword(auth,email,password);
        const user = userCredential.user;

        await setDoc(doc(db,"ownerDetails",email),{
            email:email,
            phoneNumber:phoneNumber,
            nationalId:nationalIdentityNum,
            createdAt: new Date()
        });
        console.log("User created successfully:", user);
        router.push('owner/privateSignIn');
        }catch(error){
            console.error("Error creating user:", error.message);
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
                            <Text style={styles.subHeading}>Sign Up</Text>
                        </View>

                        <TextInput 
                            style={styles.input}
                            label="Email"
                            value={email}
                            onChangeText={text => setEmail(text)}
                            mode="outlined"
                        />

                        <TextInput 
                            style={styles.input}
                            label="Phone Number"
                            value={phoneNumber}
                            onChangeText={text => setPhoneNumber(text)}
                            mode="outlined"
                            keyboardType="phone-pad"
                        />

                        <TextInput 
                            style={styles.input}
                            label="National Identity Card Number"
                            value={nationalIdentityNum}
                            onChangeText={text => setNationalIdentityNum(text)}
                            mode="outlined"
                        />

                        <TextInput 
                            style={styles.input}
                            label="Password"
                            value={password}
                            onChangeText={text => setPassword(text)}
                            mode="outlined"
                            secureTextEntry={!showPassword}
                            right={
                                <TextInput.Icon 
                                    icon={showPassword ? 'eye-off' : 'eye'} 
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
                            right={
                                <TextInput.Icon 
                                    icon={showConfirmPassword ? 'eye-off' : 'eye'} 
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)} 
                                />
                            }
                        />

                        <Button 
                            mode="contained" 
                            style={styles.signUpButton} 
                            onPress={handleSignUp}
                        >
                            Sign Up
                        </Button>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default PrivateBusSignUp;

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
    signUpButton: {
        marginTop: 20,
        paddingVertical: 6,
        width: '100%',
        alignSelf: 'center',
    },
});
