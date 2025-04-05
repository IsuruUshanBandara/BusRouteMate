import { StyleSheet, View, ScrollView, SafeAreaView } from 'react-native';
import React from 'react';
import { Card, Text, IconButton, Title, Paragraph } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';

const EditBusOptionsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { plateNumber, currentRoute, routeDocId } = params;

  const handleBusRouteEdit = () => {
    router.push({
      pathname: 'screens/owner/editBusRouteDetails',
      params: { 
        plateNumber,
        currentRoute,
        routeDocId
      }
    });
  };

  const handleDriverConductorEdit = () => {
    router.push({
      pathname: 'screens/owner/editDriverConductorDetails',
      params: { 
        plateNumber,
        currentRoute,
        routeDocId
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => router.back()}
            style={styles.backButton}
          />
          <Text style={styles.heading}>Select What to Edit</Text>
        </View>

        <View style={styles.busInfoContainer}>
          <Text style={styles.busInfoText}>Bus No: {plateNumber}</Text>
          <Text style={styles.busInfoText}>Route: {currentRoute}</Text>
        </View>

        <Text style={styles.instructionText}>
          Please select which information you would like to edit:
        </Text>

        <Card style={styles.card} onPress={handleBusRouteEdit}>
          <Card.Content>
            <View style={styles.cardContentRow}>
              <View style={styles.cardTextContainer}>
                <Title>Bus & Route Information</Title>
                <Paragraph>
                  Edit route details including in inbetween cities.
                </Paragraph>
              </View>
              <IconButton icon="bus" size={28} style={styles.cardIcon} />
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card} onPress={handleDriverConductorEdit}>
          <Card.Content>
            <View style={styles.cardContentRow}>
              <View style={styles.cardTextContainer}>
                <Title>Driver & Conductor Information</Title>
                <Paragraph>
                  Edit staff details including driver and conductor information.
                </Paragraph>
              </View>
              <IconButton icon="account-group" size={28} style={styles.cardIcon} />
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditBusOptionsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 10,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  busInfoContainer: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  busInfoText: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  instructionText: {
    fontSize: 16,
    marginBottom: 16,
    color: '#555',
  },
  card: {
    marginVertical: 10,
    elevation: 4,
  },
  cardContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  cardIcon: {
    backgroundColor: '#e0e0e0',
    margin: 0,
  },
});