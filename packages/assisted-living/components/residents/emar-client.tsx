'use client'

import * as React from 'react'
import { Button } from '#root/components/ui/button'
import { recordAdministration } from '#root/actions/residents/record-administration'
import { toast } from '#root/components/ui/use-toast'
import { useAuth } from '#root/auth/client/auth-context'
import { Prescription, EmarRecord } from '#root/types'
import { useRouter } from 'next/navigation'

const timeSlots = ['Morning', 'Noon', 'Evening', 'Bedtime']

// A helper function to map a time slot to an hour range
const getTimeForSlot = (slot: string): number => {
  switch (slot) {
    case 'Morning':
      return 9 // 9 AM
    case 'Noon':
      return 12 // 12 PM
    case 'Evening':
      return 17 // 5 PM
    case 'Bedtime':
      return 21 // 9 PM
    default:
      return 0
  }
}

interface EmarClientProps {
  residentId: string
  prescriptions: Prescription[]
  emarRecords: EmarRecord[]
}

export function EmarClient({
  residentId,
  prescriptions,
  emarRecords,
}: EmarClientProps) {
  const { user } = useAuth()
  const router = useRouter()

  const handleAdminister = async (
    prescription: Prescription,
    timeSlot: string,
    status: 'completed' | 'not-done' | 'on-hold',
  ) => {
    if (!user || !user.uid) {
      toast({ title: 'Authentication Error', variant: 'destructive' })
      return
    }

    const administrationTime = new Date()
    administrationTime.setHours(getTimeForSlot(timeSlot), 0, 0, 0)

    const route = prescription.dosage_instruction?.[0]?.route
    if (!route) {
      toast({
        title: 'Prescription missing route information',
        variant: 'destructive',
      })
      return
    }

    const newEmarRecord: Omit<EmarRecord, 'id' | 'resident_id'> = {
      prescription_id: prescription.id,
      medication: prescription.medication,
      recorder_id: user.uid,
      status: status,
      effective_datetime: administrationTime.toISOString(),
      dosage: {
        // Fetch route and dose from the actual prescription
        route: route,
        administered_dose: prescription.dosage_instruction[0]?.dose_and_rate[0]
          ?.dose_quantity || { value: 1, unit: 'tablet' },
        dose_number: 1,
      },
    }

    try {
      const { success, message } = await recordAdministration(
        residentId,
        newEmarRecord as EmarRecord,
      )
      toast({ title: message, variant: success ? 'default' : 'destructive' })
      if (success) {
        // Refresh the page to show the new record
        router.refresh()
      }
    } catch (error) {
      toast({ title: 'An error occurred', variant: 'destructive' })
    }
  }

  const todayStr = new Date().toDateString()

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">
        eMAR - {new Date().toLocaleDateString()}
      </h2>
      <div className="grid grid-cols-5 gap-2 p-2 border rounded-lg bg-card text-card-foreground">
        <div className="font-bold p-2">Medication</div>
        {timeSlots.map((slot) => (
          <div key={slot} className="font-bold text-center p-2">
            {slot}
          </div>
        ))}

        {prescriptions.map((med) => (
          <React.Fragment key={med.id}>
            <div className="p-2 font-medium">{med.medication.code.text}</div>
            {timeSlots.map((slot) => {
              const administration = emarRecords.find((rec) => {
                const adminDate = new Date(rec.effective_datetime)
                const adminHour = adminDate.getHours()
                const slotHour = getTimeForSlot(slot)

                // Check if the record is for today, for this prescription, and matches the time slot's hour
                return (
                  rec.prescription_id === med.id &&
                  adminDate.toDateString() === todayStr &&
                  adminHour >= slotHour &&
                  adminHour < slotHour + 3 // Allow a 3-hour window
                )
              })

              return (
                <div key={slot} className="p-2 text-center">
                  {administration ? (
                    <span
                      className={`p-2 rounded-md font-semibold ${
                        administration.status === 'completed'
                          ? 'bg-green-200 text-green-800'
                          : 'bg-red-200 text-red-800'
                      }`}
                    >
                      {administration.status === 'completed'
                        ? 'GIVEN'
                        : administration.status.toUpperCase()}
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleAdminister(med, slot, 'completed')}
                    >
                      Administer
                    </Button>
                  )}
                </div>
              )
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
