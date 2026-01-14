import React, { useCallback, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, SafeAreaView, StatusBar, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const ACCENT_COLORS = ['#e74c3c', '#2bc0d1', '#2ecc71', '#3498db', '#f1c40f'];

export default function FavoritesScreen({ navigation }) {
  const theme = useTheme();
  const { t } = useLanguage();
  const [favorites, setFavorites] = useState([]);

  const fetchFavorites = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('favorites').select('*').eq('user_id', user.id);
      setFavorites(data || []);
    }
  };

  useFocusEffect(useCallback(() => { fetchFavorites(); }, []));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.isDarkMode ? "light-content" : "dark-content"} />
      
      {/* HEADER I RREGULLUAR - NJEJTE SI HOME DHE PROFILE */}
      <View style={styles.header}>
        <Text style={[styles.appName, { color: theme.text }]}>{t('favorites')}</Text>
        <View style={[styles.headerIconCircle, { backgroundColor: theme.card }]}>
          <Ionicons name="heart" size={24} color="#e74c3c" />
        </View>
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => {
          const accentColor = ACCENT_COLORS[index % ACCENT_COLORS.length];
          const drug = item.drug_data;
          return (
            <TouchableOpacity 
              style={[styles.card, { borderLeftColor: accentColor, backgroundColor: theme.card }]} 
              onPress={() => navigation.navigate('Details', { medicine: drug })}
              activeOpacity={0.7}
            >
              <View style={styles.cardInner}>
                <View style={[styles.cardIcon, { backgroundColor: accentColor + '15' }]}>
                  <Ionicons name="heart" size={24} color={accentColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.brandText, { color: theme.text }]}>
                    {drug?.openfda?.brand_name?.[0] || t('unknown')}
                  </Text>
                  <Text style={{ color: accentColor, fontSize: 13, fontWeight: '600' }}>
                    {drug?.openfda?.generic_name?.[0]}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.subText} />
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-dislike-outline" size={80} color={theme.subText} style={{ opacity: 0.3 }} />
            <Text style={[styles.emptyText, { color: theme.subText }]}>{t('empty_fav')}</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0 
  },
  header: { 
    paddingHorizontal: 25, 
    paddingTop: 20, // Distanca e njejte lart
    marginBottom: 20, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  appName: { 
    fontSize: 32, 
    fontWeight: 'bold',
    letterSpacing: -0.5
  },
  headerIconCircle: { 
    width: 45, 
    height: 45, 
    borderRadius: 22.5, 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5
  },
  listContent: { 
    paddingHorizontal: 20, 
    paddingBottom: 100 
  },
  card: { 
    borderRadius: 20, 
    marginBottom: 12, 
    borderLeftWidth: 6, 
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10
  },
  cardInner: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16 
  },
  cardIcon: { 
    width: 50, 
    height: 50, 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 15 
  },
  brandText: { 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100
  },
  emptyText: { 
    textAlign: 'center', 
    marginTop: 20,
    fontSize: 16,
    fontWeight: '500'
  }
});