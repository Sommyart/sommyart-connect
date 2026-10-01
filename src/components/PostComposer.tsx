import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ImagePlus, Link2, Loader2, Send, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MentionInput } from "@/components/MentionInput";
import { useCreatePost } from "@/hooks/use-feed";
import { compressImage, validateImageFile } from "@/lib/image";
import { uploadMedia } from "@/lib/storage";

const MAX_IMAGES = 8;

/** Composer for text with mentions/hashtags, multiple images (reorderable), and a link. */
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
      if (next.length >= MAX_IMAGES) {
        toast.error(`Up to ${MAX_IMAGES} images per post`);
        break;
      }
      const problem = validateImageFile(file);
      if (problem) {
        toast.error(problem);
        continue;
      }
      next.push({ file, preview: URL.createObjectURL(file) });
    }
    setFiles(next);
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= files.length) return;
    const next = [...files];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setFiles(next);
  }

  function removeAt(index: number) {
    URL.revokeObjectURL(files[index].preview);
    setFiles(files.filter((_, i) => i !== index));
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
    <section className="bg-card border-border shadow-soft rounded-xl border p-4">
      <MentionInput
        ariaLabel="Share an update"
        placeholder="Share a win, a question, AI art or what you're building… use @ to mention and # for topics"
        value={content}
        onChange={setContent}
      />

      {files.length > 0 && (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-8">
          {files.map((item, index) => (
            <div key={item.preview} className="group relative">
              <img
                src={item.preview}
                alt={`Attachment ${index + 1}`}
                loading="lazy"
                className="aspect-square w-full rounded-lg object-cover"
              />
              <button
                aria-label={`Remove image ${index + 1}`}
                className="bg-background/90 absolute -top-1.5 -right-1.5 rounded-full p-1 shadow"
                onClick={() => removeAt(index)}
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
              {index > 0 && (
                <button
                  aria-label={`Move image ${index + 1} earlier`}
                  className="bg-background/90 absolute bottom-1 left-1 rounded-full p-0.5 opacity-80 shadow"
                  onClick={() => move(index, index - 1)}
                >
                  <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
                </button>
              )}
              {index < files.length - 1 && (
                <button
                  aria-label={`Move image ${index + 1} later`}
                  className="bg-background/90 absolute right-1 bottom-1 rounded-full p-0.5 opacity-80 shadow"
                  onClick={() => move(index, index + 1)}
                >
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showLink && (
        <Input
          className="mt-3 rounded-xl"
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
          className="press rounded-xl"
          aria-label="Add images"
          onClick={() => fileInput.current?.click()}
        >
          <ImagePlus className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          type="button"
          size="icon"
          variant={showLink ? "default" : "secondary"}
          className="press rounded-xl"
          aria-label="Add link"
          onClick={() => setShowLink((v) => !v)}
        >
          <Link2 className="h-4 w-4" aria-hidden />
        </Button>
        <span className="text-muted-foreground text-xs font-semibold tabular-nums">
          {files.length}/{MAX_IMAGES}
        </span>
        <Button
          className="press ml-auto h-11 flex-1 rounded-xl"
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
