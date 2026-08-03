import { Smartphone, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/use-install-prompt";

export function InstallCard() {
  const { canInstall, installed, isIos, install } = useInstallPrompt();

  if (installed) return null;
  if (!canInstall && !isIos) return null;

  return (
    <div className="bg-card shadow-card animate-fade-up rounded-3xl p-5">
      <div className="flex items-start gap-3">
        <div className="bg-gradient-brand text-primary-foreground animate-float flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
          <Smartphone className="h-5 w-5" aria-hidden />
        </div>
        <div className="flex-1">
          <h3 className="text-card-foreground font-bold">📱 Install SOMMYART CONNECT</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Get faster access by installing the app on your device.
          </p>
          {isIos && !canInstall ? (
            <p className="text-muted-foreground mt-3 flex items-center gap-1.5 text-xs">
              <Share className="h-3.5 w-3.5" aria-hidden />
              Tap Share, then “Add to Home Screen”.
            </p>
          ) : (
            <Button className="press mt-3 w-full rounded-2xl" onClick={() => void install()}>
              Install Now
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
