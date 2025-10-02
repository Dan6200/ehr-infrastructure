import { addAdmin } from '@/app/admin/new/action'
import { GoBackLink } from '@/components/go-back-link'
import { AddAdminForm } from '@/components/register-form'

export default async function RegisterPage() {
  return (
    <main className="bg-background flex flex-col gap-8 md:gap-16 container w-full md:w-2/3 mx-auto py-32 max-h-screen">
      <GoBackLink className="cursor-pointer text-blue-700 flex w-full sm:w-3/5 gap-2 sm:gap-5">
        Go To Previous Page
      </GoBackLink>
      <AddAdminForm {...{ addAdmin }} />
    </main>
  )
}
