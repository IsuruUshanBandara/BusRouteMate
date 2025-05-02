import { StyleSheet, View } from 'react-native';
import * as React from 'react';
import { Card, Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import i18n from './i18n';

const UserCategories = () => {
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
          mode="contained"
          onPress={toggleLanguage}
          buttonColor="rgba(25, 118, 210, 0.1)"
          textColor="#1976d2"
          labelStyle={{ fontSize: 16, fontWeight: '600' }}
        >
          {i18n.language === 'en' ? 'සිංහල' : 'English'}
        </Button>
      </View>
      
      <View style={styles.headerContainer}>
        <Text style={styles.heading}>Welcome to Bus Route Mate</Text>
        <View style={styles.headingUnderline} />
        <Text style={styles.subheading}>{t('Select_User_Category')}</Text>
      </View>
      
      {/* Enhanced Card 1 - Driver */}
      <Card 
        style={[styles.card, styles.driverCard]} 
        onPress={() => handleNavigation('driver', '/(auth)/organizationSelection')}
        mode="elevated"
      >
        <Card.Content style={styles.cardContent}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{t('driver')}</Text>
            <View style={styles.titleUnderline} />
          </View>
          <Text style={styles.subtitle}>Sign in/Sign up</Text>
        </Card.Content>
      </Card>

      {/* Enhanced Card 2 - Owner */}
      <Card 
        style={[styles.card, styles.ownerCard]} 
        onPress={() => handleNavigation('owner', '/(auth)/organizationSelection')}
        mode="elevated"
      >
        <Card.Content style={styles.cardContent}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{t('owner')}</Text>
            <View style={styles.titleUnderline} />
          </View>
          <Text style={styles.subtitle}>Sign in/Sign up</Text>
        </Card.Content>
      </Card>
      
      {/* Enhanced Card 3 - Passenger */}
      <Card 
        style={[styles.card, styles.passengerCard]} 
        onPress={() => handleNavigation('passenger', '/(auth)/passenger/passengerSignIn')}
        mode="elevated"
      >
        <Card.Content style={styles.cardContent}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{t('passenger')}</Text>
            <View style={styles.titleUnderline} />
          </View>
          <Text style={styles.subtitle}>Sign in/Sign up</Text>
        </Card.Content>
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
    padding: '3%',
  },
  languageToggleContainer: {
    position: 'absolute',
    top: 30,
    right: 10,
    zIndex: 1,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: '8%',
  },
  heading: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1976d2',
    textShadowColor: 'rgba(25, 118, 210, 0.15)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  headingUnderline: {
    height: 3,
    width: 100,
    backgroundColor: '#1976d2',
    marginVertical: 8,
    borderRadius: 2,
  },
  subheading: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    color: '#757575',
  },
  card: {
    width: '90%',
    marginVertical: '4%',
    elevation: 6,
    borderRadius: 16,
    height: '13%',
    justifyContent: 'center',
  },
  driverCard: {
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
  ownerCard: {
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
  passengerCard: {
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