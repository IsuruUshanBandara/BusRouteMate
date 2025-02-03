import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import React, { useEffect, useState } from 'react';
import { TextInput, Button, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';

const AddRegisterDriverBusScreen1 = () => {
    const { busData } = useLocalSearchParams();
    const router = useRouter();

    // State to manage parsed data and plate number
    const [parsedBusData, setParsedBusData] = useState([]);
    const [plateNum, setPlateNum] = useState('');
    const [currentRouteIndex, setCurrentRouteIndex] = useState(0);
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [passingCities, setPassingCities] = useState(['']);
    const [routeData, setRouteData] = useState([]);

    // Parse bus data only once when `busData` is available
    useEffect(() => {
        if (busData) {
            const data = JSON.parse(busData);
            setParsedBusData(data.routes || []);
            setPlateNum(data.licencePlateNum || '');
        }
    }, [busData]);

    useEffect(() => {
        if (parsedBusData.length > 0) {
            const initialRoute = parsedBusData[0];

            // Prevent unnecessary state updates
            setOrigin((prev) => (prev !== initialRoute.origin ? initialRoute.origin || '' : prev));
            setDestination((prev) => (prev !== initialRoute.destination ? initialRoute.destination || '' : prev));
            setPassingCities((prev) =>
                JSON.stringify(prev) !== JSON.stringify(initialRoute.passingCities) ? initialRoute.passingCities || [''] : prev
            );
        }
    }, [parsedBusData]);

    const addPassingCity = () => {
        setPassingCities([...passingCities, '']);
    };

    const updatePassingCity = (text, index) => {
        const updatedCities = [...passingCities];
        updatedCities[index] = text;
        setPassingCities(updatedCities);
    };

    const removePassingCity = (index) => {
        if (index > 0) {
            setPassingCities((prev) => prev.filter((_, i) => i !== index));
        }
    };

    const handleNext = () => {
        const updatedRoutes = [...routeData, {
            routeNum: parsedBusData[currentRouteIndex].routeNum,
            origin,
            passingCities,
            destination
        }];
        setRouteData(updatedRoutes);

        if (currentRouteIndex + 1 < parsedBusData.length) {
            const nextRoute = parsedBusData[currentRouteIndex + 1];
            setOrigin(nextRoute.origin || '');
            setDestination(nextRoute.destination || '');
            setPassingCities(nextRoute.passingCities && nextRoute.passingCities.length > 0 ? [...nextRoute.passingCities] : ['']);
            setCurrentRouteIndex(currentRouteIndex + 1);
        }
        // console.log("Before update:", passingCities);
        // setPassingCities((nextRoute.passingCities && nextRoute.passingCities.length > 0) ? [...nextRoute.passingCities] : ['']);
        // console.log("After update:", passingCities);
    };

    const handleSubmit = () => {
        const finalRoutes = [...routeData, {
            routeNum: parsedBusData[currentRouteIndex].routeNum,
            origin,
            passingCities,
            destination
        }];

        router.push({
            pathname: 'screens/owner/addRegisterDriverBusScreen2',
            params: { busData: JSON.stringify({ licencePlateNum: plateNum, routes: finalRoutes }) },
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <View style={styles.centeredContent}>
                        <View style={styles.subHeadingContainer}>
                            <Text style={styles.subHeading}>
                                Passing Cities for Route {parsedBusData[currentRouteIndex]?.routeNum || ''}
                            </Text>
                        </View>

                        <TextInput
                            style={styles.input}
                            label="Origin"
                            value={origin}
                            onChangeText={setOrigin}
                            mode="outlined"
                        />
                        {passingCities.length > 0 && (
                            <>
                                {passingCities.map((city, index) => (
                                    <View key={index} style={styles.cityContainer}>
                                        <TextInput
                                            style={[styles.input, { flex: 1 }]}
                                            label={`In-Between City ${index + 1}`}
                                            value={city}
                                            onChangeText={(text) => updatePassingCity(text, index)}
                                            mode="outlined"
                                        />
                                        {index > 0 && (
                                            <IconButton
                                                icon="delete"
                                                size={20}
                                                onPress={() => removePassingCity(index)}
                                                style={styles.deleteIcon}
                                            />
                                        )}
                                    </View>
                                ))}
                            </>
                        )}
                        <TextInput
                            style={styles.input}
                            label="Destination"
                            value={destination}
                            onChangeText={setDestination}
                            mode="outlined"
                        />

                        <Button mode="contained" style={styles.addButton} onPress={addPassingCity}>
                            Add In-Between City
                        </Button>

                        {currentRouteIndex < parsedBusData.length - 1 ? (
                            <Button mode="contained" style={styles.nextButton} onPress={handleNext}>
                                Next
                            </Button>
                        ) : (
                            <Button mode="contained" style={styles.submitButton} onPress={handleSubmit}>
                                Save
                            </Button>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default AddRegisterDriverBusScreen1;

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
    cityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addButton: {
        marginTop: 10,
        paddingVertical: 6,
        width: '100%',
        alignSelf: 'center',
    },
    nextButton: {
        marginTop: 20,
        paddingVertical: 6,
        width: '100%',
        alignSelf: 'center',
        backgroundColor: '#1976D2',
    },
    submitButton: {
        marginTop: 20,
        paddingVertical: 6,
        width: '100%',
        alignSelf: 'center',
    },
});
