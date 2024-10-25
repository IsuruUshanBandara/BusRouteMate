import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Appbar } from 'react-native-paper';
import { Slot,useRouter } from 'expo-router';

const Authlayout = () => {
const router = useRouter();
  return (
    <View style={Styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content style={Styles.appbartitle} title="Bus Route Mate" />
      </Appbar.Header>
      <Slot />
    </View>
  )
}

export default Authlayout

const Styles = StyleSheet.create({
  container: {
    flex: 1,
    
  },
  appbartitle: {
    alignItems: 'center'
  },
})