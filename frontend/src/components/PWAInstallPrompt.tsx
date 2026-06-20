"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Share, PlusSquare, Info } from "lucide-react";

export const PWAInstallPrompt: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check if already in standalone (installed) mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;

    if (isStandalone) return;

    // Check if dismissed in this session
    const dismissed = sessionStorage.getItem("pwa-prompt-dismissed") === "true";
    if (dismissed) return;

    // Detect iOS
    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Listen for Chrome/Android install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // If iOS (Safari doesn't support beforeinstallprompt but is installable)
    if (ios) {
      setShowPrompt(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // Toggle iOS instruction modal
      setIsOpen(true);
      return;
    }

    if (!deferredPrompt) return;

    // Show native browser install prompt
    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);

    // Clear prompt state
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem("pwa-prompt-dismissed", "true");
  };

  if (!mounted || !showPrompt || isDismissed) return null;

  return (
    <>
      {/* Floating Prompt Banner (Bottom-Left) */}
      <div
        className="fixed bottom-6 left-6 z-40 max-w-sm w-[calc(100vw-32px)] sm:w-80 rounded-2xl border border-white/10 p-4 transition-all duration-300 animate-fade-in shadow-2xl"
        style={{
          background: "rgba(10, 11, 22, 0.95)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(99, 102, 241, 0.15) inset",
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/25">
              <Download className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="text-white text-xs font-bold tracking-wide">
                GET THE MOBILE APP
              </h4>
              <p className="text-gray-400 text-[11px] leading-relaxed mt-0.5">
                Install Future Self Simulator on your phone for offline tracking & seamless access!
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-500 hover:text-white p-0.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={handleInstallClick}
            className="flex-grow flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install App</span>
          </button>
          <button
            onClick={() => setIsOpen(true)}
            className="px-3 py-1.5 rounded-xl border border-white/10 hover:border-white/20 text-gray-300 text-xs font-semibold hover:bg-white/5 transition-all"
          >
            Guide
          </button>
        </div>
      </div>

      {/* iOS Instructions & Installation Guide Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div
            className="w-full max-w-md rounded-3xl border border-white/10 p-6 shadow-2xl relative"
            style={{
              background: "rgba(10, 11, 22, 0.98)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
            }}
          >
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                <Info className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-white text-base font-bold">Install on your Device</h3>
                <p className="text-gray-500 text-xs">Run this web application as a native app</p>
              </div>
            </div>

            {isIOS ? (
              <div className="space-y-4">
                <p className="text-gray-300 text-xs leading-relaxed">
                  Safari on iOS does not support direct one-click installation prompts. Follow these quick steps to add the app:
                </p>
                <div className="space-y-3 bg-white/5 rounded-2xl p-4 border border-white/5">
                  <div className="flex gap-3 items-start">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                      1
                    </span>
                    <p className="text-gray-300 text-xs pt-0.5">
                      Open this website in your <strong className="text-white font-semibold">Safari browser</strong>.
                    </p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                      2
                    </span>
                    <p className="text-gray-300 text-xs pt-0.5 flex items-center gap-1.5 flex-wrap">
                      Tap the <strong className="text-white font-semibold">Share button</strong>
                      <span className="inline-flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded text-[10px] text-indigo-300 font-bold border border-white/5">
                        <Share className="w-3 h-3" /> Share
                      </span>
                      in Safari's bottom toolbar.
                    </p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                      3
                    </span>
                    <p className="text-gray-300 text-xs pt-0.5 flex items-center gap-1.5 flex-wrap">
                      Scroll down and select
                      <span className="inline-flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded text-[10px] text-indigo-300 font-bold border border-white/5">
                        <PlusSquare className="w-3 h-3" /> Add to Home Screen
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-300 text-xs leading-relaxed">
                  Easily add Future Self Simulator to your home screen on Android or Desktop:
                </p>
                <div className="space-y-3 bg-white/5 rounded-2xl p-4 border border-white/5">
                  <div className="flex gap-3 items-start">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                      1
                    </span>
                    <p className="text-gray-300 text-xs pt-0.5">
                      Click the <strong className="text-white font-semibold">"Install App"</strong> button inside the app card (or the browser's install icon in the URL bar).
                    </p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                      2
                    </span>
                    <p className="text-gray-300 text-xs pt-0.5">
                      Accept the browser confirmation prompt.
                    </p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                      3
                    </span>
                    <p className="text-gray-300 text-xs pt-0.5">
                      Launch the app directly from your home screen or app drawer!
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleInstallClick}
                  disabled={!deferredPrompt && !isIOS}
                  className="w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-98"
                >
                  <Download className="w-4 h-4" />
                  <span>Install App Now</span>
                </button>
              </div>
            )}

            <button
              onClick={() => setIsOpen(false)}
              className="mt-6 w-full py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold transition-all border border-white/5"
            >
              Close Guide
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallPrompt;
