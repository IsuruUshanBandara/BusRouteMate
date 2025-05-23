import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import React, { useState } from 'react';
import { TextInput, Button, Provider, Avatar, Menu, HelperText } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db } from '../../db/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';

const PassengerForgotPassword = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [securityQuestion, setSecurityQuestion] = useState('');
    const [securityQuestionAns, setSecurityQuestionAns] = useState('');
    const [menuVisible, setMenuVisible] = useState(false);
    
    // Error states
    const [errors, setErrors] = useState({
        email: '',
        phoneNumber: '',
        securityQuestion: '',
        securityQuestionAns: '',
        form: ''
    });

    // Security questions list
    const securityQuestions = [
        "Name of your first pet?",
        "Name of your hometown?",
        "First car model?",
        "Favorite book?",
        "Favorite color?",
    ];

    // Validation functions
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) return 'Email is required';
        if (!emailRegex.test(email)) return 'Please enter a valid email address';
        return '';
    };

    const validatePhoneNumber = (phone) => {
        if (!phone) return 'Phone number is required';
        
        // Check if phone starts with 0 or +
        if (!(phone.startsWith('0') || phone.startsWith('+'))) {
            return 'Phone number must start with 0 or +';
        }
        
        // Remove non-digit characters except for + at the beginning
        const digitsOnly = phone.replace(/^\+|\D/g, '$&').replace(/[^\d+]/g, '');
        
        // Check length (should be 10 digits excluding the + if present)
        const digitCount = digitsOnly.startsWith('+') ? digitsOnly.length - 1 : digitsOnly.length;
        if (digitCount !== 10) {
            return 'Phone number must be 10 digits long';
        }
        
        return '';
    };

    const validateSecurityQuestion = (question) => {
        if (!question) return 'Security question is required';
        return '';
    };

    const validateSecurityAnswer = (answer) => {
        if (!answer) return 'Security answer is required';
        return '';
    };

    // Form validation
    const validateForm = () => {
        const newErrors = {
            email: validateEmail(email),
            phoneNumber: validatePhoneNumber(phoneNumber),
            securityQuestion: validateSecurityQuestion(securityQuestion),
            securityQuestionAns: validateSecurityAnswer(securityQuestionAns),
            form: ''
        };

        setErrors(newErrors);

        // Check if there are any validation errors
        return !Object.values(newErrors).some(error => error !== '');
    };

    const handleForgotPassword = async () => {
        // Validate fields before submitting
        if (!validateForm()) {
            return;
        }

        try {
            // Reference to Firestore document using email
            const userDocRef = doc(db, "passengerDetails", email);
            
            // Get the document
            const userDocSnap = await getDoc(userDocRef);
            
            if (!userDocSnap.exists()) {
                setErrors(prev => ({...prev, form: 'No account exists with this email'}));
                return;
            }
            
            const userData = userDocSnap.data();
            
            // Verify phone number, security question and answer match with records
            if (userData.phoneNumber !== phoneNumber) {
                setErrors(prev => ({...prev, form: 'Phone number does not match our records'}));
                return;
            }
            
            if (userData.securityQuestion !== securityQuestion) {
                setErrors(prev => ({...prev, form: 'Security question does not match our records'}));
                return;
            }
            
            if (userData.securityQuestionAns !== securityQuestionAns) {
                setErrors(prev => ({...prev, form: 'Security answer is incorrect'}));
                return;
            }
            
            // All verification passed - send password reset email
            await sendPasswordResetEmail(auth, email);
            
            // Show success message and redirect
            alert('Password reset email has been sent to your email address. Please check your inbox.');
            router.push('passenger/passengerSignIn');
            
        } catch (error) {
            console.error("Password reset error:", error);
            setErrors(prev => ({...prev, form: error.message || 'Failed to send password reset email'}));
        }
    };

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
                                        label="Email *"
                                        value={email}
                                        onChangeText={text => {
                                            setEmail(text);
                                            setErrors(prev => ({...prev, email: validateEmail(text)}));
                                        }}
                                        mode="outlined"
                                        outlineColor={errors.email ? '#ff5252' : '#1976d2'}
                                        activeOutlineColor={errors.email ? '#ff5252' : '#1976d2'}
                                        theme={{ colors: { primary: '#1976d2' } }}
                                        left={<TextInput.Icon icon="email" color="#1976d2" />}
                                        error={!!errors.email}
                                    />
                                    {errors.email ? <HelperText type="error" visible={!!errors.email}>{errors.email}</HelperText> : null}

                                    <TextInput 
                                        style={styles.input}
                                        label="Phone Number *"
                                        value={phoneNumber}
                                        onChangeText={text => {
                                            setPhoneNumber(text);
                                            setErrors(prev => ({...prev, phoneNumber: validatePhoneNumber(text)}));
                                        }}
                                        mode="outlined"
                                        keyboardType="phone-pad"
                                        outlineColor={errors.phoneNumber ? '#ff5252' : '#1976d2'}
                                        activeOutlineColor={errors.phoneNumber ? '#ff5252' : '#1976d2'}
                                        theme={{ colors: { primary: '#1976d2' } }}
                                        left={<TextInput.Icon icon="phone" color="#1976d2" />}
                                        error={!!errors.phoneNumber}
                                    />
                                    {errors.phoneNumber ? <HelperText type="error" visible={!!errors.phoneNumber}>{errors.phoneNumber}</HelperText> : null}

                                    
                                    <View style={styles.securityQuestionContainer}>
                                        <Menu
                                            visible={menuVisible}
                                            onDismiss={() => setMenuVisible(false)}
                                            anchor={
                                                <TextInput
                                                    style={styles.input}
                                                    label="Security Question *"
                                                    value={securityQuestion}
                                                    placeholder="Select a security question"
                                                    mode="outlined"
                                                    editable={false}
                                                    onPress={toggleMenuVisibility}
                                                    outlineColor={errors.securityQuestion ? '#ff5252' : '#1976d2'}
                                                    activeOutlineColor={errors.securityQuestion ? '#ff5252' : '#1976d2'}
                                                    theme={{ colors: { primary: '#1976d2' } }}
                                                    left={<TextInput.Icon icon="shield-account" color="#1976d2" />}
                                                    right={
                                                        <TextInput.Icon 
                                                            icon={menuVisible ? 'chevron-up' : 'chevron-down'} 
                                                            color="#1976d2"
                                                            onPress={toggleMenuVisibility} 
                                                        />
                                                    }
                                                    error={!!errors.securityQuestion}
                                                />
                                            }
                                            contentStyle={styles.menuContent}
                                        >
                                            <ScrollView 
                                                style={styles.menuScrollView}
                                                showsVerticalScrollIndicator={true}
                                                persistentScrollbar={true}
                                                nestedScrollEnabled={true}
                                            >
                                                {securityQuestions.map((question, index) => (
                                                    <Menu.Item
                                                        key={index}
                                                        onPress={() => {
                                                            setSecurityQuestion(question);
                                                            setErrors(prev => ({...prev, securityQuestion: ''}));
                                                            setMenuVisible(false);
                                                        }}
                                                        title={question}
                                                        style={styles.menuItem}
                                                        titleStyle={styles.menuItemText}
                                                    />
                                                ))}
                                            </ScrollView>
                                        </Menu>
                                        {errors.securityQuestion ? <HelperText type="error" visible={!!errors.securityQuestion}>{errors.securityQuestion}</HelperText> : null}
                                    </View>

                                    <TextInput 
                                        style={styles.input}
                                        label="Answer to the Selected Security Question *"
                                        value={securityQuestionAns}
                                        onChangeText={text => {
                                            setSecurityQuestionAns(text);
                                            setErrors(prev => ({...prev, securityQuestionAns: validateSecurityAnswer(text)}));
                                        }}
                                        mode="outlined"
                                        outlineColor={errors.securityQuestionAns ? '#ff5252' : '#1976d2'}
                                        activeOutlineColor={errors.securityQuestionAns ? '#ff5252' : '#1976d2'}
                                        theme={{ colors: { primary: '#1976d2' } }}
                                        left={<TextInput.Icon icon="key" color="#1976d2" />}
                                        error={!!errors.securityQuestionAns}
                                    />
                                    {errors.securityQuestionAns ? <HelperText type="error" visible={!!errors.securityQuestionAns}>{errors.securityQuestionAns}</HelperText> : null}
                                    
                                    {errors.form ? <HelperText type="error" visible={!!errors.form} style={styles.formError}>{errors.form}</HelperText> : null}

                                    <Button 
                                        mode="contained" 
                                        style={styles.resetButton} 
                                        labelStyle={styles.buttonText}
                                        onPress={handleForgotPassword}
                                        buttonColor="#1976d2"
                                        icon="email-send"
                                    >
                                        Send Reset Email
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
    securityQuestionContainer: {
        width: '100%',
        position: 'relative',
        zIndex: 100, 
        marginBottom: 6,
    },
    menuContent: {
        backgroundColor: 'white',
        maxHeight: 200, 
        paddingVertical: 0, 
    },
    menuScrollView: {
        maxHeight: 200, 
        flexGrow: 0, 
    },
    menuItem: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    menuItemText: {
        fontSize: 14,
        color: '#333',
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
    errorText: {
        color: '#ff5252',
        textAlign: 'center',
        marginBottom: 10,
        fontWeight: '500',
    },
    formError: {
        color: '#ff5252',
        textAlign: 'center',
        marginTop: 5,
        marginBottom: 10,
        fontWeight: '500',
    },
});