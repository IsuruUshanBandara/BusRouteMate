import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import * as React from 'react';
import { Card, Text } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const OrganizationCategories = () =>  {
  const router = useRouter();
  const { category } = useLocalSearchParams();
  
  // Conditional navigation based on the category
  const handleCardPress = (orgType) => {
    if (category === 'driver') {
      // Navigate to driver-specific screens and pass category
      router.push({
        pathname: `driver/driverSignIn`,
        params: { category }, // Pass the category
      });
    } else if (category === 'owner') {
      // Navigate to owner-specific screens and pass category
      router.push({
        pathname: `owner/${orgType}SignIn`,
        params: { category }, // Pass the category
      });
    } else {
      console.error('Invalid category'); // Handle unexpected cases
    }
  };

  return (
    <View style={styles.container}>
      
      <View style={styles.subHeadingContainer}>
        <Text style={styles.mainTitle}>Bus Organizations</Text>
        <Text style={styles.subheading}>Please select your organization type</Text>
      </View>
      <View style={styles.cardsContainer}>
        
        <Card 
          style={[styles.card, styles.sltbCard]} 
          onPress={() => handleCardPress('sltb')}
          mode="elevated"
        >
          <Card.Content style={styles.cardContent}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>SLTB Organization</Text>
              <View style={styles.titleUnderline} />
            </View>
            <Text style={styles.subtitle}>Sign in/Sign up</Text>
          </Card.Content>
        </Card>

        
        <Card 
          style={[styles.card, styles.privateCard]} 
          onPress={() => handleCardPress('private')}
          mode="elevated"
        >
          <Card.Content style={styles.cardContent}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Private Organization</Text>
              <View style={styles.titleUnderline} />
            </View>
            <Text style={styles.subtitle}>Sign in/Sign up</Text>
          </Card.Content>
        </Card>
      </View>
    </View>
  );
};

export default OrganizationCategories;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: '3%', 
  },
  subHeadingContainer: {
    flex: 0.2, 
    justifyContent: 'flex-end', 
    alignItems: 'center',
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
    width: '100%', // Full width
  },
  card: {
    width: '90%',
    marginVertical: '4%',
    elevation: 6,
    borderRadius: 16,
    height: '17%',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  sltbCard: {
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
  privateCard: {
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
  },
  titleContainer: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1976d2',
    letterSpacing: 0.5,
  },
  titleUnderline: {
    height: 2,
    width: '50%',
    backgroundColor: '#1976d2',
    marginTop: 4,
    marginBottom: 6,
    borderRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#757575',
    marginTop: 4,
  },
});