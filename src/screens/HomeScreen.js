import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, View, Text, TextInput, FlatList, TouchableOpacity, 
  SafeAreaView, ActivityIndicator, StatusBar, Platform, Alert, 
  Keyboard, LayoutAnimation, UIManager, Image, ScrollView, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ACCENT_COLORS = ['#e74c3c', '#2bc0d1', '#2ecc71', '#3498db', '#f1c40f'];
// Imazhi që do të shfaqet kur lajmi nuk ka foto
// const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1505751172107-573225a9627e?q=80&w=500&auto=format&fit=crop';
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
  const [loading, setLoading] = useState(false);
  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [loadingSuggestion, setLoadingSuggestion] = useState(null);
  const [selectedNews, setSelectedNews] = useState(null);

  const API_KEY = "pub_79ddaa7b4de4428ea3b8e3bef2639800";

  useEffect(() => { fetchNews(); }, [locale]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim().length >= 1) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        performSearch(query.trim().toLowerCase());
      } else {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setMedicines([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const fetchNews = async () => {
    setLoadingNews(true);
    try {
      const url = `https://newsdata.io/api/1/news?apikey=${API_KEY}&category=health&language=en`;
      const response = await fetch(url);
      const data = await response.json();
      let articles = data.results.slice(0, 10);

      if (locale === 'al') {
        const translatedArticles = await Promise.all(articles.map(async (art) => {
          try {
            const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=sq&dt=t&q=${encodeURIComponent(art.title)}`);
            const transData = await res.json();
            return { ...art, title: transData[0][0][0] };
          } catch { return art; }
        }));
        setNews(translatedArticles);
      } else {
        setNews(articles);
      }
    } catch (e) { console.error(e); } finally { setLoadingNews(false); }
  };

  const handleNewsReload = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    const shuffledNews = [...news].sort(() => Math.random() - 0.5);
    setNews(shuffledNews);
    fetchNews();
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
        navigation.navigate('Details', { medicine: data.results[0] });
      }
    } catch (e) { Alert.alert("Gabim", "Lidhja dështoi."); }
    finally { setLoadingSuggestion(null); }
  };

  const MedicineCard = ({ brand, generic, index, isSuggestion }) => {
    const accentColor = ACCENT_COLORS[index % ACCENT_COLORS.length];
    const isLoadingThis = loadingSuggestion === index && isSuggestion;

    return (
      <TouchableOpacity 
        style={[styles.card, { borderLeftColor: accentColor, backgroundColor: theme.card }]} 
        onPress={() => isSuggestion ? handleSuggestionPress(brand, index) : navigation.navigate('Details', { medicine: medicines[index] })}
        disabled={loadingSuggestion !== null}
      >
        <View style={styles.cardInner}>
          <View style={[styles.cardIcon, { backgroundColor: accentColor + '15' }]}>
            <Ionicons name={isSuggestion ? "sparkles" : "medical"} size={24} color={accentColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.brandText, { color: theme.text }]}>{brand || t('unknown')}</Text>
            <Text style={{ color: accentColor, fontSize: 13, fontWeight: '600' }}>{generic}</Text>
          </View>
          {isLoadingThis ? <ActivityIndicator size="small" color={accentColor} /> : <Ionicons name="chevron-forward" size={18} color={theme.subText} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.isDarkMode ? "light-content" : "dark-content"} />
      
      <View style={styles.header}>
        <Text style={[styles.appName, { color: theme.text }]}>MedSearch</Text>
      </View>

      <View style={styles.searchSection}>
        <View style={[styles.searchBar, { backgroundColor: theme.searchBar }]}>
          <Ionicons name="search" size={20} color={theme.subText} style={{ marginRight: 10 }} />
          <TextInput 
            style={{ flex: 1, color: theme.text, fontSize: 16 }} 
            placeholder={t('search_placeholder')}
            placeholderTextColor={theme.subText}
            value={query} 
            onChangeText={setQuery}
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
        ListHeaderComponent={() => (
          <View>
            {query.length === 0 && (
              <View style={styles.newsSection}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    {t('health_news')}
                  </Text>
                  <TouchableOpacity onPress={handleNewsReload} disabled={loadingNews}>
                    {loadingNews ? (
                      <ActivityIndicator size="small" color="#3498db" />
                    ) : (
                      <Ionicons name="refresh-circle" size={30} color="#3498db" />
                    )}
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.newsScroll}>
                  {news.map((item, index) => {
                    const validImage = item.image_url && item.image_url.startsWith('http');
                    return (
                      <TouchableOpacity key={index} style={[styles.newsCard, { backgroundColor: theme.card }]} onPress={() => setSelectedNews(item)}>
                        <Image 
                          source={{ uri: validImage ? item.image_url : PLACEHOLDER_IMAGE }} 
                          style={styles.newsImage} 
                          resizeMode="cover"
                        />
                        <View style={styles.newsContent}>
                          <Text style={[styles.newsTitle, { color: theme.text }]} numberOfLines={2}>{item.title}</Text>
                          <Text style={styles.newsSource}>{item.source_id?.toUpperCase()}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
            <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 15 }]}>
              {query.length === 0 ? t('suggestions') : t('results')}
            </Text>
          </View>
        )}
        renderItem={({ item, index }) => (
          <MedicineCard 
            brand={query.length > 0 ? item.openfda?.brand_name?.[0] : item.brand_name}
            generic={query.length > 0 ? item.openfda?.generic_name?.[0] : item.generic_name}
            index={index}
            isSuggestion={query.length === 0}
          />
        )}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
      />

      <Modal visible={!!selectedNews} animationType="slide" onRequestClose={() => setSelectedNews(null)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedNews(null)} style={styles.closeModalBtn}>
              <Ionicons name="close" size={28} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.modalHeaderTitle, { color: theme.text }]} numberOfLines={1}>
              {selectedNews?.source_id?.toUpperCase()}
            </Text>
          </View>
          <WebView source={{ uri: selectedNews?.link }} style={{ flex: 1 }} startInLoadingState />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0 },
  header: { paddingHorizontal: 20, marginBottom: 10 },
  appName: { fontSize: 34, fontWeight: 'bold' },
  searchSection: { paddingHorizontal: 20, marginBottom: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, paddingHorizontal: 15, height: 55, elevation: 3 },
  newsSection: { marginBottom: 25 },
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: 15,
    paddingRight: 5
  },
  newsScroll: { paddingRight: 20, paddingBottom: 15 },
  sectionTitle: { fontSize: 22, fontWeight: '700' },
  newsCard: { 
    width: 280, borderRadius: 20, marginRight: 15, elevation: 5, 
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.15, shadowRadius: 6, overflow: Platform.OS === 'ios' ? 'visible' : 'hidden' 
  },
  newsImage: { width: '100%', height: 140, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  newsContent: { padding: 15, minHeight: 95, justifyContent: 'space-between' },
  newsTitle: { fontSize: 15, fontWeight: 'bold', lineHeight: 20 },
  newsSource: { fontSize: 11, color: '#3498db', marginTop: 8, fontWeight: '700' },
  card: { borderRadius: 20, marginBottom: 12, borderLeftWidth: 6, elevation: 4 },
  cardInner: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  cardIcon: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  brandText: { fontSize: 18, fontWeight: 'bold' },
  modalHeader: { height: 60, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, borderBottomWidth: 0.5, borderBottomColor: '#ccc' },
  closeModalBtn: { marginRight: 15 },
  modalHeaderTitle: { fontSize: 16, fontWeight: 'bold', flex: 1 }
});