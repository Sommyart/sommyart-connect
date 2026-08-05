import { useRef, useState } from "react";
import { ImagePlus, Link2, Loader2, Send, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePost } from "@/hooks/use-feed";
import { compressImage, validateImageFile } from "@/lib/image";
import { uploadMedia } from "@/lib/storage";

/** Composer for text, up to four images and an optional link. */
export function PostComposer({ userId }: { userId: string }) {
  const createPost = useCreatePost();
  const fileInput = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState("");
  const [link, setLink] = useState("");
  const [showLink, setShowLink] = useState(false);
  const [files, setFiles] = useState<{ file: File; preview: string }[]>([]);
  const [busy, setBusy] = useState(false);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = [...files];
    for (const file of Array.from(list)) {
      if (next.length >= 4) break;
      const problem = validateImageFile(file);
      if (problem) {
        toast.error(problem);
        continue;
      }
      next.push({ file, preview: URL.createObjectURL(file) });
    }
    setFiles(next);
  }

  async function publish() {
    if (content.trim().length < 3 && files.length === 0) return;
    setBusy(true);
    try {
      const paths: string[] = [];
      for (const item of files) {
        const blob = await compressImage(item.file);
        paths.push(await uploadMedia(userId, blob, "jpg"));
      }
      await createPost.mutateAsync({
        author_id: userId,
        content: content.trim(),
        media_urls: paths,
        media_type: paths.length ? "image" : "none",
        link_url: link.trim() ? link.trim() : null,
      });
      files.forEach((f) => URL.revokeObjectURL(f.preview));
      setContent("");
      setLink("");
      setShowLink(false);
      setFiles([]);
      toast.success("Posted to the community");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not post");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bg-card/85 shadow-card border-border/60 rounded-3xl border p-4 backdrop-blur-xl">
      <Textarea
        aria-label="Share an update"
        rows={3}
        className="rounded-2xl"
        placeholder="Share a win, a question, AI art or what you're building…"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      {files.length > 0 && (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {files.map((item, index) => (
            <div key={item.preview} className="relative">
              <img
                src={item.preview}
                alt={`Attachment ${index + 1}`}
                className="aspect-square w-full rounded-xl object-cover"
              />
              <button
                aria-label="Remove image"
                className="bg-background/90 absolute -top-1.5 -right-1.5 rounded-full p-1 shadow"
                onClick={() => setFiles(files.filter((_, i) => i !== index))}
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      )}

      {showLink && (
        <Input
          className="mt-3 rounded-2xl"
          placeholder="https://…"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          aria-label="Link"
        />
      )}

      <div className="mt-3 flex items-center gap-2">
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="press rounded-2xl"
          aria-label="Add images"
          onClick={() => fileInput.current?.click()}
        >
          <ImagePlus className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          type="button"
          size="icon"
          variant={showLink ? "default" : "secondary"}
          className="press rounded-2xl"
          aria-label="Add link"
          onClick={() => setShowLink((v) => !v)}
        >
          <Link2 className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          className="press h-11 flex-1 rounded-2xl"
          disabled={busy || (content.trim().length < 3 && files.length === 0)}
          onClick={() => void publish()}
        >
          {busy ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Send className="mr-1 h-4 w-4" aria-hidden />
          )}
          Post
        </Button>
      </div>
    </section>
  );
}
