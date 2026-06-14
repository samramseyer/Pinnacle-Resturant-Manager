"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Logo } from "@/components/layout/Logo";
import { SignupFlow, planFromSearchParam } from "@/components/auth/SignupPlanModal";

export default function SignupForm() {
  const searchParams = useSearchParams();
  const initialPlan = planFromSearchParam(searchParams.get("plan"));

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4 py-8">
      <div className="mb-8">
        <Logo className="h-14" />
      </div>

      <div className="w-full max-w-4xl rounded-xl bg-white p-8 shadow-xl">
        <h1 className="text-xl font-bold text-slate-900">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500">
          Pick a plan, then set up your restaurant workspace.
        </p>

        <div className="mt-6">
          <SignupFlow initialPlan={initialPlan} />
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-orange-600 hover:text-orange-500">
            Sign in
          </Link>
        </p>
        <p className="mt-3 text-center text-sm text-slate-400">
          Just exploring?{" "}
          <Link href="/demo" className="text-orange-600 hover:text-orange-500">
            Try the live demo
          </Link>
        </p>
      </div>
    </div>
  );
}
