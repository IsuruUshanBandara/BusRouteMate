import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Appbar } from 'react-native-paper';
import { Slot,useRouter } from 'expo-router';

const NormalScreenlayout = () => {
const router = useRouter();
  return (
    <View style={Styles.container}>
      <Appbar.Header style={Styles.appBarHeader}>
        <Appbar.BackAction onPress={() => router.back()} />
        
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
  appbartitle: {
    alignItems: 'center'
  },
  
})