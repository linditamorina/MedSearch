import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, SafeAreaView, TouchableOpacity, StatusBar, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const ExpandableText = ({ text, theme }) => {
  const [expanded, setExpanded] = useState(false);
  const { t } = useLanguage();
  if (!text) return null;
  const shouldTruncate = text.length > 150;
  return (
    <View>
      <Text style={{ color: theme.text, fontSize: 15, lineHeight: 24 }}>
        {expanded || !shouldTruncate ? text : `${text.substring(0, 150)}...`}
      </Text>
      {shouldTruncate && (
        <TouchableOpacity onPress={() => setExpanded(!expanded)} style={{ marginTop: 8 }}>
          <Text style={{ color: '#3498db', fontWeight: 'bold' }}>{expanded ? t('read_less') : t('read_more')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default function DetailsScreen({ route, navigation }) {
  const { medicine } = route.params;
  const theme = useTheme();
  const { t, locale } = useLanguage();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loadingFav, setLoadingFav] = useState(true);

  // State për përkthimet automatike
  const [translatedData, setTranslatedData] = useState({});
  const [isAutoTranslating, setIsAutoTranslating] = useState(false);

  const drugName = medicine?.openfda?.brand_name?.[0] || t('unknown');

  useEffect(() => { 
    checkIfFavorite(); 
    handleAutoTranslation(); // Thirret sa herë që hapet faqja ose ndryshon locale
  }, [drugName, locale]);

  const checkIfFavorite = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from('favorites').select('id').eq('user_id', user.id)
      .contains('drug_data', { openfda: { brand_name: [drugName] } }).maybeSingle();
    setIsFavorite(!!data);
    setLoadingFav(false);
  };

  const toggleFavorite = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (isFavorite) {
      await supabase.from('favorites').delete().eq('user_id', user.id)
        .contains('drug_data', { openfda: { brand_name: [drugName] } });
      setIsFavorite(false);
    } else {
      await supabase.from('favorites').insert([{ user_id: user.id, drug_data: medicine }]);
      setIsFavorite(true);
    }
  };

  // Funksioni që përkthen gjithçka automatikisht
  const handleAutoTranslation = async () => {
    if (locale !== 'al') {
      setTranslatedData({}); // Ktheje në origjinal nëse gjuha është English
      return;
    }

    setIsAutoTranslating(true);
    
    const sectionsToTranslate = {
      indications: medicine?.indications_and_usage?.[0],
      dosage: medicine?.dosage_and_administration?.[0],
      warnings: medicine?.warnings?.[0],
      side_effects: medicine?.adverse_reactions?.[0]
    };

    const newTranslations = {};

    try {
      // Përkthejmë secilin seksion që ka përmbajtje
      for (const [key, text] of Object.entries(sectionsToTranslate)) {
        if (text) {
          const response = await fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=sq&dt=t&q=${encodeURIComponent(text)}`
          );
          const data = await response.json();
          newTranslations[key] = data[0].map((item) => item[0]).join("");
        }
      }
      setTranslatedData(newTranslations);
    } catch (error) {
      console.error("Auto-translation error:", error);
    } finally {
      setIsAutoTranslating(false);
    }
  };

  const DetailSection = ({ title, content, color, sectionKey }) => {
    const finalContent = translatedData[sectionKey] || content;
    if (!finalContent) return null;

    return (
      <View style={[styles.infoBox, { backgroundColor: theme.card, borderLeftColor: color, borderLeftWidth: 5 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: color, fontWeight: 'bold', marginBottom: 10, fontSize: 16, textTransform: 'uppercase' }}>{title}</Text>
          {isAutoTranslating && <ActivityIndicator size="small" color={color} />}
        </View>
        <ExpandableText text={finalContent.replace(/\n/g, ' ')} theme={theme} />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.isDarkMode ? "light-content" : "dark-content"} />
      <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0 }}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.btn, { backgroundColor: theme.card }]}><Ionicons name="chevron-back" size={24} color={theme.text} /></TouchableOpacity>
          <Text style={[styles.navTitle, { color: theme.text }]}>{t('details')}</Text>
          <TouchableOpacity onPress={toggleFavorite} style={[styles.btn, { backgroundColor: theme.card }]}>
            {loadingFav ? <ActivityIndicator size="small" color="#3498db" /> : 
            <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={24} color={isFavorite ? "#e74c3c" : theme.text} />}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View style={[styles.hero, { backgroundColor: theme.card }]}>
            <View style={styles.iconCircle}><Ionicons name="medical" size={40} color="#3498db" /></View>
            <Text style={[styles.title, { color: theme.text }]}>{drugName}</Text>
            <Text style={{ color: theme.subText }}>{medicine?.openfda?.generic_name?.[0]}</Text>
          </View>
          
          <DetailSection sectionKey="indications" title={t('indications')} content={medicine?.indications_and_usage?.[0]} color="#3498db" />
          <DetailSection sectionKey="dosage" title={t('dosage')} content={medicine?.dosage_and_administration?.[0]} color="#2ecc71" />
          <DetailSection sectionKey="warnings" title={t('warnings')} content={medicine?.warnings?.[0]} color="#f1c40f" />
          <DetailSection sectionKey="side_effects" title={t('side_effects')} content={medicine?.adverse_reactions?.[0]} color="#e67e22" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10 },
  btn: { width: 45, height: 45, borderRadius: 15, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  navTitle: { fontSize: 18, fontWeight: 'bold' },
  hero: { padding: 30, borderRadius: 30, alignItems: 'center', marginBottom: 20, elevation: 3 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#3498db15', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center' },
  infoBox: { padding: 20, borderRadius: 20, marginBottom: 15, elevation: 2 }
});