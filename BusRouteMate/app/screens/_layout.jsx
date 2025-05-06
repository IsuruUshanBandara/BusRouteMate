import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Appbar } from 'react-native-paper';
import { Slot, useRouter, usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NormalScreenlayout = () => {
  const router = useRouter();
  const pathname = usePathname();
  
  const handleLogout = async () => {
    // Always clear form data when logging out
    try {
      await AsyncStorage.removeItem('busRegistrationFormData_step1');
      // Set a marker that we're going to home screen
      await AsyncStorage.setItem('lastScreenVisited', 'home');
      console.log("Form data cleared on logout");
    } catch (error) {
      console.error("Error clearing form data:", error);
    }
    
    router.push('/');
    console.log("Logout pressed");
  };

  const handleBackAction = async () => {  
    router.back();
  };

  const handleNotificationPress = () => {
    // Implement your notification handling here
    console.log("Notification pressed");
    // For example, navigate to the notifications screen:
    // router.push('/path/to/notifications');
  };
  
  return (
    <View style={Styles.container}>
      <Appbar.Header style={Styles.appBarHeader}>
        <Appbar.BackAction onPress={handleBackAction} />
        <Appbar.Content />
        <Appbar.Action
          icon="bell"
          onPress={handleNotificationPress}
          style={Styles.bellActionIcon}
        />
        <Appbar.Action
          icon="logout"
          onPress={handleLogout}
          style={Styles.logoutActionIcon}
        />
      </Appbar.Header>
      <Slot />
    </View>
  )
}

export default NormalScreenlayout

const Styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appbarTitle: {
    alignItems: 'center'
  },
  logoutActionIcon: {
    marginLeft: 'auto', // This will push the icons to the right
  },
  bellActionIcon: {
    marginLeft: 'auto', // This will push the icons to the left
  },
})