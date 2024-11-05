import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Appbar } from 'react-native-paper';
import { Slot,useRouter } from 'expo-router';

const NormalScreenlayout = () => {
const router = useRouter();
const handleLogout = () => {
  router.push('/');
  console.log("Logout pressed");
  // For example, you might want to navigate to the login screen:
  // router.replace('/path/to/login'); 
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
        <Appbar.BackAction onPress={() => router.back()} />
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