import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Camera, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { updateProfilePicture } from "@/lib/profile.functions";
import { cropSquareAndCompress, validateImageFile } from "@/lib/image";
import { getPictureUrl, uploadImageBlob } from "@/lib/members";
import { getToken } from "@/lib/session";
import type { PublicMember } from "@/lib/member-types";

export function ProfilePictureEditor({ member }: { member: PublicMember }) {
  const queryClient = useQueryClient();
  const save = useServerFn(updateProfilePicture);
  const fileRef = useRef<HTMLInputElement>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    getPictureUrl(member.profile_picture).then((url) => active && setCurrent(url));
    return () => {
      active = false;
    };
  }, [member.profile_picture]);

  async function pick(file: File | undefined) {
    if (!file) return;
    const problem = validateImageFile(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    try {
      const blob = await cropSquareAndCompress(file);
      setPendingBlob(blob);
      setPreview(URL.createObjectURL(blob));
    } catch {
      toast.error("Could not read that image");
    }
  }

  async function commit(path: string | null) {
    const token = getToken();
    if (!token) return;
    setBusy(true);
    try {
      await save({ data: { token, path } });
      await queryClient.invalidateQueries();
      setPendingBlob(null);
      setPreview(null);
      toast.success(path ? "Profile picture updated" : "Profile picture removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update your photo");
    } finally {
      setBusy(false);
    }
  }

  async function savePhoto() {
    if (!pendingBlob) return;
    setBusy(true);
    try {
      const path = await uploadImageBlob(pendingBlob, "profiles/");
      setBusy(false);
      await commit(path);
    } catch {
      setBusy(false);
      toast.error("Upload failed, please try again");
    }
  }

  const shown = preview ?? current;

  return (
    <section className="bg-card/85 shadow-card border-border/60 rounded-3xl border p-5 backdrop-blur-xl">
      <h2 className="text-card-foreground flex items-center gap-2 font-bold">
        <Camera className="text-primary h-5 w-5" aria-hidden /> Profile picture
      </h2>

      <div className="mt-4 flex items-center gap-4">
        <div className="bg-gradient-brand shadow-glow h-24 w-24 shrink-0 overflow-hidden rounded-full p-[3px]">
          {shown ? (
            <img src={shown} alt="Profile preview" className="h-full w-full rounded-full object-cover" />
          ) : (
            <div className="bg-secondary text-primary flex h-full w-full items-center justify-center rounded-full text-2xl font-extrabold">
              {member.nickname.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-xs leading-relaxed">
            JPG, PNG or WEBP • max 5MB. Photos are cropped to a square and used everywhere in the
            app.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => void pick(e.target.files?.[0])}
          />
          <Button
            variant="secondary"
            size="sm"
            className="press mt-3 rounded-xl"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="mr-1 h-4 w-4" aria-hidden /> Upload new photo
          </Button>
        </div>
      </div>

      {preview && (
        <div className="mt-4 flex gap-2">
          <Button className="press h-11 flex-1 rounded-2xl" disabled={busy} onClick={() => void savePhoto()}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
            Save photo
          </Button>
          <Button
            variant="secondary"
            className="press h-11 rounded-2xl"
            disabled={busy}
            onClick={() => {
              setPreview(null);
              setPendingBlob(null);
            }}
          >
            Cancel
          </Button>
        </div>
      )}

      {!preview && member.profile_picture && (
        <Button
          variant="secondary"
          className="press mt-4 h-11 w-full rounded-2xl"
          disabled={busy}
          onClick={() => void commit(null)}
        >
          <Trash2 className="mr-1 h-4 w-4" aria-hidden /> Remove photo
        </Button>
      )}
    </section>
  );
}
