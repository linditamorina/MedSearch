import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Gabim', error.message);
    setLoading(false);
  }

  async function signUp() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) Alert.alert('Sukses', 'Kontrolloni email-in për konfirmim!');
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>MedSearch</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Fjalëkalimi"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity style={styles.button} onPress={signIn} disabled={loading}>
          <Text style={styles.buttonText}>Identifikohu</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#2ecc71' }]} onPress={signUp} disabled={loading}>
          <Text style={styles.buttonText}>Regjistruhu</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fc', justifyContent: 'center' },
  content: { padding: 30 },
  title: { fontSize: 40, fontWeight: 'bold', textAlign: 'center', marginBottom: 40, color: '#1a1a1a' },
  input: { height: 55, backgroundColor: '#fff', borderRadius: 15, paddingHorizontal: 15, marginBottom: 15, fontSize: 16, elevation: 2 },
  button: { backgroundColor: '#3498db', height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});