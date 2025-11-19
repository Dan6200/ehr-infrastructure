'use client'

import * as React from 'react'
import { getResidentData } from '#root/actions/residents/get'
import { EmarRecord } from '#root/types'
import { Button } from '#root/components/ui/button'
import { recordAdministration } from '#root/actions/residents/record-administration'
import { toast } from '#root/components/ui/use-toast'
import { useAuth } from '#root/auth/client/auth-context'

const timeSlots = ['Morning', 'Noon', 'Evening', 'Bedtime']

export default function EmarPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const [residentData, setResidentData] = React.useState<any>(null)

  React.useEffect(() => {
    getResidentData(params.id).then(setResidentData)
  }, [params.id])

  const handleAdminister = async (
    medicationName: string,
    timeSlot: string,
    status: 'GIVEN' | 'REFUSED' | 'HELD',
  ) => {
    if (!user) {
      toast({ title: 'Authentication Error', variant: 'destructive' })
      return
    }
    try {
      const { success, message } = await recordAdministration(
        params.id,
        medicationName,
        {
          date: new Date().toISOString(),
          status,
          administered_by: user.uid,
        },
      )
      toast({ title: message, variant: success ? 'default' : 'destructive' })
      if (success) {
        // Refresh data
        getResidentData(params.id).then(setResidentData)
      }
    } catch (error) {
      toast({ title: 'An error occurred', variant: 'destructive' })
    }
  }

  if (!residentData) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">
        eMAR - {new Date().toLocaleDateString()}
      </h2>
      <div className="grid grid-cols-5 gap-2 p-2 border rounded-lg">
        <div className="font-bold">Medication</div>
        {timeSlots.map((slot) => (
          <div key={slot} className="font-bold text-center">
            {slot}
          </div>
        ))}

        {residentData.medications?.map((med: Medication) => (
          <React.Fragment key={med.name}>
            <div className="p-2 font-medium">{med.name}</div>
            {timeSlots.map((slot) => {
              const administration = med.administrations?.find((a) => {
                // This logic needs to be more robust to match administration to a time slot
                const adminDate = new Date(a.date)
                return adminDate.toDateString() === new Date().toDateString()
              })
              return (
                <div key={slot} className="p-2 text-center">
                  {administration ? (
                    <span
                      className={`p-2 rounded-md ${administration.status === 'GIVEN' ? 'bg-green-200' : 'bg-red-200'}`}
                    >
                      {administration.status}
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleAdminister(med.name, slot, 'GIVEN')}
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
