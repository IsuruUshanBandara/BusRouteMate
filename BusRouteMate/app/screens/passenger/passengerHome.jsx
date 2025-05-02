import { StyleSheet, View } from 'react-native';
import * as React from 'react';
import { Card, Text } from 'react-native-paper';
import { router, useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';

const PassengerHome = () => {
  const route = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.headingContainer}>
        <Text style={styles.mainTitle}>Bus Route Mate</Text>
        <Text style={styles.subheading}>Passenger Dashboard</Text>
      </View>

      <View style={styles.cardsContainer}>
        {/* Card 1 */}
        <Card style={styles.card} onPress={() => router.push('screens/passenger/searchViewBusRoutes')}>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.title}>Check and Track Bus</Text>
            <View style={styles.titleUnderline} />
            <FontAwesome5 name="search-location" size={24} color="#1976d2" style={styles.cardIcon} />
          </Card.Content>
        </Card>

        {/* Card 2 */}
        <Card style={styles.card} onPress={() => router.push('screens/passenger/driverConductorRatingFeedback')}>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.title}>Driver and Conductor Rating and Feedback</Text>
            <View style={styles.titleUnderline} />
            <FontAwesome5 name="star" size={24} color="#1976d2" style={styles.cardIcon} />
          </Card.Content>
        </Card>

        {/* Card 3 */}
        <Card style={styles.card} onPress={() => router.push('screens/passenger/busConditionPollutionFeedback')}>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.title}>Bus Condition and Pollution Feedback</Text>
            <View style={styles.titleUnderline} />
            <FontAwesome5 name="clipboard-check" size={24} color="#1976d2" style={styles.cardIcon} />
          </Card.Content>
        </Card>

        {/* Card 4 */}
        <Card style={styles.card} onPress={() => router.push('screens/passenger/satisfactionSuggestion')}>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.title}>Customer Satisfaction and Suggestions</Text>
            <View style={styles.titleUnderline} />
            <FontAwesome5 name="smile" size={24} color="#1976d2" style={styles.cardIcon} />
          </Card.Content>
        </Card>
      </View>
    </View>
  );
};

export default PassengerHome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: '3%',
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
    fontSize: 16, // Made slightly smaller to fit longer titles
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