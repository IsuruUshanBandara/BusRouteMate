import React,{useState} from 'react'
import { View, Text,StyleSheet,TouchableOpacity } from 'react-native'
import { TextInput,IconButton,Button } from 'react-native-paper'

const PrivateBusSignin = () => {
    const[phoneNumber,setPhoneNumber] = useState('');
    const[password,setPassword] = useState('');
    const[showPassword,setShowPassword] = useState(false);
    const handleSignin = () => {
        console.log(password);
        console.log(phoneNumber);
    };
  return (
    <View style={styles.container}>
        <View style={styles.subHeadingContainer}>
            <Text style={styles.subHeading}>Sign in</Text>
        </View>
        <View style={styles.inputContainer}>
        <TextInput 
            style={styles.input}
            label="Phone Number"
            value={phoneNumber}
            onChangeText={text => setPhoneNumber(text)}
            mode='outlined'
            keyboardType='phone-pad'
            />

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
             <TouchableOpacity onPress={() => console.log("Forgot Password? Pressed")}>
                    <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>
            <Button mode='contained' style={styles.signInButton} onPress={handleSignin}>Sign In</Button>
            <Button mode='contained' style={styles.createAccountButton} onPress={()=>console.log("Create Account Pressend")}>Create Account</Button>
        </View>
    </View>
  )
}

export default PrivateBusSignin
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: '3%',
    },
    subHeadingContainer: {
        flex:0.2,// Pushes the subheading towards the top
        justifyContent: 'flex-end',// Aligns subheading to the bottom of this container
    },
    subHeading: {
        fontSize: 20, // Fnt size of the subheading
        textAlign: 'center',
      },
    inputContainer: {
        flex: 1,// Center the input and button
        justifyContent: 'center',// Vertically centers the content
    },
    input: {
        marginVertical: '2%',
    },
    forgotPassword: {
        textAlign: 'right',
        marginTop: 4,
        marginBottom: 20,
        color: '#007AFF', // Blue color for "Forgot Password?"
    },
    signInButton: {
        marginTop: '10%',
        // paddingVertical: '1%',
        width: '50%',
        alignSelf: 'center',
      },
      createAccountButton: {
        width: '50%',
        alignSelf: 'center',
        marginTop: '5%',
    },
})