import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, View, Text, TextInput, FlatList, TouchableOpacity, 
  ActivityIndicator, StatusBar, Platform, Alert, 
  Keyboard, LayoutAnimation, UIManager, Image, ScrollView, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ACCENT_COLORS = ['#e74c3c', '#2bc0d1', '#2ecc71', '#3498db', '#f1c40f'];
const PLACEHOLDER_IMAGE = 'https://images.pexels.com/photos/4056853/pexels-photo-4056853.jpeg?auto=compress&cs=tinysrgb&w=600';

const SUGGESTIONS = [
  { brand_name: 'ASPIRIN', generic_name: 'Acetylsalicylic Acid' },
  { brand_name: 'ADVIL', generic_name: 'Ibuprofen' },
  { brand_name: 'TYLENOL', generic_name: 'Acetaminophen' },
  { brand_name: 'AMOXICILLIN', generic_name: 'Antibiotic' },
  { brand_name: 'BENADRYL', generic_name: 'Diphenhydramine' },
];

export default function HomeScreen({ navigation }) {
  const theme = useTheme();
  const { t, locale } = useLanguage();
  const [query, setQuery] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [existingMeds, setExistingMeds] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [loadingSuggestion, setLoadingSuggestion] = useState(null);
  const [selectedNews, setSelectedNews] = useState(null);

  const API_KEY = "pub_79ddaa7b4de4428ea3b8e3bef2639800";

  // Merr barnat në plan
  const fetchExistingMeds = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('medication_schedules').select('drug_name').eq('user_id', user.id);
        if (data) {
          setExistingMeds(data.map(m => m.drug_name.trim().toLowerCase()));
        }
      }
    } catch (e) { console.log(e); }
  };

  useFocusEffect(useCallback(() => { fetchExistingMeds(); }, []));

  useEffect(() => { fetchNews(); }, [locale]);

  const translateDrugData = async (drug) => {
    if (locale !== 'al') return drug;
    const fields = ['indications_and_usage', 'dosage_and_administration', 'warnings', 'description'];
    let translated = { ...drug };
    for (const f of fields) {
      if (drug[f]) {
        try {
          const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=sq&dt=t&q=${encodeURIComponent(drug[f][0].substring(0, 1500))}`);
          const data = await res.json();
          translated[f] = [data[0].map(x => x[0]).join('')];
        } catch (e) { console.log(e); }
      }
    }
    return translated;
  };

  const performSearch = async (searchTerm) => {
    setLoading(true);
    try {
      const url = `https://api.fda.gov/drug/label.json?search=(openfda.brand_name:*${searchTerm}*)+OR+(openfda.generic_name:*${searchTerm}*)&limit=15`;
      const response = await fetch(url);
      const data = await response.json();
      setMedicines(data.results || []);
    } catch (e) { setMedicines([]); } finally { setLoading(false); }
  };

  const handleSuggestionPress = async (drugName, index) => {
    setLoadingSuggestion(index);
    try {
      const url = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${drugName}"&limit=1`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        let item = data.results[0];
        if (locale === 'al') item = await translateDrugData(item);
        navigation.navigate('Details', { item });
      }
    } catch (e) { Alert.alert("Gabim", "Lidhja dështoi."); }
    finally { setLoadingSuggestion(null); }
  };

  const fetchNews = async () => {
    setLoadingNews(true);
    try {
      const url = `https://newsdata.io/api/1/news?apikey=${API_KEY}&category=health&language=en`;
      const response = await fetch(url);
      const data = await response.json();
      setNews(data.results.slice(0, 10));
    } catch (e) { console.error(e); } finally { setLoadingNews(false); }
  };

  const MedicineCard = ({ brand, generic, index, isSuggestion }) => {
    const accentColor = ACCENT_COLORS[index % ACCENT_COLORS.length];
    const cleanBrandName = brand ? brand.trim().toLowerCase() : "";
    const isAlreadyInPlan = !isSuggestion && cleanBrandName !== "" && existingMeds.includes(cleanBrandName);

    return (
      <TouchableOpacity 
        style={[styles.card, { borderLeftColor: isAlreadyInPlan ? '#2ecc71' : accentColor, backgroundColor: theme.card }]} 
        onPress={async () => {
          if (isSuggestion) {
            handleSuggestionPress(brand, index);
          } else {
            let item = medicines[index];
            if (locale === 'al') item = await translateDrugData(item);
            navigation.navigate('Details', { item });
          }
        }}
      >
        <View style={styles.cardInner}>
          <View style={[styles.cardIcon, { backgroundColor: isAlreadyInPlan ? '#2ecc7115' : accentColor + '15' }]}>
            <Ionicons name={isAlreadyInPlan ? "checkmark-circle" : (isSuggestion ? "flash" : "medical")} size={24} color={isAlreadyInPlan ? "#2ecc71" : accentColor} />
          </View>
          
          <View style={styles.textContainer}>
            <View style={styles.titleRow}>
              <Text style={[styles.brandText, { color: theme.text }]} numberOfLines={1}>
                {brand || t('unknown')}
              </Text>
              {isAlreadyInPlan && (
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>{locale === 'al' ? 'Në plan' : 'In plan'}</Text>
                </View>
              )}
            </View>
            <Text style={{ color: isAlreadyInPlan ? '#2ecc71' : accentColor, fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
              {generic}
            </Text>
          </View>

          {loadingSuggestion === index && isSuggestion ? (
            <ActivityIndicator size="small" color={accentColor} />
          ) : (
            <Ionicons name="chevron-forward" size={18} color={theme.subText} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <StatusBar barStyle={theme.isDarkMode ? "light-content" : "dark-content"} />
      
      <View style={styles.header}>
        <Text style={[styles.appName, { color: theme.text }]}>MedSearch</Text>
        <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="medical-bag" size={28} color="#3498db" />
        </View>
      </View>

      <View style={styles.searchSection}>
        <View style={[styles.searchBar, { backgroundColor: theme.searchBar }]}>
          <Ionicons name="search" size={20} color={theme.subText} style={{ marginRight: 10 }} />
          <TextInput 
            style={{ flex: 1, color: theme.text, fontSize: 16 }} 
            placeholder={t('search_placeholder')}
            placeholderTextColor={theme.subText}
            value={query} 
            onChangeText={(text) => {
                setQuery(text);
                if (text.length > 1) performSearch(text);
                else setMedicines([]);
            }}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setMedicines([]); Keyboard.dismiss(); }}>
              <Ionicons name="close-circle" size={22} color={theme.subText} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={query.length > 0 ? medicines : SUGGESTIONS}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item, index }) => (
          <MedicineCard 
            brand={query.length > 0 ? item.openfda?.brand_name?.[0] : item.brand_name}
            generic={query.length > 0 ? item.openfda?.generic_name?.[0] : item.generic_name}
            index={index}
            isSuggestion={query.length === 0}
          />
        )}
        ListHeaderComponent={() => (
            <View>
              {query.length === 0 && (
                <View style={styles.newsSection}>
                  <Text style={[styles.sectionTitle, { color: theme.text, marginLeft: 20, marginBottom: 15 }]}>{t('health_news')}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.newsScroll}>
                    {news.map((n, i) => (
                      <TouchableOpacity key={i} style={[styles.newsCard, { backgroundColor: theme.card }]} onPress={() => setSelectedNews(n)}>
                        <Image source={{ uri: n.image_url || PLACEHOLDER_IMAGE }} style={styles.newsImage} />
                        <View style={styles.newsContent}>
                          <Text style={[styles.newsTitle, { color: theme.text }]} numberOfLines={2}>{n.title}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
              <Text style={[styles.sectionTitle, { color: theme.text, marginLeft: 20, marginBottom: 15 }]}>
                {query.length === 0 ? t('suggestions') : t('results')}
              </Text>
            </View>
          )}
        contentContainerStyle={{ paddingBottom: 50 }}
      />

      <Modal visible={!!selectedNews} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedNews(null)}>
                <Ionicons name="close" size={30} color={theme.text} />
            </TouchableOpacity>
          </View>
          <WebView source={{ uri: selectedNews?.link }} style={{ flex: 1 }} />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 25, marginVertical: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logoContainer: { backgroundColor: '#3498db15', padding: 10, borderRadius: 50 },
  appName: { fontSize: 32, fontWeight: 'bold' },
  searchSection: { paddingHorizontal: 20, marginBottom: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, paddingHorizontal: 15, height: 55, elevation: 2 },
  newsSection: { marginBottom: 25 },
  newsScroll: { paddingLeft: 20, paddingRight: 20 },
  sectionTitle: { fontSize: 22, fontWeight: '700' },
  newsCard: { width: 280, borderRadius: 20, marginRight: 15, overflow: 'hidden', elevation: 3 },
  newsImage: { width: '100%', height: 140 },
  newsContent: { padding: 15 },
  newsTitle: { fontSize: 15, fontWeight: 'bold' },
  card: { borderRadius: 20, marginBottom: 12, borderLeftWidth: 6, marginHorizontal: 20, elevation: 2 },
  cardInner: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  cardIcon: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  textContainer: { flex: 1, marginRight: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  brandText: { fontSize: 17, fontWeight: 'bold', flexShrink: 1 },
  planBadge: { backgroundColor: '#2ecc71', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, marginLeft: 8 },
  planBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  modalHeader: { padding: 15, borderBottomWidth: 0.5, borderBottomColor: '#ccc' }
});