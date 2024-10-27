import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import React, { useState } from 'react';
import { TextInput, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';

const PrivateBusForgotPassword = () => {
    const router = useRouter();
    const [forgotPwdphoneNumber, setForgotPwdPhoneNumber] = useState('');
    const [forgotPwdNationalIdentityNum, setForgotPwdNationalIdentityNum] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newConfirmPassword, setNewConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const handleSignIn = () => {
        console.log(newPassword);
        console.log(forgotPwdphoneNumber);
        console.log(forgotPwdNationalIdentityNum);
        console.log(newConfirmPassword);
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

                        <TextInput 
                            style={styles.input}
                            label="NewPassword"
                            value={newPassword}
                            onChangeText={text => setNewPassword(text)}
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
                            label="Confirm New Password"
                            value={newConfirmPassword}
                            onChangeText={text => setNewConfirmPassword(text)}
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
                            style={styles.signInButton} 
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
