import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export default function LoginScreen({ navigation }) {
  const theme = useTheme();
  const { locale, setLocale } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin() {
    if (!email || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert("Error", error.message);
    setLoading(false);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.isDarkMode ? "light-content" : "dark-content"} />
      <View style={styles.topActions}>
        <TouchableOpacity onPress={() => setLocale(locale === 'al' ? 'en' : 'al')} style={[styles.iconBtn, { backgroundColor: theme.card }]}>
          <Text style={{ color: theme.text, fontWeight: 'bold' }}>{locale.toUpperCase()}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={theme.toggleTheme} style={[styles.iconBtn, { backgroundColor: theme.card }]}>
          <Ionicons name={theme.isDarkMode ? "sunny" : "moon"} size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.headerSection}>
          <View style={[styles.logoCircle, { backgroundColor: '#3498db' }]}><Ionicons name="medical" size={45} color="white" /></View>
          <Text style={[styles.title, { color: theme.text }]}>MedSearch</Text>
        </View>

        <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
          <Ionicons name="mail-outline" size={20} color={theme.subText} />
          <TextInput style={[styles.input, { color: theme.text }]} placeholder="Email" placeholderTextColor={theme.subText} value={email} onChangeText={setEmail} autoCapitalize="none" />
        </View>

        <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
          <Ionicons name="lock-closed-outline" size={20} color={theme.subText} />
          <TextInput style={[styles.input, { color: theme.text }]} placeholder="Password" placeholderTextColor={theme.subText} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={theme.subText} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.mainBtn, { backgroundColor: '#3498db' }]} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.mainBtnText}>Login</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.footerLink}>
          <Text style={{ color: theme.subText, fontSize: 16 }}>
            {locale === 'al' ? 'Nuk keni llogari? ' : "Don't have an account? "}
            <Text style={{ color: '#3498db', fontWeight: 'bold' }}>Register</Text>
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
  logoCircle: { width: 85, height: 85, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 15, elevation: 5 },
  title: { fontSize: 32, fontWeight: 'bold' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, marginBottom: 15, paddingHorizontal: 18, height: 65 },
  input: { flex: 1, fontSize: 16, marginLeft: 12 },
  mainBtn: { height: 65, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginTop: 10, elevation: 4 },
  mainBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  footerLink: { marginTop: 30, alignItems: 'center' }
});