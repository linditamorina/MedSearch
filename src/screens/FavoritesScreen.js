import React, { useState, useCallback } from 'react';
import { 
  StyleSheet, View, Text, FlatList, TouchableOpacity, 
  StatusBar, ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';

const ACCENT_COLORS = ['#e74c3c', '#2bc0d1', '#2ecc71', '#3498db', '#f1c40f'];

export default function FavoriteScreen({ navigation }) {
  const theme = useTheme();
  const { t, locale } = useLanguage();
  const [favorites, setFavorites] = useState([]);
  const [existingMeds, setExistingMeds] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: favData } = await supabase.from('favorites').select('*').eq('user_id', user.id);
        const { data: planData } = await supabase.from('medication_schedules').select('drug_name').eq('user_id', user.id);

        setFavorites(favData || []);
        if (planData) {
          setExistingMeds(planData.map(m => m.drug_name.trim().toLowerCase()));
        }
      }
    } catch (e) { console.log(e); } finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const renderItem = ({ item, index }) => {
    const accentColor = ACCENT_COLORS[index % ACCENT_COLORS.length];
    const drugData = item.drug_data;
    const brandName = drugData.openfda?.brand_name?.[0] || t('unknown');
    const genericName = drugData.openfda?.generic_name?.[0] || "";
    const isAlreadyInPlan = existingMeds.includes(brandName.trim().toLowerCase());

    return (
      <TouchableOpacity 
        style={[styles.card, { borderLeftColor: isAlreadyInPlan ? '#2ecc71' : accentColor, backgroundColor: theme.card }]}
        onPress={() => navigation.navigate('Details', { item: drugData })}
      >
        <View style={styles.cardInner}>
          <View style={[styles.cardIcon, { backgroundColor: accentColor + '15' }]}>
            <Ionicons name="heart" size={24} color={accentColor} />
          </View>

          <View style={styles.textContainer}>
            <View style={styles.titleRow}>
              <Text style={[styles.brandText, { color: theme.text }]} numberOfLines={1}>
                {brandName}
              </Text>
              {isAlreadyInPlan && (
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>{locale === 'al' ? 'Në plan' : 'In plan'}</Text>
                </View>
              )}
            </View>
            <Text style={{ color: theme.subText, fontSize: 13 }} numberOfLines={1}>
              {genericName}
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={18} color={theme.subText} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <StatusBar barStyle={theme.isDarkMode ? "light-content" : "dark-content"} />
      
      {/* HEADER I RREGULLUAR ME IKONË */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>{t('favorites')}</Text>
        <View style={styles.logoContainer}>
            <Ionicons name="heart" size={28} color="#e74c3c" />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      ) : favorites.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="heart-outline" size={60} color={theme.subText} />
          <Text style={[styles.emptyText, { color: theme.subText }]}>{t('no_favorites')}</Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    paddingHorizontal: 25, 
    marginVertical: 15, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  logoContainer: { 
    backgroundColor: '#e74c3c15', 
    padding: 10, 
    borderRadius: 50 
  },
  title: { fontSize: 32, fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  emptyText: { marginTop: 15, fontSize: 16 },
  card: { borderRadius: 20, marginBottom: 12, borderLeftWidth: 6, elevation: 2 },
  cardInner: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  cardIcon: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  textContainer: { flex: 1, marginRight: 5, justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  brandText: { fontSize: 17, fontWeight: 'bold', flexShrink: 1 },
  planBadge: { 
    backgroundColor: '#2ecc71', 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 6, 
    marginLeft: 8,
    justifyContent: 'center'
  },
  planBadgeText: { color: 'white', fontSize: 9, fontWeight: 'bold' }
});