import { StyleSheet,View } from 'react-native';
import * as React from 'react';
import { Card, Text } from 'react-native-paper';
import{router, useRouter} from 'expo-router';

const PassengerHome = () => {
  const route = useRouter();
  return (
    <View style={styles.container}>
        <Text style={styles.heading}>Welcome to Bus Route Mate</Text>
        {/* <Text style={styles.subheading}>Select User Category</Text> */}
        {/* Full-width Card 1 */}
        <Card style={styles.card} onPress={() => router.push('screens/owner/addRegisterDriverBusScreen1')}>
        <Card.Title titleStyle={styles.title} subtitleStyle={styles.subtitle} title="Check and Track Bus"/>
        </Card>

        {/* Full-width Card 2 */}
        <Card style={styles.card} onPress={() => router.push('screens/passenger/driverConductorRatingFeedback')}>
        <Card.Title titleStyle={styles.title} subtitleStyle={styles.subtitle} title="Driver and Conductor Rating and Feedback"/>
        </Card>

        {/* Full-width Card 3 */}
        <Card style={styles.card} onPress={() => router.push('screens/passenger/busConditionPollutionFeedback')}>
        <Card.Title titleStyle={styles.title} subtitleStyle={styles.subtitle} title="Bus Condition and Pollution Feedback"/>
        </Card>

         {/* Full-width Card 4 */}
         <Card style={styles.card} onPress={() => router.push('screens/passenger/satisfactionSuggestion')}>
        <Card.Title titleStyle={styles.title} subtitleStyle={styles.subtitle} title="Customer Satisfaction and suggestions"/>
        </Card>


    {/* <StatusBar style="auto" /> */}
    </View>
  )
}

export default PassengerHome;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3%', // Optional: adds padding around the container
      },
      heading: {
        fontSize: 30, // Adjust the size as needed
        fontWeight: 'bold', // Bold heading
        marginBottom: '5%', // Space between heading and subheading
        textAlign: 'center', // Centers the heading
      },
      subheading: {
        fontSize: 24, // Adjust the size as needed
        fontWeight: 'bold', // Bold subheading
        textAlign: 'center', // Centers the subheading
        marginBottom: '10%', // Space between subheading and cards
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
})