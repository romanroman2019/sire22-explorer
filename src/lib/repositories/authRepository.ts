import {
  type User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'

export interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
}

function mapUser(user: User): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  }
}

export const authRepository = {
  async signInWithGoogle(): Promise<AuthUser> {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({
      prompt: 'select_account',
    })
    const result = await signInWithPopup(auth, provider)
    return mapUser(result.user)
  },

  async signOut(): Promise<void> {
    await signOut(auth)
  },
}