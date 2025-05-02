import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { auth } from '../../db/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';

const DriverSignIn = () => {
    const router = useRouter();
    const { category } = useLocalSearchParams();
    const [licensePlateNumber, setLicensePlateNumber] = useState('');
    const [email, setEmail] = useState('');
    const [driverPassword, setDriverPassword] = useState('');
    const [showDriverPassword, setShowDriverPassword] = useState(false);
    const { t } = useTranslation();

    const handleSignIn = () => {
        if (!email || !licensePlateNumber || !driverPassword) {
            console.error('All fields are required.');
            return;
        }

        signInWithEmailAndPassword(auth, email, driverPassword)
            .then((userCredential) => { 
                const user = userCredential.user;
                console.log("Driver signed in successfully:", user);
                router.push({ 
                    pathname: '../../screens/driver/driverRideStartCancelScreen',
                    params: { licensePlateNumber: licensePlateNumber }
                });
                
            }).catch((error) => {
                console.error("Error signing in driver:", error.message);
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
                                <Text style={styles.logoSubText}>Driver Portal</Text>
                            </View>

                            <View style={styles.formContainer}>
                                <Text style={styles.subHeading}>{t('signIn')}</Text>

                                <TextInput
                                    style={styles.input}
                                    label={t('plate num')}
                                    value={licensePlateNumber}
                                    onChangeText={text => setLicensePlateNumber(text)}
                                    mode='outlined'
                                    outlineColor="#1976d2"
                                    activeOutlineColor="#1976d2"
                                    theme={{ colors: { primary: '#1976d2' } }}
                                    left={<TextInput.Icon icon="card-text" color="#1976d2" />}
                                />

                                <TextInput
                                    style={styles.input}
                                    label={t('email')}
                                    value={email}
                                    onChangeText={text => setEmail(text)}
                                    mode='outlined'
                                    keyboardType='email-address'
                                    autoCapitalize='none'
                                    outlineColor="#1976d2"
                                    activeOutlineColor="#1976d2"
                                    theme={{ colors: { primary: '#1976d2' } }}
                                    left={<TextInput.Icon icon="email" color="#1976d2" />}
                                />

                                <TextInput
                                    style={styles.input}
                                    label={t('Password')}
                                    value={driverPassword}
                                    onChangeText={text => setDriverPassword(text)}
                                    mode='outlined'
                                    secureTextEntry={!showDriverPassword}
                                    outlineColor="#1976d2"
                                    activeOutlineColor="#1976d2"
                                    theme={{ colors: { primary: '#1976d2' } }}
                                    left={<TextInput.Icon icon="lock" color="#1976d2" />}
                                    right={
                                        <TextInput.Icon
                                            icon={showDriverPassword ? 'eye-off' : 'eye'}
                                            color="#1976d2"
                                            onPress={() => setShowDriverPassword(!showDriverPassword)}
                                        />
                                    }
                                />
                                
                                <Button 
                                    mode='contained' 
                                    style={styles.signInButton} 
                                    labelStyle={styles.buttonText}
                                    onPress={handleSignIn}
                                    buttonColor="#1976d2"
                                >
                                    {t('signIn')}
                                </Button>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </LinearGradient>
        </SafeAreaView>
    );
};

export default DriverSignIn;

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
    signInButton: {
        padding: 5,
        borderRadius: 10,
        elevation: 2,
        marginTop: 20,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});