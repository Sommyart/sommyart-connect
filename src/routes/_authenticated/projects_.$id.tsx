import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Copy, ExternalLink, Eye, Handshake, Heart, Linkedin, MessageCircle, Twitter } from "lucide-react";
import { toast } from "sonner";

import { AppNav } from "@/components/AppNav";
import { Avatar, Media } from "@/components/Media";
import { ProfileLink } from "@/components/ProfileLink";
import { CollabDialog } from "@/components/UserActionDialogs";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/use-auth";
import { useToggleProjectLike } from "@/hooks/use-projects";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/projects_/$id")({
  head: () => ({
    meta: [
      { title: "Project — SOMMYART CONNECT" },
      { name: "description", content: "An AI and tech project from the SOMMYART CONNECT creator community." },
      { property: "og:title", content: "Project — SOMMYART CONNECT" },
      { property: "og:description", content: "An AI and tech project from the creator community." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProjectPage,
});

function ProjectPage() {
  const { id } = Route.useParams();
  const { user } = useMe();
  const like = useToggleProjectLike();
  const [collab, setCollab] = useState(false);
  const q = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("*, profiles:owner_id(id,username,full_name,avatar_url), project_likes(user_id), project_comments(id)")
        .eq("id", id)
        .maybeSingle();
      return data as unknown as {
        id: string; owner_id: string; title: string; description: string; cover_url: string | null; link_url: string | null;
        technologies: string[]; views: number; created_at: string;
        profiles: { id: string; username: string; full_name: string; avatar_url: string | null } | null;
        project_likes: { user_id: string }[]; project_comments: { id: string }[];
      } | null;
    },
  });
  useEffect(() => {
    if (q.data && user && q.data.owner_id !== user.id) {
      void supabase.from("projects").update({ views: q.data.views + 1 }).eq("id", id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.data?.id]);

  const p = q.data;
  const url = typeof window === "undefined" ? "" : `${window.location.origin}/projects/${id}`;

  return (
    <main className="mx-auto min-h-dvh w-full max-w-lg px-3 pt-4 pb-32 sm:px-5 md:max-w-3xl">
      <Link to="/projects" className="text-muted-foreground mb-3 inline-flex items-center gap-1 text-sm font-semibold">
        <ArrowLeft className="h-4 w-4" /> Projects
      </Link>
      {q.isLoading && <div className="bg-muted h-64 animate-pulse rounded-xl" />}
      {!q.isLoading && !p && (
        <div className="bg-card border-border rounded-xl border p-8 text-center">
          <p className="font-bold">This content is no longer available.</p>
          <Button asChild className="mt-4"><Link to="/feed">Back to Feed</Link></Button>
        </div>
      )}
      {p && (
        <article className="bg-card border-border overflow-hidden rounded-xl border">
          {p.cover_url && <Media path={p.cover_url} alt={p.title} className="aspect-video w-full object-cover" />}
          <div className="space-y-3 p-5">
            <h1 className="text-foreground text-2xl font-extrabold">{p.title}</h1>
            <ProfileLink username={p.profiles?.username} className="flex items-center gap-2">
              <Avatar path={p.profiles?.avatar_url} name={p.profiles?.full_name ?? "SC"} size={32} />
              <span className="text-sm font-bold">{p.profiles?.full_name}</span>
              <span className="text-muted-foreground text-xs">@{p.profiles?.username}</span>
            </ProfileLink>
            <p className="text-muted-foreground text-sm whitespace-pre-wrap">{p.description}</p>
            {p.technologies?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {p.technologies.map((t) => <span key={t} className="bg-secondary text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold">{t}</span>)}
              </div>
            )}
            <div className="text-muted-foreground flex gap-4 text-sm">
              <span className="flex items-center gap-1"><Heart className="h-4 w-4" />{p.project_likes.length}</span>
              <span className="flex items-center gap-1"><Eye className="h-4 w-4" />{p.views}</span>
              <span className="flex items-center gap-1"><MessageCircle className="h-4 w-4" />{p.project_comments.length}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {user && (
                <Button variant="outline" onClick={() => like.mutate({ projectId: p.id, userId: user.id, liked: p.project_likes.some((l) => l.user_id === user.id) } as never, { onSuccess: () => void q.refetch() })}>
                  <Heart className="mr-1 h-4 w-4" /> Like
                </Button>
              )}
              {p.link_url && <Button asChild variant="outline"><a href={p.link_url} target="_blank" rel="noreferrer"><ExternalLink className="mr-1 h-4 w-4" /> Open</a></Button>}
              {user && user.id !== p.owner_id && (
                <Button variant="outline" onClick={() => setCollab(true)}><Handshake className="mr-1 h-4 w-4" /> Collaborate</Button>
              )}
            </div>
            <div className="border-border flex flex-wrap gap-2 border-t pt-3">
              <Button asChild size="sm" variant="ghost"><a target="_blank" rel="noreferrer" href={`https://x.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(p.title)}`}><Twitter className="mr-1 h-4 w-4" /> X</a></Button>
              <Button asChild size="sm" variant="ghost"><a target="_blank" rel="noreferrer" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}><Linkedin className="mr-1 h-4 w-4" /> LinkedIn</a></Button>
              <Button size="sm" variant="ghost" onClick={() => void navigator.clipboard.writeText(url).then(() => toast.success("Link copied"))}><Copy className="mr-1 h-4 w-4" /> Copy link</Button>
            </div>
          </div>
          {user && user.id !== p.owner_id && (
            <CollabDialog open={collab} onOpenChange={setCollab} senderId={user.id} recipientId={p.owner_id} name={p.profiles?.full_name ?? "creator"} projectId={p.id} />
          )}
        </article>
      )}
      <AppNav />
    </main>
  );
}
