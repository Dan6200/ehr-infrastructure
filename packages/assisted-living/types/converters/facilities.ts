import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore'
import { FacilitySchema } from '..'
import z from 'zod'

export const getFacilityConverter = async (): Promise<
  FirestoreDataConverter<z.infer<typeof FacilitySchema>>
> => ({
  toFirestore(prescription: z.infer<typeof FacilitySchema>): DocumentData {
    return FacilitySchema.parse(prescription)
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
  ): z.infer<typeof FacilitySchema> {
    return FacilitySchema.parse(snapshot.data())
  },
})
