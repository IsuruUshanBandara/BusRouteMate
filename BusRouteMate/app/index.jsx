import { StyleSheet,View } from 'react-native';
import * as React from 'react';
import { Card, Text,Button } from 'react-native-paper';
import{useRouter} from 'expo-router';
import { useTranslation } from 'react-i18next';
import i18n from './i18n';
const UserCategories = () =>  {
  const router = useRouter();
  const { t } = useTranslation();

 // Language switch function
 const toggleLanguage = () => {
  const newLang = i18n.language === 'en' ? 'si' : 'en';
  i18n.changeLanguage(newLang);
};
const handleNavigation = (category, path) => {
  router.push({ pathname: path, params: { category } });
};
  return (
    
    <View style={styles.container}>
      
       <View style={styles.languageToggleContainer}>
        <Button
          mode="text"
          onPress={toggleLanguage}
          labelStyle={{ fontSize: 16 }}
        >
          {i18n.language === 'en' ? 'සිංහල' : 'English'}
        </Button>
      </View>
      <Text style={styles.heading}>Welcome to Bus Route Mate</Text>
      <Text style={styles.subheading}>{t('Select_User_Category')}</Text>
      {/* Full-width Card 1 */}
      <Card style={styles.card} onPress={() => handleNavigation('driver', '/(auth)/organizationSelection')}>
        <Card.Title titleStyle={styles.title} subtitleStyle={styles.subtitle} title={t('driver')} subtitle="Sign in/Sign up" />
      </Card>

      {/* Full-width Card 2 */}
      <Card style={styles.card} onPress={() => handleNavigation('owner', '/(auth)/organizationSelection')}>
        <Card.Title titleStyle={styles.title} subtitleStyle={styles.subtitle} title={t('owner')} subtitle="Sign in/Sign up" />
      </Card>
      
      {/* Full-width Card 3 */}
      <Card style={styles.card} onPress={() => handleNavigation('passenger', '/(auth)/passenger/passengerSignIn')}>
        <Card.Title titleStyle={styles.title} subtitleStyle={styles.subtitle} title={t('passenger')} subtitle="Sign in/Sign up" />
      </Card>

      
    </View>
  );
}
export default UserCategories;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3%', // Optional: adds padding around the container
  },
  languageToggleContainer: {
    position: 'absolute',
    top: 30,
    right: 10,
    zIndex: 1,
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
});
