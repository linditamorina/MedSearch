import React, { useState, useCallback, useEffect } from 'react';
import { 
  StyleSheet, View, Text, FlatList, TouchableOpacity, 
  SafeAreaView, StatusBar, Alert, Platform, Modal 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const CARD_COLORS = ['#3498db', '#9b59b6', '#2ecc71', '#f1c40f', '#e67e22', '#e74c3c'];

// Funksion për të gjetur datën e saktë kalendarike për një ditë të javës AKTUAL
const getDateOfWeekDay = (dayId) => {
  const daysMap = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
  const today = new Date();
  const currentDay = today.getDay();
  const targetDay = daysMap[dayId];
  
  const targetDate = new Date(today);
  const diff = targetDay - currentDay;
  targetDate.setDate(today.getDate() + diff);
  return targetDate.toISOString().split('T')[0];
};

export default function SchedulesScreen({ navigation }) {
  const [schedules, setSchedules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const theme = useTheme();
  const { t, locale } = useLanguage();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editTime, setEditTime] = useState(new Date());
  const [editDays, setEditDays] = useState([]);
  const [showPicker, setShowPicker] = useState(false);

  const currentDaysConfig = {
    al: [
      { id: 'Mon', label: 'H' }, { id: 'Tue', label: 'M' }, { id: 'Wed', label: 'M' },
      { id: 'Thu', label: 'E' }, { id: 'Fri', label: 'P' }, { id: 'Sat', label: 'S' }, { id: 'Sun', label: 'D' }
    ],
    en: [
      { id: 'Mon', label: 'M' }, { id: 'Tue', label: 'T' }, { id: 'Wed', label: 'W' },
      { id: 'Thu', label: 'T' }, { id: 'Fri', label: 'F' }, { id: 'Sat', label: 'S' }, { id: 'Sun', label: 'S' }
    ]
  }[locale] || [];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // FETCH DATA: Me logjikën e resetimit javor
  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Marrim të gjitha oraret
    const { data: scheds } = await supabase.from('medication_schedules')
      .select('*').eq('user_id', user.id).order('scheduled_time', { ascending: true });
    setSchedules(scheds || []);

    // 2. Logjika e Resetimit: Gjejmë të hënën e javës aktuale
    const now = new Date();
    const currentDayIdx = now.getDay(); // 0 = Sun, 1 = Mon...
    const diffToMonday = now.getDate() - currentDayIdx + (currentDayIdx === 0 ? -6 : 1);
    const startOfWeek = new Date(now.setDate(diffToMonday));
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

    // 3. Marrim vetëm log-et që janë bërë gjatë kësaj jave
    const { data: logData } = await supabase.from('medication_logs')
      .select('schedule_id, taken_at')
      .eq('user_id', user.id)
      .gte('taken_at', startOfWeekStr); // Filtri kyç për resetimin
      
    setLogs(logData || []);
  };

  useFocusEffect(useCallback(() => { fetchData(); }, [locale]));

  const getCountdown = (scheduledTime, activeDays) => {
    if (!activeDays || activeDays.length === 0) return "";
    const [h, m] = scheduledTime.split(':').map(Number);
    const daysMap = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
    let nextOccurrence = null;
    const now = new Date();

    for (let i = 0; i <= 7; i++) {
      const tempDate = new Date();
      tempDate.setDate(now.getDate() + i);
      tempDate.setHours(h, m, 0, 0);
      const dayName = Object.keys(daysMap).find(key => daysMap[key] === tempDate.getDay());
      if (activeDays.includes(dayName) && tempDate > now) {
        nextOccurrence = tempDate;
        break;
      }
    }

    if (!nextOccurrence) return "";
    const diffMs = nextOccurrence - now;
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor((diffMs % 3600000) / 60000);
    const remainingText = locale === 'al' ? 'mbeten' : 'left';
    
    return diffHrs > 24 ? `${Math.floor(diffHrs/24)}d ${remainingText}` : `${diffHrs}h ${diffMins}m ${remainingText}`;
  };

  const toggleDayLog = async (scheduleId, dayId) => {
    const { data: { user } } = await supabase.auth.getUser();
    const dateStr = getDateOfWeekDay(dayId);
    const existingLog = logs.find(l => l.schedule_id === scheduleId && l.taken_at === dateStr);

    if (existingLog) {
      await supabase.from('medication_logs').delete().eq('user_id', user.id).eq('schedule_id', scheduleId).eq('taken_at', dateStr);
    } else {
      await supabase.from('medication_logs').insert([{ user_id: user.id, schedule_id: scheduleId, taken_at: dateStr }]);
    }
    fetchData();
  };

  const isDayTaken = (scheduleId, dayId) => {
    const dateStr = getDateOfWeekDay(dayId);
    return logs.some(l => l.schedule_id === scheduleId && l.taken_at === dateStr);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setEditDays(item.days || []);
    const [h, m] = item.scheduled_time.split(':');
    const d = new Date(); d.setHours(parseInt(h), parseInt(m));
    setEditTime(d);
    setModalVisible(true);
  };

  const saveChanges = async () => {
    const timeStr = editTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const { error } = await supabase.from('medication_schedules').update({ scheduled_time: timeStr, days: editDays }).eq('id', editingItem.id);
    if (!error) { fetchData(); setModalVisible(false); }
  };

  const confirmDelete = (id, name) => {
    Alert.alert(t('confirm_delete'), `${t('delete_msg')} ${name}?`, [
      { text: t('cancel'), style: "cancel" },
      { text: t('delete'), style: "destructive", onPress: async () => { await supabase.from('medication_schedules').delete().eq('id', id); fetchData(); }}
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.isDarkMode ? "light-content" : "dark-content"} />
      
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.appName, { color: theme.text }]}>{t('plan')}</Text>
          <View style={[styles.logoBadge, { backgroundColor: theme.card }]}>
            <Ionicons name="calendar" size={26} color="#3498db" />
          </View>
        </View>
      </View>

      <FlatList
        data={schedules}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const accentColor = CARD_COLORS[index % CARD_COLORS.length];
          return (
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <View style={styles.topRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.drugName, { color: theme.text }]}>{item.drug_name}</Text>
                  <View style={styles.timeInfoRow}>
                    <Text style={[styles.timeText, { color: accentColor }]}>{item.scheduled_time.slice(0, 5)}</Text>
                    <View style={[styles.countdownBadge, { backgroundColor: accentColor + '15' }]}>
                        <Text style={[styles.countdownText, { color: accentColor }]}>{getCountdown(item.scheduled_time, item.days)}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.actionIcons}>
                   <TouchableOpacity onPress={() => openEditModal(item)} style={styles.iconBtn}><Ionicons name="pencil-outline" size={20} color={theme.subText} /></TouchableOpacity>
                   <TouchableOpacity onPress={() => confirmDelete(item.id, item.drug_name)} style={styles.iconBtn}><Ionicons name="trash-outline" size={20} color="#e74c3c" /></TouchableOpacity>
                </View>
              </View>

              <Text style={styles.instructionText}>{locale === 'al' ? 'Klikoni ditën për ta shënuar si të pirë:' : 'Tap day to mark as taken:'}</Text>

              <View style={styles.daysContainer}>
                {currentDaysConfig.map((day) => {
                  const active = item.days?.includes(day.id);
                  const taken = isDayTaken(item.id, day.id);
                  return (
                    <TouchableOpacity key={day.id} disabled={!active} onPress={() => toggleDayLog(item.id, day.id)}
                      style={[styles.dayCircle, { backgroundColor: taken ? '#2ecc71' : (active ? theme.background : 'transparent'), borderColor: active ? (taken ? '#2ecc71' : accentColor) : theme.background + '40', opacity: active ? 1 : 0.2 }]}>
                      <Text style={[styles.dayLabel, { color: taken ? 'white' : (active ? theme.text : theme.subText) }]}>{day.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={[styles.empty, { color: theme.subText }]}>{t('empty_plan')}</Text>}
      />

      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{editingItem?.drug_name}</Text>
            <View style={styles.editDaysRow}>
              {currentDaysConfig.map(day => (
                <TouchableOpacity key={day.id} onPress={() => setEditDays(prev => prev.includes(day.id) ? prev.filter(d => d !== day.id) : [...prev, day.id])}
                  style={[styles.editDayChip, { backgroundColor: editDays.includes(day.id) ? '#3498db' : theme.background }]}>
                  <Text style={{ color: editDays.includes(day.id) ? 'white' : theme.text, fontWeight: 'bold' }}>{day.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.timePickerBtn} onPress={() => setShowPicker(true)}>
              <Text style={{ color: theme.text, fontSize: 18, fontWeight: 'bold' }}>{locale === 'al' ? 'Ora' : 'Time'}: {editTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </TouchableOpacity>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}><Text style={{ color: '#e74c3c', fontWeight: 'bold' }}>{t('cancel')}</Text></TouchableOpacity>
              <TouchableOpacity onPress={saveChanges} style={styles.saveBtn}><Text style={{ color: 'white', fontWeight: 'bold' }}>{t('save') || 'Ruaj'}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
        {showPicker && <DateTimePicker value={editTime} mode="time" is24Hour={true} onChange={(e, d) => { setShowPicker(false); if(d) setEditTime(d); }} />}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { paddingHorizontal: 25, paddingTop: 20, marginBottom: 15 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  appName: { fontSize: 32, fontWeight: 'bold' },
  logoBadge: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', elevation: 3, shadowOpacity: 0.1 },
  card: { borderRadius: 28, padding: 22, marginBottom: 20, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  drugName: { fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  timeInfoRow: { flexDirection: 'row', alignItems: 'center' },
  timeText: { fontSize: 26, fontWeight: 'bold' },
  countdownBadge: { marginLeft: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  countdownText: { fontSize: 11, fontWeight: 'bold' },
  actionIcons: { flexDirection: 'row' },
  iconBtn: { padding: 8, marginLeft: 5 },
  instructionText: { fontSize: 12, color: '#999', marginBottom: 18, fontStyle: 'italic' },
  daysContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  dayLabel: { fontSize: 14, fontWeight: 'bold' },
  empty: { textAlign: 'center', marginTop: 100, fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 30, padding: 25 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 25, textAlign: 'center' },
  editDaysRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  editDayChip: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  timePickerBtn: { padding: 15, borderRadius: 15, backgroundColor: '#3498db20', alignItems: 'center', marginBottom: 30 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
  cancelBtn: { padding: 15, flex: 1, alignItems: 'center' },
  saveBtn: { padding: 15, flex: 1, backgroundColor: '#3498db', borderRadius: 15, alignItems: 'center' }
});