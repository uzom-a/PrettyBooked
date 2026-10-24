import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const profileFor = useRef(null)

  useEffect(() => {
    // This fires once on page load and again on sign in, sign out and token
    // refresh. The profile is only fetched when the signed-in person changes.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null
      setUser(nextUser)
      if (!nextUser) {
        profileFor.current = null
        setProfile(null)
        setLoading(false)
        return
      }
      if (profileFor.current === nextUser.id) return
      profileFor.current = nextUser.id
      setLoading(true)
      // Supabase asks that other calls wait until this callback returns.
      setTimeout(() => fetchProfile(nextUser.id), 0)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data, error } = await supabase.from('profiles').select('id, full_name, role, created_at').eq('id', userId).maybeSingle()
    if (error) console.error('Could not load profile:', error.message)
    setProfile(data ?? null)
    setLoading(false)
  }

  async function signUp({ email, password, fullName, role }) {
    // Store fullName and role in user metadata.
    // The database trigger will create the profile row automatically
    // once the user confirms their email.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
        emailRedirectTo: `${window.location.origin}/`,
      },
    })
    if (error) throw error
    return data
  }

  async function signIn({ email, password }) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
