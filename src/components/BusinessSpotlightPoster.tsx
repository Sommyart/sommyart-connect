import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ImagePlus, Loader2, Lock, Store, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createBusinessPost } from "@/lib/business.functions";
import { cropSquareAndCompress, validateImageFile } from "@/lib/image";
import { uploadImageBlob } from "@/lib/members";
import { getToken } from "@/lib/session";

type Draft = { blob: Blob; url: string };

/** Business Spotlight posting — open on Tuesdays only (Africa/Lagos). */
export function BusinessSpotlightPoster() {
  const queryClient = useQueryClient();
  const post = useServerFn(createBusinessPost);
  const fileRef = useRef<HTMLInputElement>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [name, setName] = useState("");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);

  const isTuesday =
    new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Lagos", weekday: "short" }).format(
      new Date(),
    ) === "Tue";

  async function pick(files: FileList | null) {
    if (!files) return;
    const room = 3 - drafts.length;
    if (room <= 0) {
      toast.error("You can post up to 3 pictures");
      return;
    }
    for (const file of Array.from(files).slice(0, room)) {
      const problem = validateImageFile(file);
      if (problem) {
        toast.error(problem);
        continue;
      }
      const blob = await cropSquareAndCompress(file, 720);
      setDrafts((d) => [...d, { blob, url: URL.createObjectURL(blob) }]);
    }
  }

  async function submit() {
    const token = getToken();
    if (!token) return;
    if (!name.trim()) {
      toast.error("Add your business name");
      return;
    }
    if (drafts.length === 0) {
      toast.error("Add at least one picture");
      return;
    }
    setBusy(true);
    try {
      const images = [];
      for (const d of drafts) images.push(await uploadImageBlob(d.blob, "business/"));
      await post({ data: { token, business_name: name.trim(), caption, images } });
      setDrafts([]);
      setName("");
      setCaption("");
      await queryClient.invalidateQueries({ queryKey: ["business-posts"] });
      toast.success("Your business is now in the spotlight!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not publish your post");
    } finally {
      setBusy(false);
    }
  }

  if (!isTuesday) {
    return (
      <div className="bg-card/70 border-border/60 flex items-center gap-3 rounded-3xl border p-5">
        <div className="bg-secondary text-muted-foreground flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
          <Lock className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h3 className="text-card-foreground text-sm font-bold">Business Spotlight is closed</h3>
          <p className="text-muted-foreground text-xs">
            Posting opens every Tuesday — share up to 3 pictures of your business.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="bg-card/85 shadow-card border-border/60 animate-fade-up rounded-3xl border p-5 backdrop-blur-xl">
      <h3 className="text-card-foreground flex items-center gap-2 font-bold">
        <Store className="text-primary h-5 w-5" aria-hidden /> Post your business
      </h3>
      <p className="text-muted-foreground mt-1 text-xs">
        Tuesday only • up to 3 pictures (JPG, PNG or WEBP, max 5MB each)
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {drafts.map((d, i) => (
          <div key={d.url} className="relative">
            <img src={d.url} alt="" className="aspect-square w-full rounded-2xl object-cover" />
            <button
              aria-label="Remove picture"
              className="bg-background/90 absolute top-1 right-1 rounded-full p-1"
              onClick={() => setDrafts((prev) => prev.filter((_, idx) => idx !== i))}
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        ))}
        {drafts.length < 3 && (
          <button
            className="border-border text-muted-foreground hover:text-primary flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-2xl border border-dashed text-[10px]"
            onClick={() => fileRef.current?.click()}
          >
            <ImagePlus className="h-5 w-5" aria-hidden /> Add
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => void pick(e.target.files)}
      />

      <div className="mt-4 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="biz-name">Business name</Label>
          <Input
            id="biz-name"
            className="h-11 rounded-2xl"
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="biz-caption">What do you offer?</Label>
          <Textarea
            id="biz-caption"
            rows={2}
            maxLength={300}
            className="rounded-2xl"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
        </div>
        <Button className="press h-12 w-full rounded-2xl" disabled={busy} onClick={() => void submit()}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
          Publish to spotlight
        </Button>
      </div>
    </section>
  );
}
