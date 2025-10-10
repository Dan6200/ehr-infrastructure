'use client'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth'
import { auth } from '../client/config'

export async function createUserWithEmailAndPasswordWrapper(
  email: string,
  password: string,
) {
  return createUserWithEmailAndPassword(auth, email, password).catch((e) => {
    throw new Error('Failed to Create User. -- Tag:3\n\t' + e)
  })
}

export async function signInWithEmailAndPasswordWrapper(
  email: string,
  password: string,
) {
  return signInWithEmailAndPassword(auth, email, password)
    .then(({ user }) => ({
      result: user,
      message: 'User Signed In Successfully',
      success: true,
    }))
    .catch((error: Error) => {
      console.error(error)
      return {
        result: error.toString(),
        message: 'Failed to Sign In User.',
        success: false,
      }
    })
}

export async function signOutWrapper() {
  auth.signOut().catch(function (e) {
    throw new Error('Error signing out -- Tag:27\n\t' + e)
  })
}
