import React,{useState} from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { TextInput,IconButton,Button } from 'react-native-paper'

const SLTBSignin = () => {
    const[password,setPassword] = useState('');
    const[showPassword,setShowPassword] = useState(false);
    const handleSignin = () => {
        console.log(password);
    };
  return (
    <View style={styles.container}>
      <TextInput 
        style={styles.input}
        label="Password"
        value={password}
        onChangeText={text => setPassword(text)}
        mode='outlined'
        secureTextEntry={!showPassword}//if showPassword is false, secureTextEntry is true
        right={
            <TextInput.Icon 
                icon={showPassword ? 'eye-off' : 'eye'} 
                onPress={() => setShowPassword(!showPassword)} 
            />
        }
        
      />

        <Button mode='contained' style={styles.signInButton} onPress={handleSignin}>Sign In</Button>
    </View>
  )
}

export default SLTBSignin

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: '3%',
    },
    input: {
        // marginBottom: '9%',
    },
    signInButton: {
        marginTop: '10%',
        paddingVertical: '1%',
        width: '50%',
        alignSelf: 'center',
        borderRadius:'none',
      },
})
