import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import React, { useState } from 'react';
import { TextInput, Button, Provider, Avatar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const PassengerForgotPassword = () => {
    const router = useRouter();
    const [forgotPwdEmail, setForgotPwdEmail] = useState('');
    const [forgotPwdPhoneNumber, setForgotPwdPhoneNumber] = useState('');
    const [passengerNewPassword, setPassengerNewPassword] = useState('');
    const [passengerConfirmPassword, setPassengerConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleResetPassword = () => {
        if (!forgotPwdEmail || !forgotPwdPhoneNumber || !passengerNewPassword || !passengerConfirmPassword) {
            console.error('All fields are required.');
            return;
        }
        
        if (passengerNewPassword !== passengerConfirmPassword) {
            console.error("Passwords do not match");
            return;
        }
        
        // Add Firebase password reset logic here
        console.log("Processing password reset for:", forgotPwdEmail);
        router.push('passenger/passengerSignIn');
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
                                        icon="lock-reset" 
                                        style={styles.avatar} 
                                        color="#fff" 
                                        backgroundColor="#1976d2"
                                    />
                                    <Text style={styles.mainHeading}>Bus Route Mate</Text>
                                    <Text style={styles.subHeadingText}>Reset Your Password</Text>
                                </View>

                                <View style={styles.formContainer}>
                                    <Text style={styles.formTitle}>Password Recovery</Text>

                                    <TextInput 
                                        style={styles.input}
                                        label="Email"
                                        value={forgotPwdEmail}
                                        onChangeText={text => setForgotPwdEmail(text)}
                                        mode="outlined"
                                        outlineColor="#1976d2"
                                        activeOutlineColor="#1976d2"
                                        theme={{ colors: { primary: '#1976d2' } }}
                                        left={<TextInput.Icon icon="email" color="#1976d2" />}
                                    />

                                    <TextInput 
                                        style={styles.input}
                                        label="Phone Number"
                                        value={forgotPwdPhoneNumber}
                                        onChangeText={text => setForgotPwdPhoneNumber(text)}
                                        mode="outlined"
                                        keyboardType="phone-pad"
                                        outlineColor="#1976d2"
                                        activeOutlineColor="#1976d2"
                                        theme={{ colors: { primary: '#1976d2' } }}
                                        left={<TextInput.Icon icon="phone" color="#1976d2" />}
                                    />

                                    <TextInput 
                                        style={styles.input}
                                        label="New Password"
                                        value={passengerNewPassword}
                                        onChangeText={text => setPassengerNewPassword(text)}
                                        mode="outlined"
                                        secureTextEntry={!showNewPassword}
                                        outlineColor="#1976d2"
                                        activeOutlineColor="#1976d2"
                                        theme={{ colors: { primary: '#1976d2' } }}
                                        left={<TextInput.Icon icon="lock" color="#1976d2" />}
                                        right={
                                            <TextInput.Icon 
                                                icon={showNewPassword ? 'eye-off' : 'eye'} 
                                                color="#1976d2"
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
                                        style={styles.resetButton} 
                                        labelStyle={styles.buttonText}
                                        onPress={handleResetPassword}
                                        buttonColor="#1976d2"
                                        icon="key"
                                    >
                                        Reset Password
                                    </Button>
                                    
                                    <Button 
                                        mode="text" 
                                        onPress={() => router.push('passenger/passengerSignIn')}
                                        style={styles.backButton}
                                        labelStyle={styles.backButtonText}
                                    >
                                        Back to Sign In
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

export default PassengerForgotPassword;

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
    resetButton: {
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