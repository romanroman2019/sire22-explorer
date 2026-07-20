import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { authRepository } from '@/lib/repositories/authRepository'
import type { AuthUser } from '@/lib/repositories/authRepository'

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        })
      } else {
        setUser(null)
      }
    })
    return unsubscribe
  }, [])

  async function signInWithGoogle(): Promise<void> {
    try {
      const authUser = await authRepository.signInWithGoogle()
      setUser(authUser)
    } catch (error) {
      console.error('Google sign-in failed:', error)
      throw error
    }
  }

  async function signOut(): Promise<void> {
    try {
      await authRepository.signOut()
      setUser(null)
    } catch (error) {
      console.error('Sign out failed:', error)
      throw error
    }
  }

  return {
    user,
    isAuthenticated: user !== null && user !== undefined,
    isLoading: user === undefined,
    signInWithGoogle,
    signOut,
  }
}