"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../services/api";
import { GlassCard } from "../components/GlassCard";
import {
  Sparkles, Mail, ArrowRight, Activity, Cpu,
  ShieldCheck, RefreshCw, CheckCircle, Lock, Eye, EyeOff, AlertTriangle, UserPlus, LogIn
} from "lucide-react";

type AuthMode = "signin" | "signup" | "success";

export default function LandingPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isAlreadyAuth, setIsAlreadyAuth] = useState(false);

  useEffect(() => {
    if (api.isAuthenticated()) setIsAlreadyAuth(true);
  }, []);

  const switchMode = (next: AuthMode) => {
    setError("");
    setPassword("");
    setConfirmPassword("");
    setMode(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        await api.signIn(email, password);
        setSuccessMsg("Signed in! Redirecting to your dashboard...");
      } else {
        await api.signUp(email, password);
        setSuccessMsg("Account created! Redirecting...");
      }
      setMode("success");
      setTimeout(async () => {
        try {
          await api.getProfile();
          router.push("/dashboard");
        } catch {
          router.push("/assessment");
        }
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center min-h-[calc(100vh-10rem)]">

      {/* LEFT: Product Hero */}
      <div className="lg:col-span-7 space-y-6 text-left">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-purple-500/20 text-purple-400 bg-purple-500/5 text-xs font-semibold uppercase tracking-wider"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Gen AI Life Simulation Core</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight"
        >
          Simulate your{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400">
            destiny
          </span>{" "}
          based on your habits
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-gray-400 text-base sm:text-lg leading-relaxed max-w-2xl"
        >
          Your daily habits dictate your 10-year trajectory. Future Self Simulator
          aggregates 10 AI Agents to analyze your routines and write detailed chronicles
          of your possible futures — Career, Health, Finance, and beyond.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4"
        >
          {[
            { icon: Cpu, color: "text-purple-400", title: "Multi-Agent Projection", desc: "Health, Career & Finance specialists run simultaneous analysis pipelines." },
            { icon: Activity, color: "text-indigo-400", title: "Timeline A, B, C Engine", desc: "Compare current routines against +20% and fully optimized micro-habit paths." },
          ].map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/2 border border-white/5 flex items-center justify-center shrink-0">
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">{title}</h3>
                <p className="text-gray-400 text-xs mt-1 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {isAlreadyAuth && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="pt-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="glass-btn flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm"
            >
              <span>Continue to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </div>

      {/* RIGHT: Auth Card */}
      <div className="lg:col-span-5 relative">
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-indigo-600/10 blur-xl rounded-3xl" />

        <GlassCard className="relative border border-white/5" delay={0.2} hoverEffect={false}>

          {/* Mode Toggle */}
          {mode !== "success" && (
            <div className="flex rounded-xl bg-white/5 p-1 mb-6 border border-white/5">
              {(["signin", "signup"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
                    mode === m
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {m === "signin" ? <LogIn className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                  {m === "signin" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>
          )}

          {/* Error Banner */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">

            {/* ---- SIGN IN / SIGN UP Form ---- */}
            {(mode === "signin" || mode === "signup") && (
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.3 }}
              >
                {/* Header */}
                <div className="mb-5">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold uppercase tracking-wider mb-3 ${
                    mode === "signin"
                      ? "border-purple-500/20 bg-purple-500/5 text-purple-400"
                      : "border-indigo-500/20 bg-indigo-500/5 text-indigo-400"
                  }`}>
                    {mode === "signin" ? <LogIn className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                    <span>{mode === "signin" ? "Welcome Back" : "Join the Simulator"}</span>
                  </div>
                  <h2 className="text-xl font-extrabold text-white">
                    {mode === "signin" ? "Sign in to your account" : "Create your account"}
                  </h2>
                  <p className="text-gray-400 text-xs mt-1">
                    {mode === "signin"
                      ? "Enter your credentials to access your simulation."
                      : "Start your AI life simulation journey today."}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
                      <input
                        id="email-input"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="w-full glass-input pl-10 text-sm"
                        required
                        autoComplete="email"
                        autoFocus
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
                      <input
                        id="password-input"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
                        className="w-full glass-input pl-10 pr-10 text-sm"
                        required
                        autoComplete={mode === "signin" ? "current-password" : "new-password"}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-300 transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password (Sign Up only) */}
                  <AnimatePresence>
                    {mode === "signup" && (
                      <motion.div
                        key="confirm-password"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-1.5 overflow-hidden"
                      >
                        <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Confirm Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
                          <input
                            id="confirm-password-input"
                            type={showConfirm ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repeat your password"
                            className="w-full glass-input pl-10 pr-10 text-sm"
                            required
                            autoComplete="new-password"
                            disabled={loading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirm((v) => !v)}
                            className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-300 transition-colors"
                            tabIndex={-1}
                          >
                            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit */}
                  <button
                    type="submit"
                    id="auth-submit-btn"
                    disabled={loading}
                    className="w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-lg glass-btn text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed outline-none"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>{mode === "signin" ? "Sign In" : "Create Account"}</span>
                        {mode === "signin" ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                      </>
                    )}
                  </button>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-500 mt-6 pt-4 border-t border-white/5">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span>Passwords are hashed with bcrypt. Your data is secure.</span>
                </div>
              </motion.div>
            )}

            {/* ---- SUCCESS State ---- */}
            {mode === "success" && (
              <motion.div
                key="success-step"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6 space-y-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1 }}
                  className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto"
                >
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </motion.div>
                <h2 className="text-xl font-extrabold text-white">Authentication Successful!</h2>
                <p className="text-gray-400 text-sm">{successMsg}</p>
                <div className="flex items-center justify-center gap-2 text-purple-400 text-xs animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Initializing your simulation environment...</span>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </GlassCard>
      </div>
    </div>
  );
}
