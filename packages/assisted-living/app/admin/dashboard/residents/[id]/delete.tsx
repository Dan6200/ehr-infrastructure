'use client'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from '#/components/ui/dialog'
import { toast } from '#/components/ui/use-toast'
import { Nullable } from '#/types'
import { useRouter } from 'next/navigation'

export default function DeleteResident({
  resident_name,
  resident_id,
  deleteResidentData,
}: {
  resident_name: Nullable<string>
  resident_id: string
  deleteResidentData: (resident_id: string) => Promise<
    | {
        success: boolean
        message?: undefined
      }
    | {
        success: boolean
        message: string
      }
  >
}) {
  const router = useRouter()
  const handleDelete = async () => {
    'use server'
    if (!resident_id) {
      toast({ title: 'Unable to Delete Resident', variant: 'destructive' })
      return
    }
    deleteResidentData(resident_id)
      .catch((err) => {
        console.error(err)
        toast({ title: 'Unable to Delete Resident', variant: 'destructive' })
      })
      .then((_) => toast({ title: 'Successfully Deleted Resident' }))
    router.refresh()
    return
  }
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          type="submit"
          className="w-full bg-red-700"
        >
          Delete Resident
        </Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col gap-8">
        {resident_name ? (
          <h4 className="text-center capitalize text-2xl">
            are you sure you wish to delete resident{' '}
            <span className="font-bold">{resident_name}</span>?
          </h4>
        ) : (
          <h4 className="text-center capitalize text-2xl">
            are you sure you wish to delete this resident
          </h4>
        )}
        <div className="flex flex-col sm:flex-row w-full gap-4 justify-between">
          <DialogClose asChild>
            <Button type="submit" className="w-full sm:w-1/3 font-bold">
              Cancel
            </Button>
          </DialogClose>
          <form action={handleDelete} className="w-full sm:w-1/3">
            <Button
              variant="destructive"
              type="submit"
              className="bg-red-700 w-full font-bold"
            >
              Confirm
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
