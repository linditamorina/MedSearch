import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Switch, Platform, StatusBar, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export default function ProfileScreen() {
  const theme = useTheme();
  const { locale, setLocale, t } = useLanguage();
  
  const [userEmail, setUserEmail] = useState('');
  const [memberSince, setMemberSince] = useState('');
  const [favCount, setFavCount] = useState(0);

  // Funksioni për të marrë të dhënat e profilit
  const fetchProfileData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserEmail(user.email);
      
      // Formatojmë datën (p.sh. 12 Dhjetor 2023)
      const date = new Date(user.created_at);
      const formattedDate = date.toLocaleDateString(locale === 'al' ? 'sq-AL' : 'en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      setMemberSince(formattedDate);

      // Marrim numrin e favoritëve
      const { count } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      setFavCount(count || 0);
    }
  };

  // Rifresko të dhënat sa herë që përdoruesi hap faqen e profilit
  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, [locale])
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.isDarkMode ? "light-content" : "dark-content"} />
      
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>{t('profile')}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Karta e Përdoruesit */}
        <View style={[styles.userCard, { backgroundColor: theme.card }]}>
          <View style={[styles.avatarCircle, { backgroundColor: '#3498db20' }]}>
            <Ionicons name="person" size={40} color="#3498db" />
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.welcomeText, { color: theme.subText }]}>{t('welcome')}</Text>
            <Text style={[styles.emailText, { color: theme.text }]} numberOfLines={1}>
              {userEmail || 'User'}
            </Text>
            <Text style={[styles.memberText, { color: theme.subText }]}>
              {locale === 'al' ? 'Anëtar që nga:' : 'Member since:'} {memberSince}
            </Text>
          </View>
        </View>

        {/* Statistikat (Favorites Count) */}
        <View style={styles.statsContainer}>
          <View style={[styles.statBox, { backgroundColor: theme.card }]}>
            <Ionicons name="heart" size={24} color="#e74c3c" />
            <Text style={[styles.statNumber, { color: theme.text }]}>{favCount}</Text>
            <Text style={[styles.statLabel, { color: theme.subText }]}>{t('favorites')}</Text>
          </View>
          
          <View style={[styles.statBox, { backgroundColor: theme.card }]}>
            <Ionicons name="shield-checkmark" size={24} color="#2ecc71" />
            <Text style={[styles.statNumber, { color: theme.text }]}>v1.0</Text>
            <Text style={[styles.statLabel, { color: theme.subText }]}>Status</Text>
          </View>
        </View>

        <View style={styles.section}>
          {/* Opsioni i Gjuhës */}
          <TouchableOpacity 
            style={[styles.row, { backgroundColor: theme.card, marginBottom: 15 }]} 
            onPress={() => setLocale(locale === 'al' ? 'en' : 'al')}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#3498db15' }]}>
                <Ionicons name="language" size={22} color="#3498db" />
              </View>
              <Text style={[styles.rowText, { color: theme.text }]}>
                {t('language')}: {locale === 'al' ? 'Shqip' : 'English'}
              </Text>
            </View>
            <Ionicons name="swap-horizontal" size={20} color={theme.subText} />
          </TouchableOpacity>

          {/* Opsioni i Dark Mode */}
          <View style={[styles.row, { backgroundColor: theme.card, marginBottom: 15 }]}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#f1c40f15' }]}>
                <Ionicons name={theme.isDarkMode ? "moon" : "sunny"} size={22} color="#f1c40f" />
              </View>
              <Text style={[styles.rowText, { color: theme.text }]}>{t('dark_mode')}</Text>
            </View>
            <Switch 
              value={theme.isDarkMode} 
              onValueChange={theme.toggleTheme} 
              trackColor={{ false: "#767577", true: "#3498db" }} 
            />
          </View>

          {/* Butoni i Log Out */}
          <TouchableOpacity 
            style={[styles.row, { backgroundColor: theme.card, marginTop: 10 }]} 
            onPress={() => supabase.auth.signOut()}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#e74c3c15' }]}>
                <Ionicons name="log-out-outline" size={22} color="#e74c3c" />
              </View>
              <Text style={[styles.rowText, { color: "#e74c3c" }]}>{t('logout')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.subText} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0 },
  header: { paddingHorizontal: 25, paddingTop: 20 },
  title: { fontSize: 32, fontWeight: 'bold' },
  
  userCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginHorizontal: 20, 
    marginVertical: 20, 
    padding: 20, 
    borderRadius: 25, 
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  avatarCircle: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  userInfo: { flex: 1 },
  welcomeText: { fontSize: 14, fontWeight: '500' },
  emailText: { fontSize: 18, fontWeight: 'bold', marginBottom: 2 },
  memberText: { fontSize: 12, opacity: 0.8 },

  statsContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    marginBottom: 25 
  },
  statBox: { 
    width: '48%', 
    padding: 15, 
    borderRadius: 20, 
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  statNumber: { fontSize: 20, fontWeight: 'bold', marginTop: 5 },
  statLabel: { fontSize: 12, fontWeight: '600', marginTop: 2 },

  section: { paddingHorizontal: 20, paddingBottom: 40 },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 15, 
    borderRadius: 18, 
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  rowText: { fontSize: 16, fontWeight: '600' }
});