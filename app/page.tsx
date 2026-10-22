import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const instant = false;

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/editor");
  }

  const signInUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/sign-in";
  redirect(signInUrl);
}
