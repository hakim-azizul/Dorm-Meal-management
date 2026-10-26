"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useMealApp } from "@/context/MealAppContext";
import {
  UtensilsCrossed,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

export default function LoginPage() {
  const { t, language } = useLanguage();
  const { loginWithCredentials } = useMealApp();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    const result = await loginWithCredentials(email.trim().toLowerCase(), password);
    setIsLoading(false);

    if (result.success && result.role) {
      if (result.role === "admin") {
        router.push("/dashboard/admin");
      } else if (result.role === "chef") {
        router.push("/dashboard/chef");
      } else {
        router.push("/dashboard/student");
      }
    } else {
      setErrorMsg(result.message || "Invalid email or password. Please try again.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        {/* Card Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4 shadow-sm">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-base-content">
            {t("loginTitle")}
          </h1>
          <p className="text-sm text-base-content/60 mt-1">
            {t("loginSubtitle")}
          </p>
        </div>

        {/* Login Form Box */}
        <div className="card bg-base-100 border border-base-300 shadow-sm overflow-hidden">
          <form onSubmit={handleSubmit} className="card-body p-6 sm:p-8 space-y-4">
            {errorMsg && (
              <div className="alert alert-error text-xs py-2 rounded-xl text-white">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-bold text-xs">
                  {t("emailLabel")}
                </span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@hostel.edu"
                  className="input input-bordered w-full pl-10 pr-4 text-sm font-medium focus:input-primary"
                />
                <Mail className="w-4 h-4 text-base-content/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-bold text-xs">
                  {t("passwordLabel")}
                </span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="input input-bordered w-full pl-10 pr-4 text-sm font-medium focus:input-primary"
                />
                <Lock className="w-4 h-4 text-base-content/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full gap-2 mt-2 shadow-xs"
            >
              {isLoading ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <>
                  <span>{t("submitLogin")}</span>
                  <ArrowRight className={`w-4 h-4 ${language === "ar" ? "rotate-180" : ""}`} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
