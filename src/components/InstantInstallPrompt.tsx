import { useEffect, useState } from "react";
import { Share, Smartphone, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useInstallPrompt } from "@/hooks/use-install-prompt";

const DISMISS_KEY = "sommyart-install-prompt-dismissed";

export function InstantInstallPrompt() {
  const { canInstall, installed, isIos, install } = useInstallPrompt();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "true");
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    if (installed) {
      setOpen(false);
      try {
        localStorage.setItem(DISMISS_KEY, "true");
      } catch {
        // ignore
      }
      return;
    }
    if (!mounted || dismissed) return;
    if (!canInstall && !isIos) return;

    const timer = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(timer);
  }, [mounted, canInstall, isIos, installed, dismissed]);

  const handleDismiss = () => {
    setOpen(false);
    try {
      localStorage.setItem(DISMISS_KEY, "true");
    } catch {
      // ignore
    }
    setDismissed(true);
  };

  const handleInstall = async () => {
    const accepted = await install();
    if (accepted) {
      setOpen(false);
    }
  };

  if (!mounted) return null;

  return (
    <Dialog open={open} onOpenChange={(value) => !value && handleDismiss()}>
      <DialogContent className="max-w-sm rounded-3xl border-border/60 bg-card p-0 shadow-card sm:max-w-md">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 z-10 rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>

        <div className="bg-gradient-brand flex items-center justify-center rounded-t-3xl p-6">
          <div className="bg-card/20 flex h-20 w-20 items-center justify-center rounded-3xl backdrop-blur-sm">
            <img
              src="/icons/icon-192.png"
              alt="SOMMYART CONNECT app icon"
              className="h-14 w-14 rounded-2xl shadow-lg"
            />
          </div>
        </div>

        <DialogHeader className="px-5 pt-4 pb-2 text-center">
          <DialogTitle className="text-card-foreground text-xl font-black tracking-tight">
            Install SOMMYART CONNECT
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Get faster access, offline support and a full-screen app experience.
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 pb-6">
          {isIos && !canInstall ? (
            <div className="bg-secondary rounded-2xl p-4 text-center">
              <p className="text-secondary-foreground text-sm font-semibold">
                Tap <Share className="mx-1 inline h-4 w-4" aria-hidden /> then{" "}
                <span className="font-bold">Add to Home Screen</span>.
              </p>
            </div>
          ) : (
            <Button
              onClick={handleInstall}
              className="press h-12 w-full rounded-2xl text-base font-bold"
            >
              <Smartphone className="mr-2 h-5 w-5" aria-hidden />
              Install Now
            </Button>
          )}

          <button
            onClick={handleDismiss}
            className="text-muted-foreground mt-3 w-full text-center text-xs font-semibold underline"
          >
            Not now
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
