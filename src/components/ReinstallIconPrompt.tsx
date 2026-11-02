import { useEffect, useState } from "react";
import { RefreshCw, Share, Smartphone, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useInstallPrompt } from "@/hooks/use-install-prompt";

// Bump this key whenever the launcher icon changes so installed users are
// prompted once to reinstall and pick up the new icon.
const DISMISS_KEY = "sommyart-reinstall-icon-v2-dismissed";

export function ReinstallIconPrompt() {
  const { installed, isIos, canInstall, install } = useInstallPrompt();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setMounted(true);
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "true");
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    // Only users who already installed the app (old icon cached) need this.
    if (!mounted || dismissed || !installed) return;
    const timer = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(timer);
  }, [mounted, installed, dismissed]);

  const handleDismiss = () => {
    setOpen(false);
    try {
      localStorage.setItem(DISMISS_KEY, "true");
    } catch {
      // ignore
    }
    setDismissed(true);
  };

  const handleReinstall = async () => {
    if (canInstall) {
      await install();
    }
    handleDismiss();
  };

  if (!mounted || !installed) return null;

  return (
    <Dialog open={open} onOpenChange={(value) => !value && handleDismiss()}>
      <DialogContent className="max-w-sm rounded-3xl border-border/60 bg-card p-0 shadow-card sm:max-w-md">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 z-10 rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Dismiss reinstall prompt"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>

        <div className="bg-gradient-brand flex items-center justify-center rounded-t-3xl p-6">
          <div className="bg-card/20 flex h-20 w-20 items-center justify-center rounded-3xl backdrop-blur-sm">
            <img
              src="/icons/icon-192.png"
              alt="New SOMMYART CONNECT app icon"
              className="h-14 w-14 rounded-2xl shadow-lg"
            />
          </div>
        </div>

        <DialogHeader className="px-5 pt-4 pb-2 text-center">
          <DialogTitle className="text-card-foreground text-xl font-black tracking-tight">
            We have a new app icon
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Your home screen still shows the old logo. Reinstall the app to get
            the new SOMMYART CONNECT icon.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 px-5 pb-6">
          <div className="bg-secondary space-y-2 rounded-2xl p-4 text-sm">
            <p className="text-secondary-foreground flex items-start gap-2 font-semibold">
              <Trash2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {isIos
                ? "Press and hold the app icon on your home screen, then tap Remove App."
                : "Press and hold the app icon on your home screen, then tap Uninstall or Remove."}
            </p>
            <p className="text-secondary-foreground flex items-start gap-2 font-semibold">
              {isIos ? (
                <Share className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              ) : (
                <Smartphone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              )}
              {isIos
                ? "Open SOMMYART CONNECT in Safari, tap Share, then Add to Home Screen."
                : "Open SOMMYART CONNECT in your browser and tap Install when prompted."}
            </p>
          </div>

          {!isIos && canInstall && (
            <Button
              onClick={handleReinstall}
              className="press h-12 w-full rounded-2xl text-base font-bold"
            >
              <RefreshCw className="mr-2 h-5 w-5" aria-hidden />
              Reinstall Now
            </Button>
          )}

          <button
            onClick={handleDismiss}
            className="text-muted-foreground w-full text-center text-xs font-semibold underline"
          >
            Maybe later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
