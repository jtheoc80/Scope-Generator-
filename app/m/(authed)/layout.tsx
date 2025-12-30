import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isClerkConfigured } from "@/lib/authUtils";

export default async function MobileAuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isClerkConfigured()) {
    const { userId } = await auth();
    if (!userId) {
      redirect("/sign-in?redirect_url=/m");
    }
  }

  return children;
}

