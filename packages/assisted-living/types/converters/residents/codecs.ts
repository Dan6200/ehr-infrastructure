import {
  EncryptedAdjustmentSchema,
  EncryptedChargeSchema,
  EncryptedDiagnosticHistorySchema,
  EncryptedObservationSchema,
  EncryptedPaymentSchema,
  EncryptedPrescriptionSchema,
} from '#root/types/encrypted-schemas'
import { DiagnosticHistorySchema } from '#root/types/schemas/clinical/diagnostic-history'
import { ObservationSchema } from '#root/types/schemas/clinical/observation'
import { PrescriptionSchema } from '#root/types/schemas/clinical/prescription'
import { AdjustmentSchema } from '#root/types/schemas/financial/adjustment'
import { ChargeSchema } from '#root/types/schemas/financial/charge'
import { PaymentSchema } from '#root/types/schemas/financial/payment'
import { makeCodec } from './codec'

export const observationCodec = makeCodec({
  domainSchema: ObservationSchema,
  encryptedSchema: EncryptedObservationSchema,
  linkField: 'subject',
})

export const diagnosticHistoryCodec = makeCodec({
  domainSchema: DiagnosticHistorySchema,
  encryptedSchema: EncryptedDiagnosticHistorySchema,
  linkField: 'subject',
})

export const prescriptionCodec = makeCodec({
  domainSchema: PrescriptionSchema,
  encryptedSchema: EncryptedPrescriptionSchema,
  linkField: 'subject',
})

export const chargeCodec = makeCodec({
  domainSchema: ChargeSchema,
  encryptedSchema: EncryptedChargeSchema,
  linkField: 'subject',
})

export const paymentCodec = makeCodec({
  domainSchema: PaymentSchema,
  encryptedSchema: EncryptedPaymentSchema,
  linkField: 'subject',
})

export const adjustmentCodec = makeCodec({
  domainSchema: AdjustmentSchema,
  encryptedSchema: EncryptedAdjustmentSchema,
  linkField: 'subject',
})
