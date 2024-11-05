import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, ScrollView, Platform, Pressable } from 'react-native';
import React, { useState } from 'react';
import { TextInput, Button, Menu, Provider } from 'react-native-paper';
import { useRouter } from 'expo-router';

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

    const handleSignUp = () => {
        console.log(password);
        console.log(phoneNumber);
    };

    const securityQuestions = [
        "What is your mother's maiden name?",
        "What was the name of your first pet?",
        "What is the name of your hometown?",
        "What was your first car model?",
        "What is your favorite book?",
        "What is your favorite color?"
    ];

    const toggleMenuVisibility = () => {
        setMenuVisible(!menuVisible);
    };

    return (
        <Provider>
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
                                value={email}
                                onChangeText={text => setEmail(text)}
                                mode="outlined"
                            />

                            <TextInput 
                                style={styles.input}
                                label="Phone Number"
                                value={phoneNumber}
                                onChangeText={text => setPhoneNumber(text)}
                                mode="outlined"
                                keyboardType="phone-pad"
                            />

                            <TextInput 
                                style={styles.input}
                                label="Password"
                                value={password}
                                onChangeText={text => setPassword(text)}
                                mode="outlined"
                                secureTextEntry={!showPassword}
                                right={
                                    <TextInput.Icon 
                                        icon={showPassword ? 'eye-off' : 'eye'} 
                                        onPress={() => setShowPassword(!showPassword)} 
                                    />
                                }
                            />

                            <TextInput 
                                style={styles.input}
                                label="Confirm Password"
                                value={confirmPassword}
                                onChangeText={text => setConfirmPassword(text)}
                                mode="outlined"
                                secureTextEntry={!showConfirmPassword}
                                right={
                                    <TextInput.Icon 
                                        icon={showConfirmPassword ? 'eye-off' : 'eye'} 
                                        onPress={() => setShowConfirmPassword(!showConfirmPassword)} 
                                    />
                                }
                            />

                            {/* Security Question Selection */}
                            <Menu
                                visible={menuVisible}
                                onDismiss={() => setMenuVisible(false)}
                                anchor={
                                    <Pressable onPress={toggleMenuVisibility} style={styles.input}>
                                        <TextInput
                                            label="Security Question"
                                            value={securityQuestion || ""}
                                            placeholder={!securityQuestion ? "Select a security question" : ""}
                                            mode="outlined"
                                            editable={false}
                                            right={
                                                <TextInput.Icon 
                                                    icon={menuVisible ? 'chevron-up' : 'chevron-down'} 
                                                    onPress={toggleMenuVisibility} 
                                                />
                                            }
                                        />
                                    </Pressable>
                                }
                                contentStyle={[styles.menuContent, { width: '100%' }]} // Sets menu width to TextInput width
                            >
                                <ScrollView style={{ maxHeight: 150 }}>
                                    {securityQuestions.map((question, index) => (
                                        <Menu.Item
                                            key={index}
                                            onPress={() => {
                                                setSecurityQuestion(question);
                                                setMenuVisible(false);
                                            }}
                                            title={question}
                                            style={styles.menuItem}
                                        />
                                    ))}
                                </ScrollView>
                            </Menu>

                            <TextInput 
                                style={styles.input}
                                label="Answer to the Selected Security Question"
                                value={securityQuestionAns}
                                onChangeText={text => setSecurityQuestionAns(text)}
                                mode="outlined"
                            />

                            <Button 
                                mode="contained" 
                                style={styles.signUpButton} 
                                onPress={handleSignUp}
                            >
                                Sign Up
                            </Button>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Provider>
    );
};

export default PassengerSignUp;

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
