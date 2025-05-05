import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, ScrollView, Platform, Dimensions } from 'react-native';
import React, { useState, useEffect } from 'react';
import { TextInput, Button, Provider, Avatar, Menu, HelperText } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db } from '../../db/firebaseConfig';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { 
    EmailAuthProvider, 
    reauthenticateWithCredential, 
    updatePassword, 
    signInWithEmailAndPassword,
    fetchSignInMethodsForEmail
} from 'firebase/auth';

const PassengerForgotPassword = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [securityQuestion, setSecurityQuestion] = useState('');
    const [securityQuestionAns, setSecurityQuestionAns] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);
    const [formContainerWidth, setFormContainerWidth] = useState(Dimensions.get('window').width - 40);
    const [userVerified, setUserVerified] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [showOldPassword, setShowOldPassword] = useState(false);
    
    // Error states
    const [errors, setErrors] = useState({
        email: '',
        phoneNumber: '',
        securityQuestion: '',
        securityQuestionAns: '',
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
        form: ''
    });

    // Update width on orientation change
    useEffect(() => {
        const updateWidth = () => {
            setFormContainerWidth(Dimensions.get('window').width - 40);
        };
        
        const dimensionsListener = Dimensions.addEventListener('change', updateWidth);
        
        return () => {
            dimensionsListener.remove();
        };
    }, []);

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

    const validatePassword = (password) => {
        if (!password) return 'Password is required';
        if (password.length < 6) return 'Password must be at least 6 characters';
        return '';
    };

    const validateConfirmPassword = (password, confirmPassword) => {
        if (!confirmPassword) return 'Confirm password is required';
        if (password !== confirmPassword) return 'Passwords do not match';
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

    // Form validation for verification step
    const validateVerificationForm = () => {
        const newErrors = {
            email: validateEmail(email),
            phoneNumber: validatePhoneNumber(phoneNumber),
            securityQuestion: validateSecurityQuestion(securityQuestion),
            securityQuestionAns: validateSecurityAnswer(securityQuestionAns),
            form: ''
        };

        setErrors(newErrors);

        // Check if there are any validation errors in verification fields
        return !Object.values(newErrors).some(error => error !== '' && 
            ['email', 'phoneNumber', 'securityQuestion', 'securityQuestionAns'].includes(Object.keys(newErrors).find(key => newErrors[key] === error)));
    };

    // Form validation for password reset step
    const validatePasswordForm = () => {
        const newErrors = {
            ...errors,
            oldPassword: validatePassword(oldPassword),
            newPassword: validatePassword(newPassword),
            confirmPassword: validateConfirmPassword(newPassword, confirmPassword),
            form: ''
        };

        setErrors(newErrors);

        // Check if there are any validation errors in password fields
        return !['oldPassword', 'newPassword', 'confirmPassword'].some(field => newErrors[field] !== '');
    };

    const handleVerifyUser = async () => {
        // Validate verification fields before submitting
        if (!validateVerificationForm()) {
            setErrors(prev => ({...prev, form: 'Please fix the errors before proceeding'}));
            return;
        }

        try {
            // First check if the email exists in Firebase Auth
            const methods = await fetchSignInMethodsForEmail(auth, email);
            if (methods.length === 0) {
                setErrors(prev => ({...prev, form: 'No account exists with this email'}));
                return;
            }
            
            // Reference to Firestore document using email
            const userDocRef = doc(db, "passengerDetails", email);
            
            // Get the document
            const docSnapshot = await getDoc(userDocRef);
            
            if (!docSnapshot.exists()) {
                setErrors(prev => ({...prev, form: 'Account not found'}));
                return;
            }
            
            const userData = docSnapshot.data();
            
            // Verify phone number, security question and answer
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
            
            // All verification passed
            setUserVerified(true);
            setErrors(prev => ({...prev, form: ''}));
        } catch (error) {
            console.error("Verification error:", error);
            setErrors(prev => ({...prev, form: error.message || 'Failed to verify account'}));
        }
    };

    const handleResetPassword = async () => {
        // Validate password fields before submitting
        if (!validatePasswordForm()) {
            setErrors(prev => ({...prev, form: 'Please fix the errors before submitting'}));
            return;
        }

        try {
            // Try to sign in with email and old password
            const userCredential = await signInWithEmailAndPassword(auth, email, oldPassword);
            const user = userCredential.user;
            
            // Update the password in Firebase Auth
            await updatePassword(user, newPassword);
            
            console.log("Password reset successful");
            alert('Password has been reset successfully!');
            router.push('passenger/passengerSignIn');
        } catch (error) {
            console.error("Password reset error:", error);
            
            if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                setErrors(prev => ({...prev, oldPassword: 'Current password is incorrect', form: 'Current password is incorrect'}));
            } else {
                setErrors(prev => ({...prev, form: error.message || 'Failed to reset password'}));
            }
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

                                <View style={styles.formContainer}
                                     onLayout={(event) => {
                                        const { width } = event.nativeEvent.layout;
                                        setFormContainerWidth(width);
                                    }}>
                                    <Text style={styles.formTitle}>Password Recovery</Text>

                                    {errors.form ? <Text style={styles.errorText}>{errors.form}</Text> : null}

                                    {!userVerified ? (
                                        // Step 1: Verification form
                                        <>
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

                                            {/* Security Question Selection */}
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
                                                    contentStyle={[styles.menuContent, { width: formContainerWidth - 40 }]}
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

                                            <Button 
                                                mode="contained" 
                                                style={styles.verifyButton} 
                                                labelStyle={styles.buttonText}
                                                onPress={handleVerifyUser}
                                                buttonColor="#1976d2"
                                                icon="account-check"
                                            >
                                                Verify Account
                                            </Button>
                                        </>
                                    ) : (
                                        // Step 2: Password reset form
                                        <>
                                            <Text style={styles.successText}>Account verified! Please set your new password.</Text>

                                            <TextInput 
                                                style={styles.input}
                                                label="Current Password *"
                                                value={oldPassword}
                                                onChangeText={text => {
                                                    setOldPassword(text);
                                                    setErrors(prev => ({...prev, oldPassword: validatePassword(text)}));
                                                }}
                                                mode="outlined"
                                                secureTextEntry={!showOldPassword}
                                                outlineColor={errors.oldPassword ? '#ff5252' : '#1976d2'}
                                                activeOutlineColor={errors.oldPassword ? '#ff5252' : '#1976d2'}
                                                theme={{ colors: { primary: '#1976d2' } }}
                                                left={<TextInput.Icon icon="lock" color="#1976d2" />}
                                                right={
                                                    <TextInput.Icon 
                                                        icon={showOldPassword ? 'eye-off' : 'eye'} 
                                                        color="#1976d2"
                                                        onPress={() => setShowOldPassword(!showOldPassword)} 
                                                    />
                                                }
                                                error={!!errors.oldPassword}
                                            />
                                            {errors.oldPassword ? <HelperText type="error" visible={!!errors.oldPassword}>{errors.oldPassword}</HelperText> : null}

                                            <TextInput 
                                                style={styles.input}
                                                label="New Password *"
                                                value={newPassword}
                                                onChangeText={text => {
                                                    setNewPassword(text);
                                                    setErrors(prev => ({
                                                        ...prev, 
                                                        newPassword: validatePassword(text),
                                                        confirmPassword: validateConfirmPassword(text, confirmPassword)
                                                    }));
                                                }}
                                                mode="outlined"
                                                secureTextEntry={!showNewPassword}
                                                outlineColor={errors.newPassword ? '#ff5252' : '#1976d2'}
                                                activeOutlineColor={errors.newPassword ? '#ff5252' : '#1976d2'}
                                                theme={{ colors: { primary: '#1976d2' } }}
                                                left={<TextInput.Icon icon="lock" color="#1976d2" />}
                                                right={
                                                    <TextInput.Icon 
                                                        icon={showNewPassword ? 'eye-off' : 'eye'} 
                                                        color="#1976d2"
                                                        onPress={() => setShowNewPassword(!showNewPassword)} 
                                                    />
                                                }
                                                error={!!errors.newPassword}
                                            />
                                            {errors.newPassword ? <HelperText type="error" visible={!!errors.newPassword}>{errors.newPassword}</HelperText> : null}

                                            <TextInput 
                                                style={styles.input}
                                                label="Confirm Password *"
                                                value={confirmPassword}
                                                onChangeText={text => {
                                                    setConfirmPassword(text);
                                                    setErrors(prev => ({...prev, confirmPassword: validateConfirmPassword(newPassword, text)}));
                                                }}
                                                mode="outlined"
                                                secureTextEntry={!showConfirmPassword}
                                                outlineColor={errors.confirmPassword ? '#ff5252' : '#1976d2'}
                                                activeOutlineColor={errors.confirmPassword ? '#ff5252' : '#1976d2'}
                                                theme={{ colors: { primary: '#1976d2' } }}
                                                left={<TextInput.Icon icon="lock-check" color="#1976d2" />}
                                                right={
                                                    <TextInput.Icon 
                                                        icon={showConfirmPassword ? 'eye-off' : 'eye'} 
                                                        color="#1976d2"
                                                        onPress={() => setShowConfirmPassword(!showConfirmPassword)} 
                                                    />
                                                }
                                                error={!!errors.confirmPassword}
                                            />
                                            {errors.confirmPassword ? <HelperText type="error" visible={!!errors.confirmPassword}>{errors.confirmPassword}</HelperText> : null}

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
                                        </>
                                    )}
                                    
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
        marginVertical: 6,
        width: '100%',
        backgroundColor: 'white',
    },
    securityQuestionContainer: {
        width: '100%',
        position: 'relative',
        zIndex: 100, // Increased z-index to ensure menu appears on top
        marginBottom: 6,
    },
    menuContent: {
        backgroundColor: 'white',
        alignSelf: 'center',
        maxHeight: 200, // Fixed height for the menu
        paddingVertical: 0, // Remove default padding to maximize scroll space
    },
    menuScrollView: {
        maxHeight: 200, // Match the menuContent maxHeight
        flexGrow: 0, // Prevents ScrollView from expanding beyond maxHeight
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
    verifyButton: {
        marginTop: 20,
        paddingVertical: 8,
        width: '100%',
        alignSelf: 'center',
        borderRadius: 10,
        elevation: 2,
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
    successText: {
        color: '#4caf50',
        textAlign: 'center',
        marginBottom: 15,
        fontWeight: '500',
        fontSize: 16,
    },
});