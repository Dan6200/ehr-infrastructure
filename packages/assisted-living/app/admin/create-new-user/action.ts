'use server'

import { createUserWithEmailAndPasswordWrapper } from '@/firebase/auth/client/definitions'

export async function addAdmin(data: { email: string; password: string }) {
  return createUserWithEmailAndPasswordWrapper(data.email, data.password)
    .then((user) => ({
      result: JSON.stringify(user),
      success: true,
      message: 'User Created Successfully',
    }))
    .catch((error) => {
      let msg = ''
      if (error.message.match(/(email-already-in-use)/g))
        msg = 'Email Already In Use'
      return {
        success: false,
        message: 'Failed to Create User: ' + msg,
      }
    })
}
