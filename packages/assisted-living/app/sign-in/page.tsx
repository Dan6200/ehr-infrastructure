import { SignInForm } from '@/components/signin-form/'
//import Link from "next/link";

export default async function SignInPage() {
  return (
    <main className="bg-background container md:w-2/3 mx-auto py-32 max-h-screen">
      <h1 className="text-2xl font-bold my-8">
        Please Sign In Before You Proceed...
      </h1>
      <SignInForm />
      {/*      <Link href="/admin/new" className="underline text-blue-700">
        Don't have an account? Sign up instead.
      </Link>*/}
    </main>
  )
}
