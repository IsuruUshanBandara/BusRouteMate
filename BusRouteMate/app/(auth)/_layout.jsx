import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Appbar, Text } from 'react-native-paper';
import { Slot, useRouter } from 'expo-router';

const Authlayout = () => {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appBarHeader}>
        <Appbar.BackAction onPress={() => router.back()} />
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>Bus Route Mate</Text>
        </View>
      </Appbar.Header>
      <Slot />
    </View>
  )
}

export default Authlayout

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appBarHeader: {
    elevation: 4,
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 48, // Compensates for the back button to keep title centered
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976d2',
    letterSpacing: 0.5,
  },
})