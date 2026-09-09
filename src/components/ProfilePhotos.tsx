import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Media, Avatar } from "@/components/Media";
import { PhotoCropDialog } from "@/components/PhotoCropDialog";
import { Button } from "@/components/ui/button";
import { cropAreaAndCompress, type PixelCrop, validateImageFile } from "@/lib/image";
import { uploadMedia } from "@/lib/storage";

type Props = {
  userId: string;
  name: string;
  avatarPath: string | null;
  coverPath: string | null;
  onChange: (patch: { avatar_url?: string | null; cover_url?: string | null }) => Promise<void>;
};

export function ProfilePhotos({ userId, name, avatarPath, coverPath, onChange }: Props) {
  const avatarInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"avatar" | "cover" | null>(null);
  const [pending, setPending] = useState<{ kind: "avatar" | "cover"; url: string } | null>(null);

  async function handle(kind: "avatar" | "cover", file: File | undefined) {
    if (!file) return;
    const problem = validateImageFile(file);
    if (problem) return toast.error(problem);
    setPending({ kind, url: URL.createObjectURL(file) });
  }

  function closeCrop() {
    if (pending) URL.revokeObjectURL(pending.url);
    setPending(null);
  }

  async function uploadCrop(area: PixelCrop) {
    if (!pending) return;
    const kind = pending.kind;
    setBusy(kind);
    try {
      const blob = await cropAreaAndCompress(pending.url, area, kind === "avatar" ? 512 : 1200, kind === "avatar" ? 512 : 675);
      const path = await uploadMedia(userId, blob, "jpg");
      await onChange(kind === "avatar" ? { avatar_url: path } : { cover_url: path });
      toast.success(kind === "avatar" ? "Profile photo updated" : "Cover photo updated");
      closeCrop();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(null);
    }
  }

  async function remove(kind: "avatar" | "cover") {
    setBusy(kind);
    try {
      await onChange(kind === "avatar" ? { avatar_url: null } : { cover_url: null });
      toast.success("Photo removed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="bg-card/85 shadow-card border-border/60 overflow-hidden rounded-3xl border backdrop-blur-xl">
      <div className="bg-gradient-brand relative aspect-[16/9] w-full">
        {coverPath && <Media path={coverPath} alt="Cover photo" className="h-full w-full object-cover" />}
        <div className="absolute top-2 right-2 flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="press h-8 rounded-full px-3 text-xs font-bold"
            disabled={busy !== null}
            onClick={() => coverInput.current?.click()}
          >
            {busy === "cover" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <Camera className="h-3.5 w-3.5" aria-hidden />
            )}
            <span className="ml-1">Cover</span>
          </Button>
          {coverPath && (
            <Button
              size="sm"
              variant="secondary"
              aria-label="Remove cover photo"
              className="press h-8 w-8 rounded-full p-0"
              disabled={busy !== null}
              onClick={() => void remove("cover")}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-end gap-3 px-5 pt-0 pb-5">
        <div className="-mt-10">
          <div className="border-card rounded-full border-4">
            <Avatar path={avatarPath} name={name} size={80} />
          </div>
        </div>
        <div className="flex flex-1 flex-wrap gap-2 pb-1">
          <Button
            size="sm"
            variant="secondary"
            className="press h-9 rounded-full px-3 text-xs font-bold"
            disabled={busy !== null}
            onClick={() => avatarInput.current?.click()}
          >
            {busy === "avatar" ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <Camera className="mr-1 h-3.5 w-3.5" aria-hidden />
            )}
            {avatarPath ? "Change photo" : "Add photo"}
          </Button>
          {avatarPath && (
            <Button
              size="sm"
              variant="ghost"
              className="press h-9 rounded-full px-3 text-xs font-bold"
              disabled={busy !== null}
              onClick={() => void remove("avatar")}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" aria-hidden /> Remove
            </Button>
          )}
        </div>
      </div>

      <input
        ref={avatarInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => void handle("avatar", e.target.files?.[0])}
      />
      <input
        ref={coverInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => void handle("cover", e.target.files?.[0])}
      />
      <PhotoCropDialog
        key={pending?.url ?? "closed"}
        imageUrl={pending?.url ?? null}
        kind={pending?.kind ?? "avatar"}
        busy={busy !== null}
        onCancel={closeCrop}
        onConfirm={(area) => void uploadCrop(area)}
      />
    </section>
  );
}
