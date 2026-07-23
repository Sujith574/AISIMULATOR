"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { api } from "../../services/api";
import { GlassCard } from "../../components/GlassCard";
import { TimelineView } from "../../components/TimelineView";
import { 
  ReadinessRadar, FinanceProjection, TimelineCompareBar, RiskAnalysisBar 
} from "../../components/VisualCharts";
import { 
  Sparkles, ShieldAlert, Award, Compass, RefreshCw, DollarSign,
  Mail, MessageSquare, AlertCircle, ArrowRight, UserCheck, Zap, Heart, BookOpen
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!api.isAuthenticated()) {
      router.push("/");
      return;
    }
    loadData();
  }, []);

  const loadData = async (forceRun = false) => {
    setError("");
    if (forceRun) setRefreshing(true);
    else setLoading(true);

    try {
      let data = null;
      if (!forceRun) {
        try {
          data = await api.getLatestSimulation();
        } catch (err: any) {
          // If no report, we will try to run a new one
          if (err.message && err.message.includes("not found")) {
            data = null;
          } else {
            throw err;
          }
        }
      }

      // If no report found or forcing simulation
      if (!data) {
        // Test if profile and assessment exist first
        try {
          await api.getProfile();
          await api.getAssessment();
        } catch {
          // No profile/assessment found, redirect to assessment wizard
          router.push("/assessment");
          return;
        }
        // Both exist, trigger simulation run
        try {
          data = await api.runSimulation();
        } catch (simErr: any) {
          // If simulation fails due to missing data, redirect to assessment
          if (simErr.message?.includes("required") || simErr.message?.includes("not found")) {
            router.push("/assessment");
            return;
          }
          throw simErr;
        }
      }

      setReport(data);
    } catch (err: any) {
      setError(err.message || "Failed to load simulation dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex flex-col items-center justify-center text-center p-6">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-purple-500/10 border-t-purple-500 animate-spin" />
          <div className="absolute inset-2 rounded-full border-4 border-indigo-500/10 border-b-indigo-500 animate-spin [animation-direction:reverse]" />
        </div>
        <p className="text-gray-400 text-sm animate-pulse">Reconstructing Future Timelines...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Dashboard Loading Error</h2>
        <p className="text-gray-400 text-sm">{error}</p>
        <button
          onClick={() => loadData(true)}
          className="glass-btn flex items-center gap-2 px-6 py-2 rounded-lg text-white font-bold text-xs mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Trigger New Simulation Run</span>
        </button>
      </div>
    );
  }

  if (!report) return null;

  // Destructure scores for easier chart binding
  const { scores } = report;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Top Banner: Overview and Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-white/5 pb-6">
        <div className="text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/20 text-emerald-400 bg-emerald-500/5 text-xs font-semibold uppercase tracking-wider mb-2">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Simulation Compiled</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Your Future Simulator</h1>
          <p className="text-gray-400 text-xs mt-1">
            Analyzing 3 potential paths based on 10 behavioral and metrics agents.
          </p>
        </div>

        <div className="flex items-center gap-4 w-full lg:w-auto">
          <button
            onClick={() => router.push("/assessment")}
            className="flex-1 lg:flex-none glass-btn-secondary px-5 py-2.5 rounded-xl text-gray-300 hover:text-white text-xs font-bold transition-all border border-white/5 outline-none"
          >
            Edit Assessment
          </button>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex-1 lg:flex-none glass-btn px-6 py-2.5 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 outline-none"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Syncing..." : "Re-simulate Future"}</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Main Visuals & Timelines (8 Columns) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Dashboard Summary Widgets */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card-interactive border border-white/5 rounded-xl p-4 text-left">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Future Readiness</span>
              <p className="text-3xl font-extrabold text-purple-400 mt-1">{scores.futureReadinessScore}%</p>
            </div>
            <div className="glass-card-interactive border border-white/5 rounded-xl p-4 text-left">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Health Capacity</span>
              <p className="text-3xl font-extrabold text-emerald-400 mt-1">{scores.healthScore}/100</p>
            </div>
            <div className="glass-card-interactive border border-white/5 rounded-xl p-4 text-left">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Vocational Momentum</span>
              <p className="text-3xl font-extrabold text-indigo-400 mt-1">{scores.careerScore}/100</p>
            </div>
            <div className="glass-card-interactive border border-white/5 rounded-xl p-4 text-left">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Financial Security</span>
              <p className="text-3xl font-extrabold text-amber-400 mt-1">{scores.financeScore}/100</p>
            </div>
          </div>

          {/* Future Avatar Card */}
          <GlassCard className="border border-white/5 bg-slate-950/40 relative overflow-hidden" hoverEffect={false}>
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div className="space-y-4 text-left md:max-w-lg">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded border border-purple-500/20 text-purple-400 bg-purple-500/10 text-xs font-semibold uppercase tracking-wider">
                  <Award className="w-3.5 h-3.5" />
                  <span>Future Persona Avatar (2036)</span>
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-white">{report.avatar.name}</h2>
                  <p className="text-gray-400 text-sm mt-0.5">
                    Profession: <span className="text-white font-semibold">{report.avatar.profession}</span> • Living in <span className="text-white font-semibold">{report.avatar.city}</span>
                  </p>
                </div>
                <div className="flex gap-4 border-y border-white/5 py-3 text-xs">
                  <div>
                    <span className="text-gray-500">Projected Age</span>
                    <p className="text-sm font-bold text-white mt-0.5">{report.avatar.age} years old</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Projected Income</span>
                    <p className="text-sm font-bold text-emerald-400 mt-0.5">${report.avatar.income.toLocaleString()}/yr</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Personality Traits</span>
                  <div className="flex flex-wrap gap-2">
                    {report.avatar.personalityTraits.map((t: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] text-gray-300">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Achievements & Motto Column */}
              <div className="flex flex-col justify-between items-start md:items-end text-left md:text-right gap-4 md:max-w-xs">
                <div className="bg-white/2 rounded-xl p-4 border border-white/5 w-full">
                  <h4 className="text-xs font-bold text-purple-300 mb-2 uppercase tracking-wider">Future Motto</h4>
                  <p className="text-gray-300 text-xs italic leading-relaxed">
                    "{report.avatar.futureMotto}"
                  </p>
                </div>
                <div className="w-full">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Top Persona Achievements</span>
                  <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside md:list-none">
                    {report.avatar.topAchievements.map((a: string, i: number) => (
                      <li key={i} className="md:before:content-['✓_'] md:before:text-emerald-400">
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Timeline comparison View */}
          <GlassCard className="border border-white/5 bg-slate-950/40" hoverEffect={false}>
            <div className="border-b border-white/5 pb-4 mb-6 text-left">
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-purple-400" />
                <span>Simulated Timeline Chronicles</span>
              </h2>
              <p className="text-gray-400 text-xs mt-0.5">
                Switch timelines to compare how standard habits compound over a decade.
              </p>
            </div>
            <TimelineView stories={report.stories} />
          </GlassCard>

          {/* Letter from Future Self */}
          <GlassCard className="border border-white/5 bg-slate-950/40 relative overflow-hidden" hoverEffect={false}>
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-indigo-500/5 pointer-events-none" />
            <div className="border-b border-white/5 pb-4 mb-4 flex items-center gap-2 text-left">
              <Mail className="w-5 h-5 text-purple-400" />
              <div>
                <h2 className="text-xl font-extrabold text-white">Letter From Your Future Self (2036)</h2>
                <p className="text-gray-400 text-xs">An emotional message sent back from your 10-year projection (Timeline B).</p>
              </div>
            </div>
            <div className="bg-slate-950/50 p-6 rounded-xl border border-purple-500/10 text-left">
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line italic">
                {report.letter}
              </p>
            </div>
          </GlassCard>

          {/* Interactive Projections & Comparisons Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Wealth Line Chart */}
            <GlassCard className="border border-white/5 bg-slate-950/40" hoverEffect={false}>
              <h3 className="text-base font-bold text-white mb-1">Financial / Wealth Accumulation</h3>
              <p className="text-gray-400 text-xs mb-4">Comparison of savings curves over 10 years.</p>
              <FinanceProjection 
                startIncome={report.avatar.income / 1.6} 
                startSavings={scores.financeScore * 250} 
              />
            </GlassCard>

            {/* Score Bar Chart */}
            <GlassCard className="border border-white/5 bg-slate-950/40" hoverEffect={false}>
              <h3 className="text-base font-bold text-white mb-1">Metric Comparisons</h3>
              <p className="text-gray-400 text-xs mb-4">Final score projection across A, B, and C pathways.</p>
              <TimelineCompareBar 
                readinessScore={scores.futureReadinessScore}
                healthScore={scores.healthScore}
                careerScore={scores.careerScore}
                financeScore={scores.financeScore}
              />
            </GlassCard>
          </div>

        </div>

        {/* RIGHT COLUMN: Sidebars, Risks & Regrets (4 Columns) */}
        <div className="lg:col-span-4 space-y-8 text-left">
          
          {/* Radar Chart Panel */}
          <GlassCard className="border border-white/5 bg-slate-950/40" hoverEffect={false}>
            <h3 className="text-base font-bold text-white mb-1">Readiness Distribution</h3>
            <p className="text-gray-400 text-xs mb-4">Current life area balance chart.</p>
            <ReadinessRadar scores={scores} />
          </GlassCard>

          {/* Risk Analysis Card */}
          <GlassCard className="border border-white/5 bg-slate-950/40" hoverEffect={false}>
            <div className="flex items-center gap-1.5 text-rose-400 font-bold mb-1">
              <ShieldAlert className="w-4 h-4" />
              <h3 className="text-base text-white">Risk Analysis</h3>
            </div>
            <p className="text-gray-400 text-xs mb-4">Overall threat probabilities based on current stress, debt, and routine profiles.</p>
            
            <RiskAnalysisBar probabilities={report.probabilities} />
            
            <div className="mt-4 p-3 rounded-lg bg-white/2 border border-white/5 text-xs text-gray-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>
                {report.probabilities.burnout > 60 
                  ? "Elevated burnout probability detected. Recommend immediate sleep & task boundary adjustment." 
                  : "Risks represent stable boundaries. Maintaining current routines will protect mental stress indices."}
              </span>
            </div>
          </GlassCard>

          {/* Opportunity Detector */}
          <GlassCard className="border border-white/5 bg-slate-950/40" hoverEffect={false}>
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-purple-400" />
              <span>Opportunity Detector</span>
            </h3>
            <p className="text-gray-400 text-xs mb-4">Ranked options to accelerate into Timeline C.</p>
            
            <div className="space-y-3">
              {report.opportunities.map((o: any, i: number) => (
                <div key={i} className="flex gap-2.5 items-start p-2.5 rounded bg-white/2 border border-white/5">
                  <div className="w-5 h-5 rounded bg-purple-950/30 border border-purple-500/25 flex items-center justify-center text-[10px] text-purple-400 font-bold shrink-0 mt-0.5">
                    {o.rank}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{o.opportunity}</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">Impact: <span className="text-emerald-400 font-semibold">{o.impact}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Regret Predictor */}
          <GlassCard className="border border-white/5 bg-slate-950/40" hoverEffect={false}>
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-rose-400" />
              <span>Regret Predictor</span>
            </h3>
            <p className="text-gray-400 text-xs mb-4">Top 5 projected regrets if Timeline A persists.</p>
            
            <div className="space-y-3">
              {report.regrets.map((r: any, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-rose-950/10 border border-rose-500/10 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-extrabold text-rose-400">{i + 1}. {r.regret}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-relaxed"><strong className="text-gray-300">Why:</strong> {r.why}</p>
                  <p className="text-[10px] text-gray-400 leading-relaxed"><strong className="text-emerald-400">Action:</strong> {r.howToAvoid}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Actionable Recommendations */}
          <GlassCard className="border border-white/5 bg-slate-950/40" hoverEffect={false}>
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-indigo-400" />
              <span>AI Core Recommendations</span>
            </h3>
            <p className="text-gray-400 text-xs mb-4">Priority actions to transition toward optimal futures.</p>

            <div className="space-y-2.5">
              {report.recommendations.map((rec: any, idx: number) => {
                const colors = rec.category === "Health" ? "text-rose-400 bg-rose-500/5 border-rose-500/10" : rec.category === "Finance" ? "text-amber-400 bg-amber-500/5 border-amber-500/10" : "text-purple-400 bg-purple-500/5 border-purple-500/10";
                const Icon = rec.category === "Health" ? Heart : rec.category === "Finance" ? DollarSign : rec.category === "Growth" ? BookOpen : Compass;
                return (
                  <div key={idx} className={`p-3 rounded-xl border flex gap-2.5 items-start ${colors}`}>
                    <Icon className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-white leading-relaxed">{rec.action}</p>
                      <div className="flex items-center gap-2 mt-1 text-[9px] text-gray-400 uppercase font-semibold tracking-wider">
                        <span>{rec.category}</span>
                        <span>•</span>
                        <span>Impact: {rec.impact}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

        </div>

      </div>
      
      {/* Dynamic Navigation to What-If simulator */}
      <div className="glass-card-interactive border border-white/5 rounded-2xl p-6 bg-gradient-to-r from-indigo-950/15 via-slate-950/30 to-purple-950/15 flex flex-col md:flex-row items-center justify-between gap-6 text-left">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span>Explore alternative outcomes in the What-If Simulator</span>
          </h3>
          <p className="text-gray-400 text-xs max-w-xl">
            "What if I start a startup?" or "What if I exercise daily?" Type custom decisions and see how they instantly alter your 10-year readiness curves.
          </p>
        </div>
        <button
          onClick={() => router.push("/whatif")}
          className="w-full md:w-auto flex items-center justify-center gap-1 px-6 py-3 rounded-xl glass-btn text-white font-bold text-xs shrink-0 hover:scale-[1.02] transition-transform outline-none"
        >
          <span>Open What-If Simulator</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
