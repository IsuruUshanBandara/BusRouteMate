import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, ScrollView, Platform, Dimensions } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import { TextInput, Button, Menu, Provider, Avatar, HelperText } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';  
import { auth, db } from '../../db/firebaseConfig'; 
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';

const PassengerSignUp = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [securityQuestionAns, setSecurityQuestionAns] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [securityQuestion, setSecurityQuestion] = useState('');
    const [menuVisible, setMenuVisible] = useState(false);
    const [formContainerWidth, setFormContainerWidth] = useState(Dimensions.get('window').width - 40);
    
    // Error states
    const [errors, setErrors] = useState({
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        securityQuestion: '',
        securityQuestionAns: '',
        form: ''
    });

    // Reference for security question input to position the menu
    const securityQuestionRef = useRef(null);

    // Update width on orientation change
    useEffect(() => {
        const updateWidth = () => {
            // Account for padding (20px on each side)
            setFormContainerWidth(Dimensions.get('window').width - 40);
        };
        
        const dimensionsListener = Dimensions.addEventListener('change', updateWidth);
        
        return () => {
            dimensionsListener.remove();
        };
    }, []);

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

    // Form validation
    const validateForm = () => {
        const newErrors = {
            email: validateEmail(email),
            phoneNumber: validatePhoneNumber(phoneNumber),
            password: validatePassword(password),
            confirmPassword: validateConfirmPassword(password, confirmPassword),
            securityQuestion: validateSecurityQuestion(securityQuestion),
            securityQuestionAns: validateSecurityAnswer(securityQuestionAns),
            form: ''
        };

        setErrors(newErrors);

        // Check if there are any validation errors
        return !Object.values(newErrors).some(error => error !== '');
    };

    const handleSignUp = async () => {
        // Validate all fields before submitting
        if (!validateForm()) {
            setErrors(prev => ({...prev, form: 'Please fix the errors before submitting'}));
            return;
        }

        try {
            // Create user in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Reference to Firestore document
            const userDocRef = doc(db, "passengerDetails", email);

            // Check if the document already exists
            const docSnapshot = await getDoc(userDocRef);
            if (!docSnapshot.exists()) {
                // Store user details in Firestore with email as document ID
                await setDoc(userDocRef, {
                    email,
                    phoneNumber,
                    securityQuestion,
                    securityQuestionAns,
                    createdAt: new Date(),
                });

                console.log("Successfully created passenger account");
                router.push('passenger/passengerSignIn');
            }
        } catch (error) {
            console.error("Sign-up error:", error);
            setErrors(prev => ({...prev, form: error.message || 'Failed to create account'}));
        }
    };

    const securityQuestions = [
        "Name of your first pet?",
        "Name of your hometown?",
        "First car model?",
        "Favorite book?",
        "Favorite color?",
    ];

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
                                        icon="account-plus" 
                                        style={styles.avatar} 
                                        color="#fff" 
                                        backgroundColor="#1976d2"
                                    />
                                    <Text style={styles.mainHeading}>Bus Route Mate</Text>
                                    <Text style={styles.subHeadingText}>Passenger Registration</Text>
                                </View>

                                <View 
                                    style={styles.formContainer}
                                    onLayout={(event) => {
                                        const { width } = event.nativeEvent.layout;
                                        setFormContainerWidth(width);
                                    }}
                                >
                                    <Text style={styles.formTitle}>Create Your Account</Text>

                                    {errors.form ? <Text style={styles.errorText}>{errors.form}</Text> : null}

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

                                    <TextInput 
                                        style={styles.input}
                                        label="Password *"
                                        value={password}
                                        onChangeText={text => {
                                            setPassword(text);
                                            setErrors(prev => ({
                                                ...prev, 
                                                password: validatePassword(text),
                                                confirmPassword: validateConfirmPassword(text, confirmPassword)
                                            }));
                                        }}
                                        mode="outlined"
                                        secureTextEntry={!showPassword}
                                        outlineColor={errors.password ? '#ff5252' : '#1976d2'}
                                        activeOutlineColor={errors.password ? '#ff5252' : '#1976d2'}
                                        theme={{ colors: { primary: '#1976d2' } }}
                                        left={<TextInput.Icon icon="lock" color="#1976d2" />}
                                        right={
                                            <TextInput.Icon 
                                                icon={showPassword ? 'eye-off' : 'eye'} 
                                                color="#1976d2"
                                                onPress={() => setShowPassword(!showPassword)} 
                                            />
                                        }
                                        error={!!errors.password}
                                    />
                                    {errors.password ? <HelperText type="error" visible={!!errors.password}>{errors.password}</HelperText> : null}

                                    <TextInput 
                                        style={styles.input}
                                        label="Confirm Password *"
                                        value={confirmPassword}
                                        onChangeText={text => {
                                            setConfirmPassword(text);
                                            setErrors(prev => ({...prev, confirmPassword: validateConfirmPassword(password, text)}));
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

                                    {/* Security Question Selection - WITH SCROLLABLE MENU */}
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
                                        style={styles.signUpButton} 
                                        labelStyle={styles.buttonText}
                                        onPress={handleSignUp}
                                        buttonColor="#1976d2"
                                        icon="account-plus"
                                    >
                                        Register Now
                                    </Button>
                                    
                                    <Button 
                                        mode="text" 
                                        onPress={() => router.push('passenger/passengerSignIn')}
                                        style={styles.backButton}
                                        labelStyle={styles.backButtonText}
                                    >
                                        Already have an account? Sign In
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

export default PassengerSignUp;

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
    menu: {
        zIndex: 200, // Higher z-index than the container
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
    signUpButton: {
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
});