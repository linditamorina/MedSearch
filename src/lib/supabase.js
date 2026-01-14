import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://cxmxxvfycwnbpvmvymep.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4bXh4dmZ5Y3duYnB2bXZ5bWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NzQxMzcsImV4cCI6MjA4MTA1MDEzN30.PeNXT3voKn2rMgJ5V_nEBxA8XfQuB2DfHFq78fsG2-Q';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});