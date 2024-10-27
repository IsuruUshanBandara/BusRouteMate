import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, ScrollView, Platform} from 'react-native';
import React, { useState } from 'react';
import { TextInput, Button} from 'react-native-paper';
import { useRouter } from 'expo-router';

const PassengerForgotPassword = () => {
    const router = useRouter();
    const [forgotPwdEmail, setorgotPwdEmail] = useState('');
    const [forgotPwdPhoneNumber, setForgotPwdPhoneNumber] = useState('');
    const [passengerNewPassword, setPassengerNewPassword] = useState('');
    const [passengerConfirmPassword, setPassengerConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSignIn = () => {
        console.log(passengerNewPassword);
        console.log(forgotPwdPhoneNumber);
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
                                value={forgotPwdEmail}
                                onChangeText={text => setorgotPwdEmail(text)}
                                mode="outlined"
                            />

                            <TextInput 
                                style={styles.input}
                                label="Phone Number"
                                value={forgotPwdPhoneNumber}
                                onChangeText={text => setForgotPwdPhoneNumber(text)}
                                mode="outlined"
                                keyboardType="phone-pad"
                            />

                            <TextInput 
                                style={styles.input}
                                label="New Password"
                                value={passengerNewPassword}
                                onChangeText={text => setPassengerNewPassword(text)}
                                mode="outlined"
                                secureTextEntry={!showNewPassword}
                                right={
                                    <TextInput.Icon 
                                        icon={showNewPassword ? 'eye-off' : 'eye'} 
                                        onPress={() => setShowNewPassword(!showNewPassword)} 
                                    />
                                }
                            />

                            <TextInput 
                                style={styles.input}
                                label="Confirm Password"
                                value={passengerConfirmPassword}
                                onChangeText={text => setPassengerConfirmPassword(text)}
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
                                onPress={handleSignIn}
                            >
                                Sign In
                            </Button>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
    );
};

export default PassengerForgotPassword;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        paddingHorizontal: '5%',
        paddingBottom: '5%',
    },
    centeredContent: {
        flex: 1,
        justifyContent: 'center',
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
        width: '100%',
    },
    menuContent: {
        maxwidth: '100%',
        paddingHorizontal: 10,
    },
    menuItem: {
        paddingHorizontal: 10,
        justifyContent: 'center',
    },
    signUpButton: {
        marginTop: 20,
        paddingVertical: 6,
        width: '100%',
        alignSelf: 'center',
    },
});
