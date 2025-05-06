import React, { useEffect } from 'react'
import { View, Text, StyleSheet, Alert } from 'react-native'
import { Appbar } from 'react-native-paper';
import { Slot, useRouter, usePathname, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NormalScreenlayout = () => {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const isOnFinalRegistrationScreen = pathname.includes('addRegisterDriverBusScreen3');
  
  // Check if we're in any registration screen (not just the final one)
  const isInRegistrationFlow = pathname.includes('addRegisterDriverBus');
  
  useEffect(() => {
    // If we're on the final registration screen, clear the form data
    if (isOnFinalRegistrationScreen) {
      clearFormData();
    }
  }, [isOnFinalRegistrationScreen]);

  // Track registration flow state
  useEffect(() => {
    const trackRegistrationFlow = async () => {
      if (isInRegistrationFlow) {
        // Mark that we're in registration flow
        await AsyncStorage.setItem('inRegistrationFlow', 'true');
        
        // Store which step of registration we're on
        await AsyncStorage.setItem('currentRegistrationStep', pathname);
        
        console.log(`In registration flow: ${pathname}`);
      }
    };
    
    trackRegistrationFlow();
    
    return () => {
      // When leaving final registration screen to go anywhere else
      if (isOnFinalRegistrationScreen) {
        AsyncStorage.setItem('lastScreenBeforeFinal', pathname);
      }
    };
  }, [isInRegistrationFlow, isOnFinalRegistrationScreen, pathname]);
  
  // Effect to handle navigation to home from registration
  useEffect(() => {
    const handleHomeNavigation = async () => {
      if (pathname.includes('ownerHome')) {
        const wasInRegistration = await AsyncStorage.getItem('inRegistrationFlow');
        
        if (wasInRegistration === 'true') {
          console.log("Arrived at home from registration flow, clearing history");
          
          // Clear registration markers when reaching home
          await AsyncStorage.setItem('comingFromRegistrationFlow', 'true');
          await AsyncStorage.removeItem('inRegistrationFlow');
          await AsyncStorage.removeItem('currentRegistrationStep');
        }
      }
    };
    
    handleHomeNavigation();
  }, [pathname]);

  const clearFormData = async () => {
    try {
      await AsyncStorage.removeItem('busRegistrationFormData_step1');
      await AsyncStorage.removeItem('busRegistrationFormData_step1Sub');
      console.log("Form data cleared on final screen");
    } catch (error) {
      console.error("Error clearing form data:", error);
    }
  };

  const handleLogout = async () => {
    // Always clear form data when logging out
    try {
      await AsyncStorage.removeItem('busRegistrationFormData_step1');
      await AsyncStorage.removeItem('busRegistrationFormData_step1Sub');
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
    // If on final registration screen, go to home instead of previous page
    if (isOnFinalRegistrationScreen) {
      Alert.alert(
        "Return to Home",
        "Do you want to go back to the home screen?",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Yes",
            onPress: async () => {
              try {
                // Store information that we're coming from registration flow
                await AsyncStorage.setItem('comingFromRegistrationFlow', 'true');
                
                // Reset the navigation stack and navigate to home screen
                // This will completely remove all previous screens in the stack
                router.navigate('screens/owner/ownerHome');
              } catch (error) {
                console.error("Error handling navigation:", error);
                // Fallback to replace if navigate fails
                router.replace('screens/owner/ownerHome');
              }
            }
          }
        ],
        { cancelable: true }
      );
    } else {
      // Check if we're on home and we came from registration flow
      if (pathname.includes('ownerHome')) {
        try {
          const comingFromRegistration = await AsyncStorage.getItem('comingFromRegistrationFlow');
          
          if (comingFromRegistration === 'true') {
            // Clear the flag since we're handling it now
            await AsyncStorage.removeItem('comingFromRegistrationFlow');
            
            // Instead of going back to any registration page, reset history or go to a specific fallback
            console.log("Preventing navigation back to registration flow");
            
            // You can either do nothing (prevent back navigation)
            // Or navigate to a specific screen that was before the registration flow started
            // For example, if you know users always start registration from a dashboard:
            // router.navigate('screens/owner/dashboard');
            router.navigate('/')
            
            // Or just do nothing to prevent back navigation
            return;
          } else {
            // Normal back navigation if not coming from registration
            router.back();
          }
        } catch (error) {
          console.error("Error checking navigation state:", error);
          router.back(); // Fallback to standard behavior
        }
      } else {
        // Regular back behavior for other screens
        router.back();
      }
    }
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