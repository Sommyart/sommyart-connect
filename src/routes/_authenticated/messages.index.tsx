import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/messages/")({
  component: () => (
    <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
      <MessageCircle className="text-primary h-10 w-10" />
      <p className="text-sm font-semibold">Select a conversation to start messaging.</p>
    </div>
  ),
});
