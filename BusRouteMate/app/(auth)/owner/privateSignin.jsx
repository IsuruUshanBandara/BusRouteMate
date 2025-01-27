import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { auth } from '../../db/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
const PrivateBusSignIn = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { t } = useTranslation();

    const handleSignIn = () => {
        if (!email ||!password) {
            console.error('All fields are required.');
            return;
        }
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => { 
                const user = userCredential.user;
                console.log("User signed in successfully:", user);
                router.push('../../screens/owner/ownerHome');
            }).catch((error) => {
                console.error("Error signing user:", error.message);
            });
        // router.push('../../screens/owner/ownerHome');
        // console.log(password);
        // console.log(email);
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                    <View style={styles.centeredContent}>
                        <Text style={styles.subHeading}>{t('signIn')}</Text>

                        <TextInput
                            style={styles.input}
                            label="Email"
                            value={email}
                            onChangeText={text => setEmail(text)}
                            mode='outlined'
                        />

                        <TextInput
                            style={styles.input}
                            label="Password"
                            value={password}
                            onChangeText={text => setPassword(text)}
                            mode='outlined'
                            secureTextEntry={!showPassword}
                            right={
                                <TextInput.Icon
                                    icon={showPassword ? 'eye-off' : 'eye'}
                                    onPress={() => setShowPassword(!showPassword)}
                                />
                            }
                        />
                        <TouchableOpacity onPress={() => router.push('owner/privateForgotPassword')}>
                            <Text style={styles.forgotPassword}>Forgot Password?</Text>
                        </TouchableOpacity>
                        <Button mode='contained' style={styles.signInButton} onPress={handleSignIn}>Sign In</Button>
                        <Button mode='contained' style={styles.createAccountButton} onPress={() => router.push('owner/privateSignUp')}>Create Account</Button>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default PrivateBusSignIn;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
    },
    centeredContent: {
        flex: 1,
        justifyContent: 'center', // Centers the content vertically
        paddingHorizontal: '5%',
    },
    subHeading: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    input: {
        marginVertical: '2%',
    },
    forgotPassword: {
        textAlign: 'right',
        marginTop: 4,
        marginBottom: 20,
        color: '#007AFF',
    },
    signInButton: {
        marginTop: '10%',
        width: '50%',
        alignSelf: 'center',
    },
    createAccountButton: {
        width: '50%',
        alignSelf: 'center',
        marginTop: '5%',
    },
});
