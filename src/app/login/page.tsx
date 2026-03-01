import { redirect } from "next/navigation"

export default async function LoginRedirect({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const plan = params.plan
  const redirectUrl = plan ? `/auth?mode=login&plan=${plan}` : "/auth?mode=login"
  redirect(redirectUrl)
}
