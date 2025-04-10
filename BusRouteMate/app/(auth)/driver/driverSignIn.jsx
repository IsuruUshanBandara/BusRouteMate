import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useRouter,useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
// import i18n from './i18n';
const DriverSignIn = () => {
    const router = useRouter();
    const { category } = useLocalSearchParams();
    const [licensePlateNumber, setLicensePlateNumber] = useState('');
    const [driverPassword, setdriverPassword] = useState('');
    const [showDriverPassword, setShowDriverPassword] = useState(false);
    const { t } = useTranslation();

    const handleSignIn = () => {
        console.log(driverPassword);
        console.log(licensePlateNumber);
        router.push('../../screens/driver/driverRideStartCancelScreen');
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
                            keyboardType='phone-pad'
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
