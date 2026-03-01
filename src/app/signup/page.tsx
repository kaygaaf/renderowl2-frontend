import { redirect } from "next/navigation"

export default async function SignupRedirect({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const plan = params.plan
  const redirectUrl = plan ? `/auth?mode=signup&plan=${plan}` : "/auth?mode=signup"
  redirect(redirectUrl)
}
