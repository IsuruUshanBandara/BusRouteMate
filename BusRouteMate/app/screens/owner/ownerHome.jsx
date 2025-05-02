import { StyleSheet, View, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Card, Text } from 'react-native-paper';
import { router, useRouter } from 'expo-router';
import { auth } from '../../db/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { FontAwesome5 } from '@expo/vector-icons';

const OwnerHome = () => {
  const route = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        setLoading(false);
        // console.log('User is signed in');
      } else {
        route.push('screens/owner/privateSignIn');
      }
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <View style={styles.headingContainer}>
        <Text style={styles.mainTitle}>Bus Route Mate</Text>
        <Text style={styles.subheading}>Owner Dashboard</Text>
      </View>

      <View style={styles.cardsContainer}>
        {/* Card 1 */}
        <Card style={styles.card} onPress={() => router.push('screens/owner/addRegisterDriverBusScreen1')}>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.title}>Add/Register Buses and Driver</Text>
            <View style={styles.titleUnderline} />
            <FontAwesome5 name="bus-alt" size={24} color="#1976d2" style={styles.cardIcon} />
          </Card.Content>
        </Card>

        {/* Card 2 */}
        <Card style={styles.card} onPress={() => router.push('screens/owner/manageDriverBusScreen')}>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.title}>Edit/Delete Buses and Drivers</Text>
            <View style={styles.titleUnderline} />
            <FontAwesome5 name="edit" size={24} color="#1976d2" style={styles.cardIcon} />
          </Card.Content>
        </Card>

        {/* Card 3 */}
        <Card style={styles.card} onPress={() => router.push('screens/owner/rideStartedBusListScreen')}>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.title}>Track Bus</Text>
            <View style={styles.titleUnderline} />
            <FontAwesome5 name="map-marker-alt" size={24} color="#1976d2" style={styles.cardIcon} />
          </Card.Content>
        </Card>

        {/* Card 4 */}
        <Card style={styles.card} onPress={() => router.push('screens/owner/viewFeedbackScreen1')}>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.title}>View Feedback</Text>
            <View style={styles.titleUnderline} />
            <FontAwesome5 name="comment-alt" size={24} color="#1976d2" style={styles.cardIcon} />
          </Card.Content>
        </Card>
      </View>
    </View>
  );
};

export default OwnerHome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: '3%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  headingContainer: {
    flex: 0.2,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1976d2',
    textAlign: 'center',
    textShadowColor: 'rgba(25, 118, 210, 0.15)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subheading: {
    fontSize: 18,
    color: '#757575',
    textAlign: 'center',
    marginTop: 8,
  },
  cardsContainer: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  card: {
    width: '90%',
    marginVertical: '3%',
    elevation: 6,
    borderRadius: 16,
    minHeight: 110, // Fixed height in pixels instead of percentage
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 1,
    borderLeftColor: '#1976d2',
    borderRightColor: '#1976d2',
    borderRightWidth: 1,
    borderBottomColor: '#1976d2',
    borderBottomWidth: 1,
    borderTopColor: '#1976d2',
    borderTopWidth: 1,
  },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1976d2',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  titleUnderline: {
    height: 2,
    width: '50%',
    backgroundColor: '#1976d2',
    marginTop: 4,
    marginBottom: 10,
    borderRadius: 2,
  },
  cardIcon: {
    marginTop: 4,
    marginBottom: 2,
    alignSelf: 'center',
  },
});