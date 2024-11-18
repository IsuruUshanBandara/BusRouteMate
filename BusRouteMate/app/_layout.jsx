import React from 'react'
import { StatusBar } from 'expo-status-bar';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { Slot } from 'expo-router';
const AppLayout = () => {
 
  return (
    <I18nextProvider i18n={i18n}>
      <StatusBar style="auto" />
    <Slot />
    </I18nextProvider>
) 
  
}

export default AppLayout