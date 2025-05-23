import React, { useState } from 'react';
import { StyleSheet, Text, View, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { TextInput, Button } from 'react-native-paper';

const SLTBSignin = () => {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSignin = () => {
        console.log(password);
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                style={styles.container}
            >
                <View style={styles.centeredContent}>
                    <Text style={styles.subHeading}>SLTB Sign in</Text>

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

                    <Button 
                        mode="contained" 
                        style={styles.signInButton} 
                        onPress={handleSignin}
                    >
                        Sign In
                    </Button>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default SLTBSignin;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centeredContent: {
        flex: 1,
        justifyContent: 'center',
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
    signInButton: {
        marginTop: '10%',
        width: '50%',
        alignSelf: 'center',
    },
});
