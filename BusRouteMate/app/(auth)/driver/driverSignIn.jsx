import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useRouter,useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { auth } from '../../db/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
// import i18n from './i18n';
const DriverSignIn = () => {
    const router = useRouter();
    const { category } = useLocalSearchParams();
    const [licensePlateNumber, setLicensePlateNumber] = useState('');
    const [email, setEmail] = useState('');
    const [driverPassword, setdriverPassword] = useState('');
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
                router.push({ pathname:'../../screens/driver/driverRideStartCancelScreen',params: { licensePlateNumber: licensePlateNumber }});
                
            }).catch((error) => {
                console.error("Error signing in driver:", error.message);
            });
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
                            label={t('plate num')}
                            value={licensePlateNumber}
                            onChangeText={text => setLicensePlateNumber(text)}
                            mode='outlined'
                            keyboardType='default'
                        />

                          <TextInput
                            style={styles.input}
                            label={t('email')}
                            value={email}
                            onChangeText={text => setEmail(text)}
                            mode='outlined'
                            keyboardType='email-address'
                            autoCapitalize='none'
                        />

                        <TextInput
                            style={styles.input}
                            label={t('Password')}
                            value={driverPassword}
                            onChangeText={text => setdriverPassword(text)}
                            mode='outlined'
                            secureTextEntry={!showDriverPassword}
                            right={
                                <TextInput.Icon
                                    icon={showDriverPassword ? 'eye-off' : 'eye'}
                                    onPress={() => setShowDriverPassword(!showDriverPassword)}
                                />
                            }
                        />
                        <Button mode='contained' style={styles.signInButton} onPress={handleSignIn}>{t('signIn')}</Button>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default DriverSignIn;

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
