import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import React, { useState } from 'react';
import { TextInput, Button, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
const AddRegisterDriverBusScreen3 = () => {
    const {plateNum}=useLocalSearchParams();
    const router = useRouter();
    const [licencePlateNum, setLicencePlateNum] = useState('');
    const [drivers, setDrivers] = useState([{ phoneNum: '', password: '', confirmPassword: '' }]);
    
    // Separate visibility states for password and confirm password fields
    const [showPassword, setShowPassword] = useState([]);
    const [showConfirmPassword, setShowConfirmPassword] = useState([]);

    const addDriver = () => {
        setDrivers([...drivers, { phoneNum: '', password: '', confirmPassword: '' }]);
        setShowPassword([...showPassword, false]);
        setShowConfirmPassword([...showConfirmPassword, false]);
    };

    const removeLastDriver = () => {
        if (drivers.length > 1) {
            setDrivers(drivers.slice(0, -1));
            setShowPassword(showPassword.slice(0, -1));
            setShowConfirmPassword(showConfirmPassword.slice(0, -1));
        }
    };

    const handleSubmit = () => {
        const sanitizedDrivers = drivers.map(({ phoneNum, password, confirmPassword }) => ({
            phoneNum,
            password,
            confirmPassword
        }));
        const busData = {
            drivers: sanitizedDrivers,
           
        };
        console.log(busData);
        router.dismissAll();
        router.replace('screens/owner/ownerHome');
           
        
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
                            <Text style={styles.subHeading}>Add and Register Driver for bus {plateNum}</Text>
                        </View>

                        {drivers.map((driver, index) => (
                            <View key={index}>
                                <TextInput
                                    style={styles.input}
                                    label={`Driver Phone Number ${index + 1}`}
                                    value={driver.phoneNum}
                                    keyboardType='phone-pad'
                                    onChangeText={text => {
                                        const updatedDrivers = [...drivers];
                                        updatedDrivers[index].phoneNum = text;
                                        setDrivers(updatedDrivers);
                                    }}
                                    mode="outlined"
                                />

                                {/* Password Field */}
                                <TextInput
                                    style={styles.input}
                                    label="Password"
                                    secureTextEntry={!showPassword[index]}
                                    right={
                                        <TextInput.Icon
                                            icon={showPassword[index] ? "eye-off" : "eye"}
                                            onPress={() => {
                                                const updatedShowPassword = [...showPassword];
                                                updatedShowPassword[index] = !updatedShowPassword[index];
                                                setShowPassword(updatedShowPassword);
                                            }}
                                        />
                                    }
                                    value={driver.password}
                                    onChangeText={text => {
                                        const updatedDrivers = [...drivers];
                                        updatedDrivers[index].password = text;
                                        setDrivers(updatedDrivers);
                                    }}
                                    mode="outlined"
                                />

                                {/* Confirm Password Field */}
                                <TextInput
                                    style={styles.input}
                                    label="Confirm Password"
                                    secureTextEntry={!showConfirmPassword[index]}
                                    right={
                                        <TextInput.Icon
                                            icon={showConfirmPassword[index] ? "eye-off" : "eye"}
                                            onPress={() => {
                                                const updatedShowConfirmPassword = [...showConfirmPassword];
                                                updatedShowConfirmPassword[index] = !updatedShowConfirmPassword[index];
                                                setShowConfirmPassword(updatedShowConfirmPassword);
                                            }}
                                        />
                                    }
                                    value={driver.confirmPassword}
                                    onChangeText={text => {
                                        const updatedDrivers = [...drivers];
                                        updatedDrivers[index].confirmPassword = text;
                                        setDrivers(updatedDrivers);
                                    }}
                                    mode="outlined"
                                />
                            </View>
                        ))}

                        <Button
                            mode="contained"
                            style={styles.addButton}
                            onPress={addDriver}
                        >
                            Add More Driver
                        </Button>

                        <Button
                            mode="contained"
                            style={styles.removeButton}
                            onPress={removeLastDriver}
                            disabled={drivers.length === 1}
                        >
                            Remove Last Driver
                        </Button>

                        <Button
                            mode="contained"
                            style={styles.submitButton}
                            onPress={handleSubmit}
                        >
                            Save
                        </Button>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default AddRegisterDriverBusScreen3;

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
    },
    addButton: {
        marginTop: 10,
        paddingVertical: 6,
        width: '100%',
        alignSelf: 'center',
    },
    removeButton: {
        marginTop: 10,
        paddingVertical: 6,
        width: '100%',
        alignSelf: 'center',
        backgroundColor: '#D32F2F',
    },
    submitButton: {
        marginTop: 20,
        paddingVertical: 6,
        width: '100%',
        alignSelf: 'center',
    },
});
