import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Award, Ban, CalendarDays, Crown, Eye, Flag, Flame, Footprints, Handshake, Heart, Medal, MessageCircle,
  MoreHorizontal, Pencil, Rocket, Share2, Star, Trophy,
} from "lucide-react";
import { toast } from "sonner";

import { AppFooter } from "@/components/AppFooter";
import { AppNav } from "@/components/AppNav";
import { AdminBadge } from "@/components/AdminBadge";
import { Avatar, Media } from "@/components/Media";
import { PostCard } from "@/components/PostCard";
import { CollabDialog, ReportUserDialog } from "@/components/UserActionDialogs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminIds, useMe } from "@/hooks/use-auth";
import { useFollow, type Post } from "@/hooks/use-feed";
import { startConversation, useBlocks } from "@/hooks/use-messages";
import { supabase } from "@/integrations/supabase/client";
import { badgesFor } from "@/lib/badges";
import { levelFor } from "@/lib/points";

export const Route = createFileRoute("/_authenticated/u/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} — SOMMYART CONNECT` },
      { name: "description", content: `View @${params.username}'s creator profile, projects and posts on SOMMYART CONNECT.` },
      { property: "og:title", content: `@${params.username} — SOMMYART CONNECT` },
      { property: "og:description", content: "Creator profile, projects and community posts." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PublicProfile,
});

const PUBLIC_COLS =
  "id,full_name,username,occupation,bio,avatar_url,cover_url,points,streak,longest_streak,skills,created_at,website_url,github_url,linkedin_url,x_url,deactivated";
const badgeIcons = { footprints: Footprints, flame: Flame, star: Star, crown: Crown, message: MessageCircle, rocket: Rocket, "medal-bronze": Medal, "medal-silver": Medal, "medal-gold": Award } as const;

type Tab = "posts" | "projects" | "achievements";

function PublicProfile() {
  const { username } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useMe();
  const [tab, setTab] = useState<Tab>("posts");
  const [reportOpen, setReportOpen] = useState(false);
  const [collabOpen, setCollabOpen] = useState(false);
  const { following, toggle } = useFollow(user?.id);
  const { ids: blockedIds, toggle: toggleBlock } = useBlocks(user?.id);

  const profileQ = useQuery({
    queryKey: ["public-profile", username],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select(PUBLIC_COLS).ilike("username", username).maybeSingle();
      if (error) throw error;
      return data as unknown as {
        id: string; full_name: string; username: string; occupation: string | null; bio: string | null;
        avatar_url: string | null; cover_url: string | null; points: number; streak: number; longest_streak: number;
        skills: string[]; created_at: string; website_url: string | null; github_url: string | null;
        linkedin_url: string | null; x_url: string | null; deactivated: boolean;
      } | null;
    },
  });
  const p = profileQ.data;

  const extras = useQuery({
    queryKey: ["public-profile-extras", p?.id],
    enabled: Boolean(p?.id),
    queryFn: async () => {
      const [posts, projects, favs] = await Promise.all([
        supabase
          .from("posts")
          .select("*, profiles:author_id(id,username,full_name,avatar_url,occupation), post_reactions(user_id,reaction), post_comments(id)")
          .eq("author_id", p!.id)
          .order("created_at", { ascending: false })
          .limit(30),
        supabase.from("projects").select("*, project_likes(user_id), project_comments(id)").eq("owner_id", p!.id).order("created_at", { ascending: false }),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", p!.id),
      ]);
      return {
        posts: (posts.data ?? []) as unknown as Post[],
        projects: (projects.data ?? []) as unknown as {
          id: string; title: string; description: string; cover_url: string | null; views: number; downloads: number;
          project_likes: { user_id: string }[]; project_comments: { id: string }[];
        }[],
        favorites: favs.count ?? 0,
      };
    },
  });
  const { data: adminIds = new Set<string>() } = useAdminIds(p ? [p.id] : []);

  if (profileQ.isLoading) return <Shell><div className="bg-muted h-64 animate-pulse rounded-xl" /></Shell>;
  if (!p || p.deactivated) {
    return (
      <Shell>
        <div className="bg-card border-border rounded-xl border p-8 text-center">
          <p className="text-foreground font-bold">This content is no longer available.</p>
          <Button asChild className="mt-4"><Link to="/feed">Back to Feed</Link></Button>
        </div>
      </Shell>
    );
  }

  const isMe = user?.id === p.id;
  const isFav = following.includes(p.id);
  const isBlocked = blockedIds.has(p.id);
  const level = levelFor(p.points);
  const badges = badgesFor({
    points: p.points, streak: p.streak, longestStreak: p.longest_streak, totalSignIns: 0,
    posts: extras.data?.posts.length ?? 0, projects: extras.data?.projects.length ?? 0,
  });

  async function message() {
    try {
      const id = await startConversation(p!.id);
      void navigate({ to: "/messages/$id", params: { id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start conversation");
    }
  }
  async function share() {
    const url = `${window.location.origin}/u/${p!.username}`;
    try {
      if (navigator.share) await navigator.share({ title: p!.full_name, url });
      else { await navigator.clipboard.writeText(url); toast.success("Profile link copied"); }
    } catch { /* cancelled */ }
  }

  return (
    <Shell>
      <section className="bg-card border-border overflow-hidden rounded-xl border">
        <div className="bg-secondary aspect-[16/5] w-full">
          {p.cover_url && <Media path={p.cover_url} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="px-4 pb-5 sm:px-6">
          <div className="-mt-12 flex items-end justify-between gap-3">
            <Avatar path={p.avatar_url} name={p.full_name} size={96} className="ring-card ring-4" />
            {!isMe && user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="More actions"><MoreHorizontal className="h-5 w-5" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => toggleBlock.mutate({ targetId: p.id, block: !isBlocked }, { onSuccess: () => toast.success(isBlocked ? "Unblocked" : "Blocked") })}>
                    <Ban className="mr-2 h-4 w-4" /> {isBlocked ? "Unblock user" : "Block user"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setReportOpen(true)} className="text-destructive">
                    <Flag className="mr-2 h-4 w-4" /> Report user
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <h1 className="text-foreground mt-3 flex items-center gap-2 text-xl font-extrabold">
            {p.full_name} {adminIds.has(p.id) && <AdminBadge />}
          </h1>
          <p className="text-muted-foreground text-sm">@{p.username}</p>
          {p.occupation && <p className="text-foreground mt-1 text-sm font-semibold">{p.occupation}</p>}
          {p.bio && <p className="text-muted-foreground mt-2 text-sm whitespace-pre-wrap">{p.bio}</p>}
          {p.skills?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {p.skills.map((s) => <span key={s} className="bg-secondary text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold">{s}</span>)}
            </div>
          )}
          <p className="text-muted-foreground mt-3 flex items-center gap-1 text-xs">
            <CalendarDays className="h-3.5 w-3.5" /> Member since {new Date(p.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {isMe ? (
              <Button asChild><Link to="/profile"><Pencil className="mr-1 h-4 w-4" /> Edit Profile</Link></Button>
            ) : (
              <>
                <Button onClick={() => void message()} disabled={isBlocked}><MessageCircle className="mr-1 h-4 w-4" /> Send Message</Button>
                <Button variant={isFav ? "secondary" : "outline"} onClick={() => toggle.mutate({ targetId: p.id, on: !isFav })}>
                  <Star className={`mr-1 h-4 w-4 ${isFav ? "fill-primary text-primary" : ""}`} /> {isFav ? "Favorited" : "Favorite"}
                </Button>
                <Button variant="outline" onClick={() => setCollabOpen(true)} disabled={isBlocked}><Handshake className="mr-1 h-4 w-4" /> Collaborate</Button>
              </>
            )}
            <Button variant="outline" onClick={() => void share()}><Share2 className="mr-1 h-4 w-4" /> Share Profile</Button>
          </div>

          <div className="mt-5 grid grid-cols-4 gap-2 text-center">
            <Stat label="Points" value={p.points} />
            <Stat label="Streak" value={p.streak} />
            <Stat label="Favorites" value={extras.data?.favorites ?? 0} />
            <Stat label="Level" value={level.name} />
          </div>
        </div>
      </section>

      <div className="border-border mt-4 flex border-b">
        {(["posts", "projects", "achievements"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`flex-1 border-b-2 py-2.5 text-sm font-bold capitalize ${tab === t ? "border-primary text-primary" : "text-muted-foreground border-transparent"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "posts" && (
        <div className="mt-4 space-y-4">
          {(extras.data?.posts ?? []).map((post) => <PostCard key={post.id} post={post} userId={user?.id ?? null} saved={false} />)}
          {extras.data && !extras.data.posts.length && <Empty text="No posts yet." />}
        </div>
      )}

      {tab === "projects" && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(extras.data?.projects ?? []).map((pr) => (
            <Link key={pr.id} to="/projects/$id" params={{ id: pr.id }} className="bg-card border-border press overflow-hidden rounded-xl border">
              <div className="bg-secondary aspect-video">{pr.cover_url && <Media path={pr.cover_url} alt={pr.title} className="h-full w-full object-cover" />}</div>
              <div className="p-3">
                <p className="text-foreground font-bold">{pr.title}</p>
                <p className="text-muted-foreground line-clamp-2 text-xs">{pr.description}</p>
                <p className="text-muted-foreground mt-1 text-[11px]">by {p.full_name}</p>
                <div className="text-muted-foreground mt-2 flex gap-3 text-xs">
                  <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{pr.project_likes.length}</span>
                  <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{pr.views}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{pr.project_comments.length}</span>
                  <span className="flex items-center gap-1"><Share2 className="h-3.5 w-3.5" />{pr.downloads}</span>
                </div>
              </div>
            </Link>
          ))}
          {extras.data && !extras.data.projects.length && <Empty text="No projects yet." />}
        </div>
      )}

      {tab === "achievements" && (
        <section className="bg-card border-border mt-4 grid grid-cols-3 gap-3 rounded-xl border p-4 sm:grid-cols-5">
          {badges.map((b) => {
            const Icon = badgeIcons[b.icon as keyof typeof badgeIcons] ?? Trophy;
            return (
              <div key={b.key} title={b.description} className={`rounded-lg p-3 text-center ${b.earned ? "bg-secondary" : "bg-muted/50 opacity-50"}`}>
                <Icon className="text-primary mx-auto h-6 w-6" />
                <p className="mt-1 text-[11px] font-bold">{b.name}</p>
              </div>
            );
          })}
        </section>
      )}

      {user && !isMe && (
        <>
          <ReportUserDialog open={reportOpen} onOpenChange={setReportOpen} reporterId={user.id} reportedId={p.id} name={p.full_name} />
          <CollabDialog open={collabOpen} onOpenChange={setCollabOpen} senderId={user.id} recipientId={p.id} name={p.full_name} />
        </>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-lg px-3 pt-4 pb-32 sm:px-5 md:max-w-3xl lg:max-w-4xl">
      {children}
      <AppFooter />
      <AppNav />
    </main>
  );
}
function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-secondary rounded-lg py-2">
      <p className="text-foreground truncate text-base font-black">{value}</p>
      <p className="text-muted-foreground text-[10px] font-semibold">{label}</p>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return <p className="text-muted-foreground col-span-full py-8 text-center text-sm">{text}</p>;
}
