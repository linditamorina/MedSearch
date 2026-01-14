import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export default function RegisterScreen({ navigation }) {
  const theme = useTheme();
  const { locale } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!email || !password) {
      Alert.alert(locale === 'al' ? "Kujdes" : "Wait", locale === 'al' ? "Plotësoni fushat" : "Fill fields");
      return;
    }
    
    setLoading(true);
    
    // RREGULLIMI KRYESOR: shtojmë opsionin shouldCreateSession: false
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        shouldCreateSession: false, 
      },
    });

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      // Tani, meqenëse nuk u krijua sesioni, App.js nuk do të ndryshojë faqen vetë.
      // Mesazhi i suksesit do të shfaqet dhe 'navigation.navigate' do të punojë.
      Alert.alert(
        locale === 'al' ? "Sukses" : "Success",
        locale === 'al' ? "Llogaria u krijua! Tani mund të hyni." : "Account created! You can now login.",
        [{ 
          text: "OK", 
          onPress: () => navigation.navigate('Login') // Kjo do të funksionojë tani
        }]
      );
    }
    setLoading(false);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.isDarkMode ? "light-content" : "dark-content"} />
      
      <View style={styles.topActions}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.iconBtn, { backgroundColor: theme.card }]}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={theme.toggleTheme} style={[styles.iconBtn, { backgroundColor: theme.card }]}>
          <Ionicons name={theme.isDarkMode ? "sunny" : "moon"} size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.headerSection}>
          <Text style={[styles.title, { color: theme.text }]}>
            {locale === 'al' ? 'Krijo Llogari' : 'Create Account'}
          </Text>
        </View>

        <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
          <Ionicons name="mail-outline" size={20} color={theme.subText} />
          <TextInput 
            style={[styles.input, { color: theme.text }]} 
            placeholder="Email" 
            placeholderTextColor={theme.subText} 
            value={email} 
            onChangeText={setEmail} 
            autoCapitalize="none" 
          />
        </View>

        <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
          <Ionicons name="lock-closed-outline" size={20} color={theme.subText} />
          <TextInput 
            style={[styles.input, { color: theme.text }]} 
            placeholder="Password" 
            placeholderTextColor={theme.subText} 
            value={password} 
            onChangeText={setPassword} 
            secureTextEntry 
          />
        </View>

        <TouchableOpacity 
          style={[styles.mainBtn, { backgroundColor: '#2ecc71' }]} 
          onPress={handleRegister} 
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.mainBtnText}>Register</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.footerLink}>
          <Text style={{ color: theme.subText, fontSize: 16 }}>
            {locale === 'al' ? 'Keni llogari? ' : "Already have an account? "}
            <Text style={{ color: '#2ecc71', fontWeight: 'bold' }}>Login</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topActions: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 45 : 10 },
  iconBtn: { width: 45, height: 45, borderRadius: 15, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  content: { flex: 1, paddingHorizontal: 30, justifyContent: 'center' },
  headerSection: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 32, fontWeight: 'bold' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, marginBottom: 15, paddingHorizontal: 18, height: 65 },
  input: { flex: 1, fontSize: 16, marginLeft: 12 },
  mainBtn: { height: 65, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginTop: 10, elevation: 4 },
  mainBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  footerLink: { marginTop: 30, alignItems: 'center' }
});