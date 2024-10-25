import { StatusBar } from 'expo-status-bar';
import { StyleSheet,View } from 'react-native';
import * as React from 'react';
import { Card, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
const OrganizationCategories = () =>  {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.subheading}>Select your bus organization</Text>
      {/* Full-width Card 1 */}
      <Card style={styles.card} onPress={() => router.push('owner/sltbSignin')}>
        <Card.Title titleStyle={styles.title} subtitleStyle={styles.subtitle} title="SLTB Organization" subtitle="Sign in/Sign up" />
      </Card>

      {/* Full-width Card 2 */}
      <Card style={styles.card} onPress={() => console.log("Card 2 Pressed")}>
        <Card.Title titleStyle={styles.title} subtitleStyle={styles.subtitle} title="Private Organization" subtitle="Sign in/Sign up" />
      </Card>

      {/* <StatusBar style="auto" /> */}
    </View>
  );
}
export default OrganizationCategories;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3%', // Optional: adds padding around the container
  },
  subheading: {
    fontSize: 20, // Adjust the size as needed
    marginBottom: '16%', // Space between subheading and cards
  },
  card: {
    width: '100%', // Full width
    marginVertical: '5%', // Vertical spacing between cards
    elevation: 4, // Adds shadow effect on Android
    borderRadius: 10, // Rounded corners
    height: '13%', // Card height
    justifyContent: 'center', // Centers the content vertically
    flexDirection: 'column', // Arranges the content in a column
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
