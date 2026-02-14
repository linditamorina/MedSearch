import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, View, Text, ScrollView, TouchableOpacity, StatusBar, Alert, Platform, ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';

const DAYS_CONFIG = {
  al: [
    { id: 'Mon', label: 'H' }, { id: 'Tue', label: 'M' }, { id: 'Wed', label: 'M' },
    { id: 'Thu', label: 'E' }, { id: 'Fri', label: 'P' }, { id: 'Sat', label: 'S' }, { id: 'Sun', label: 'D' }
  ],
  en: [
    { id: 'Mon', label: 'M' }, { id: 'Tue', label: 'T' }, { id: 'Wed', label: 'W' },
    { id: 'Thu', label: 'T' }, { id: 'Fri', label: 'F' }, { id: 'Sat', label: 'S' }, { id: 'Sun', label: 'S' }
  ]
};

export default function DetailsScreen({ route, navigation }) {
  const item = route.params?.item || route.params?.medicine; 
  const theme = useTheme();
  const { locale, t } = useLanguage();
  
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAlreadyInPlan, setIsAlreadyInPlan] = useState(false); 
  const [showPicker, setShowPicker] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [selectedDays, setSelectedDays] = useState([]);
  const [loading, setLoading] = useState(true);

  const drugName = item?.openfda?.brand_name?.[0] || item?.brand_name || "Bari";

  useEffect(() => {
    if (item) checkInitialStatus();
  }, [item]);

  const checkInitialStatus = async () => {
    setLoading(true);
    await Promise.all([checkIfFavorite(), checkIfInPlan()]);
    setLoading(false);
  };

  const checkIfFavorite = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const currentId = item.set_id || item.id;
      const { data } = await supabase.from('favorites').select('*')
        .eq('user_id', user.id).filter('drug_data->>id', 'eq', currentId).maybeSingle();
      if (data) setIsFavorite(true);
    } catch (e) { console.log(e); }
  };

  const checkIfInPlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('medication_schedules')
        .select('id').eq('user_id', user.id).eq('drug_name', drugName).maybeSingle();
      if (data) setIsAlreadyInPlan(true);
    } catch (e) { console.log(e); }
  };

  const toggleFavorite = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Alert.alert(t('error'), t('please_login'));
    const currentId = item.set_id || item.id;
    if (isFavorite) {
      await supabase.from('favorites').delete().eq('user_id', user.id).filter('drug_data->>id', 'eq', currentId);
      setIsFavorite(false);
    } else {
      await supabase.from('favorites').insert([{ user_id: user.id, drug_data: { ...item, id: currentId } }]);
      setIsFavorite(true);
    }
  };

  const onTimeChange = async (event, selectedDate) => {
    setShowPicker(Platform.OS === 'ios');
    if (event.type === 'set' && selectedDate) {
      const { data: { user } } = await supabase.auth.getUser();
      const hours = String(selectedDate.getHours()).padStart(2, '0');
      const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;

      const { error } = await supabase.from('medication_schedules').insert([{
        user_id: user.id, drug_name: drugName, scheduled_time: timeStr, days: selectedDays
      }]);

      if (!error) {
        setIsAlreadyInPlan(true);
        Alert.alert(t('success'), `${t('plan_saved')}: ${timeStr}`);
      } else {
        Alert.alert("Error", error.message);
      }
    }
  };

  const renderInfoSection = (title, content, sectionKey) => {
    if (!content) return null;
    const shouldShowReadMore = content.length > 150;
    const isExpanded = expandedSections[sectionKey];

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
        <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.infoText, { color: theme.text }]} numberOfLines={shouldShowReadMore && !isExpanded ? 4 : 0}>
            {content}
          </Text>
          {shouldShowReadMore && (
            <TouchableOpacity onPress={() => setExpandedSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }))} style={styles.readMoreBtn}>
              <Text style={{ color: '#3498db', fontWeight: 'bold', marginTop: 8 }}>{isExpanded ? t('read_less') : t('read_more')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) return <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center' }]}><ActivityIndicator size="large" color="#3498db" /></View>;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <StatusBar barStyle={theme.isDarkMode ? "light-content" : "dark-content"} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={28} color={theme.text} /></TouchableOpacity>
        <TouchableOpacity onPress={toggleFavorite}><Ionicons name={isFavorite ? "heart" : "heart-outline"} size={28} color={isFavorite ? "#e74c3c" : theme.text} /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroSection}>
          <View style={[styles.iconBox, { backgroundColor: isAlreadyInPlan ? '#2ecc7120' : '#3498db20' }]}>
            <Ionicons name={isAlreadyInPlan ? "checkmark-circle" : "medical"} size={45} color={isAlreadyInPlan ? "#2ecc71" : "#3498db"} />
          </View>
          <Text style={[styles.mainTitle, { color: theme.text }]}>{drugName}</Text>
          <Text style={[styles.subTitle, { color: theme.subText }]}>{item?.openfda?.generic_name?.[0] || item?.generic_name}</Text>
        </View>

        {!isAlreadyInPlan ? (
          <>
            <View style={styles.daysContainer}>
              <Text style={[styles.daysLabel, { color: theme.text }]}>{t('select_days')}</Text>
              <View style={styles.daysRow}>
                {(DAYS_CONFIG[locale] || DAYS_CONFIG.en).map(day => (
                  <TouchableOpacity 
                    key={day.id} 
                    onPress={() => setSelectedDays(prev => prev.includes(day.id) ? prev.filter(d => d !== day.id) : [...prev, day.id])}
                    style={[styles.dayChip, { backgroundColor: selectedDays.includes(day.id) ? '#3498db' : theme.card, borderColor: '#3498db30', borderWidth: 1 }]}
                  >
                    <Text style={[styles.dayText, { color: selectedDays.includes(day.id) ? 'white' : theme.text }]}>{day.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity style={[styles.reminderBtn, { opacity: selectedDays.length === 0 ? 0.6 : 1 }]} onPress={() => selectedDays.length > 0 ? setShowPicker(true) : Alert.alert(t('caution'), t('select_days_error'))}>
              <Ionicons name="alarm-outline" size={22} color="white" /><Text style={styles.reminderBtnText}>{t('set_schedule')}</Text>
            </TouchableOpacity>
          </>
        ) : (
          /* SHFAQET VETËM NJOFTIMI, PA BUTON NAVIGIMI */
          <View style={styles.alreadyInPlanContainer}>
            <View style={styles.infoBadge}>
              <Ionicons name="checkmark-done-circle" size={24} color="#2ecc71" />
              <Text style={styles.alreadyInPlanText}>
                {locale === 'al' ? "Ky bar është shtuar në planin tuaj." : "This medication is added to your plan."}
              </Text>
            </View>
          </View>
        )}

        {renderInfoSection(t('indications'), item?.indications_and_usage?.[0], 'indications')}
        {renderInfoSection(t('dosage'), item?.dosage_and_administration?.[0], 'dosage')}
        {renderInfoSection(t('warnings'), item?.warnings?.[0] || item?.warnings_and_precautions?.[0], 'warnings')}
        {showPicker && <DateTimePicker value={new Date()} mode="time" is24Hour={true} onChange={onTimeChange} />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20 },
  scrollContent: { paddingBottom: 40 },
  heroSection: { alignItems: 'center', marginBottom: 25 },
  iconBox: { padding: 22, borderRadius: 28, marginBottom: 15 },
  mainTitle: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', paddingHorizontal: 20 },
  subTitle: { fontSize: 16, textAlign: 'center', fontStyle: 'italic', paddingHorizontal: 30 },
  daysContainer: { paddingHorizontal: 25, marginBottom: 20 },
  daysLabel: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayChip: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  dayText: { fontSize: 14, fontWeight: 'bold' },
  reminderBtn: { backgroundColor: '#3498db', flexDirection: 'row', marginHorizontal: 25, padding: 18, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  reminderBtnText: { color: 'white', fontWeight: 'bold', marginLeft: 10, fontSize: 16 },
  alreadyInPlanContainer: { marginHorizontal: 25, marginBottom: 30, alignItems: 'center' },
  infoBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2ecc7115', padding: 15, borderRadius: 20, width: '100%', justifyContent: 'center' },
  alreadyInPlanText: { color: '#2ecc71', fontWeight: 'bold', marginLeft: 10, fontSize: 15 },
  section: { paddingHorizontal: 20, marginBottom: 22 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  infoCard: { padding: 18, borderRadius: 20 },
  infoText: { fontSize: 15, lineHeight: 24 },
  readMoreBtn: { alignSelf: 'flex-end' }
});