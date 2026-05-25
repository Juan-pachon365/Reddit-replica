import { createClient } from '@supabase/supabase-js'


const supabaseUrl = "https://zfipyquhcknqfkkbjwnv.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmaXB5cXVoY2tucWZra2Jqd252Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NDQzNDUsImV4cCI6MjA5NTIyMDM0NX0.Xk2w_EEf1BfZKYja5EzlS3-3s9qkE8ZXLRibcDaNad8"

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper para verificar si el usuario es admin
export const isAdmin = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  return data?.role === 'admin'
}