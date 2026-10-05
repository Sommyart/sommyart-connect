import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

const REASONS = ["Spam", "Harassment", "Hate or abusive content", "Scam", "Inappropriate content", "Impersonation", "Other"];
export const COLLAB_CATEGORIES = [
  "AI projects", "Graphic design", "UI/UX", "Web development", "AI photography", "AI video",
  "AI music", "Automation", "Branding", "Content creation", "Other technology",
];

export function ReportUserDialog({
  open, onOpenChange, reporterId, reportedId, name,
}: { open: boolean; onOpenChange: (v: boolean) => void; reporterId: string; reportedId: string; name: string }) {
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true);
    const { error } = await supabase.from("user_reports").insert({
      reporter_id: reporterId, reported_id: reportedId, reason, details: details.trim().slice(0, 1000) || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Report sent to the admins");
    setDetails("");
    onOpenChange(false);
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Report {name}</DialogTitle></DialogHeader>
        <div className="grid gap-2">
          {REASONS.map((r) => (
            <button key={r} type="button" onClick={() => setReason(r)}
              className={`rounded-lg border px-3 py-2 text-left text-sm font-semibold ${reason === r ? "border-primary bg-secondary text-primary" : "border-border"}`}>
              {r}
            </button>
          ))}
          <Textarea placeholder="Additional information (optional)" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000} />
          <Button disabled={busy} onClick={() => void submit()}>Send report</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CollabDialog({
  open, onOpenChange, senderId, recipientId, name, projectId,
}: { open: boolean; onOpenChange: (v: boolean) => void; senderId: string; recipientId: string; name: string; projectId?: string }) {
  const [category, setCategory] = useState(COLLAB_CATEGORIES[0]);
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() {
    if (topic.trim().length < 3) return toast.error("Describe the project or topic");
    setBusy(true);
    const { error } = await supabase.from("collaboration_requests").insert({
      sender_id: senderId, recipient_id: recipientId, category, topic: topic.trim().slice(0, 200),
      message: message.trim().slice(0, 1000), project_id: projectId ?? null,
    });
    setBusy(false);
    if (error) return toast.error("Could not send the request");
    toast.success("Collaboration request sent");
    setTopic(""); setMessage("");
    onOpenChange(false);
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Collaborate with {name}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="flex flex-wrap gap-1.5">
            {COLLAB_CATEGORIES.map((c) => (
              <button key={c} type="button" onClick={() => setCategory(c)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${category === c ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}>
                {c}
              </button>
            ))}
          </div>
          <Input placeholder="Project / topic" value={topic} onChange={(e) => setTopic(e.target.value)} />
          <Textarea placeholder="What would you like to collaborate on?" value={message} onChange={(e) => setMessage(e.target.value)} rows={4} />
          <Button disabled={busy} onClick={() => void submit()}>Send collaboration request</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
