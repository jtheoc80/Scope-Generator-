'use client';

import { useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";

export default function SignOutClient() {
  const { signOut } = useClerk();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Clear all queries from the cache to ensure no user data persists
    queryClient.removeQueries();

    void signOut({ redirectUrl: "/" });
  }, [signOut, queryClient]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Signing out…</h1>
        <p className="mt-2 text-sm text-slate-600">You’ll be redirected shortly.</p>
      </div>
    </div>
  );
}

