import { StatusBar } from 'expo-status-bar';
import { StyleSheet,View } from 'react-native';
import * as React from 'react';
import { Card, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
const OrganizationCategories = () =>  {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.subHeadingContainer}>
      <Text style={styles.subheading}>Select your bus organization</Text>
      </View>
      <View style={styles.cardsContainer}>
      {/* SLTB bus sing in card */}
      <Card style={styles.card} onPress={() => router.push('owner/sltbSignin')}>
        <Card.Title titleStyle={styles.title} subtitleStyle={styles.subtitle} title="SLTB Organization" subtitle="Sign in/Sign up" />
      </Card>

      {/* Private bus sign in card */}
      <Card style={styles.card} onPress={() => router.push('owner/privateSignin')}>
        <Card.Title titleStyle={styles.title} subtitleStyle={styles.subtitle} title="Private Organization" subtitle="Sign in/Sign up" />
      </Card>
      </View>
    </View>
  );
}
export default OrganizationCategories;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    // alignItems: 'center',
    // justifyContent: 'center',
    padding: '3%', // adds padding around the container to avoids the cards edges touching the screen edges
  },
  subHeadingContainer: {
    flex:0.2,// Pushes the subheading towards the top
    justifyContent: 'flex-end',// Aligns subheading to the bottom of this container
  },
  subheading: {
    fontSize: 20, // Fnt size of the subheading
    // marginBottom: '16%', // Space between subheading and cards
    textAlign: 'center',
  },
  cardsContainer: {
    flex: 1,// Center the cards
    justifyContent: 'center',// Vertically centers the content
    width: '100%', // Full width
  },
  card: {
    width: '100%', // Full width
    marginVertical: '5%', // Vertical spacing between cards
    elevation: 4, // Adds shadow effect on Android
    borderRadius: 10, // Rounded corners
    height: '17%', // Card height
    justifyContent: 'center', // Centers the content vertically
    // flexDirection: 'column', // Arranges the content in a column
  },
  title: {
    // color: '#6200ee', // Title color
    textAlign: 'center', // Centers the title
    
  },
  subtitle: {
    // color: '#6200ee', // Subtitle color
    textAlign: 'center', // Centers the subtitle
    
    
  },
});
