import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, FolderPlus, Heart, Plus, Rocket } from "lucide-react";
import { POINT_RULES } from "@/lib/points";
import { toast } from "sonner";

import { AppNav } from "@/components/AppNav";
import { AdminBadge } from "@/components/AdminBadge";
import { Avatar } from "@/components/Media";
import { ProfileLink } from "@/components/ProfileLink";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAdminIds, useMe } from "@/hooks/use-auth";
import { useCreateProject, useProjects, useToggleProjectLike } from "@/hooks/use-projects";

export const Route = createFileRoute("/_authenticated/projects")({
  head: () => ({
    meta: [
      { title: "Projects — SOMMYART CONNECT" },
      {
        name: "description",
        content:
          "Browse AI and tech projects built by SOMMYART CONNECT creators, and publish your own portfolio piece.",
      },
      { property: "og:title", content: "Projects — SOMMYART CONNECT" },
      { property: "og:description", content: "AI and tech projects from the creator community." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const { user } = useMe();
  const { data: projects = [], isLoading } = useProjects();
  const { data: adminIds = new Set<string>() } = useAdminIds(projects.map((project) => project.owner_id));
  const create = useCreateProject();
  const like = useToggleProjectLike();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", link_url: "", technologies: "" });

  function submit() {
    if (!user || !form.title.trim() || !form.description.trim()) return;
    create.mutate(
      {
        owner_id: user.id,
        title: form.title.trim(),
        description: form.description.trim(),
        link_url: form.link_url.trim() || null,
        technologies: form.technologies
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      },
      {
        onSuccess: (res) => {
          setForm({ title: "", description: "", link_url: "", technologies: "" });
          setOpen(false);
          toast.success(res?.awarded ? `Project published · +${POINT_RULES.publish_project} points` : "Project published");
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-lg px-5 pt-6 pb-32 sm:px-6 md:max-w-3xl md:px-8 md:pt-10 lg:max-w-5xl xl:max-w-6xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-foreground text-2xl font-extrabold">Projects</h1>
        <Button size="sm" className="press rounded-xl" onClick={() => setOpen((v) => !v)}>
          <Plus className="mr-1 h-4 w-4" aria-hidden /> Add
        </Button>
      </div>

      {open && (
        <section className="bg-card/85 shadow-card border-border/60 animate-fade-up mt-4 space-y-2 rounded-3xl border p-4 backdrop-blur-xl">
          <Input
            aria-label="Project title"
            className="h-11 rounded-2xl"
            placeholder="Project title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <Textarea
            aria-label="Project description"
            rows={3}
            className="rounded-2xl"
            placeholder="What does it do and how did you build it?"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <Input
            aria-label="Project link"
            className="h-11 rounded-2xl"
            placeholder="Live link (optional)"
            value={form.link_url}
            onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))}
          />
          <Input
            aria-label="Technologies"
            className="h-11 rounded-2xl"
            placeholder="Tech used, comma separated"
            value={form.technologies}
            onChange={(e) => setForm((f) => ({ ...f, technologies: e.target.value }))}
          />
          <Button
            className="press h-11 w-full rounded-2xl"
            disabled={create.isPending}
            onClick={submit}
          >
            Publish project
          </Button>
        </section>
      )}

      <div className="mt-5 space-y-3">
        {isLoading && <div className="bg-muted h-32 animate-pulse rounded-3xl" />}
        {!isLoading && projects.length === 0 && (
          <div className="bg-card border-border flex flex-col items-center rounded-xl border px-6 py-10 text-center">
            <div className="bg-primary/10 text-primary flex h-14 w-14 items-center justify-center rounded-full">
              <FolderPlus className="h-7 w-7" aria-hidden />
            </div>
            <h2 className="text-foreground mt-4 text-lg font-extrabold">Showcase what you're building and earn points</h2>
            <p className="text-muted-foreground mt-1 max-w-sm text-sm">
              Share an AI or tech project — a tool, app, design or workflow. Add a short description, a live link and the tech you used.
            </p>
            <Button className="mt-5 rounded-xl" onClick={() => setOpen(true)}>
              <Plus className="mr-1 h-4 w-4" aria-hidden /> Add your first project · +{POINT_RULES.publish_project} pts
            </Button>
            <p className="text-primary mt-2 text-xs font-semibold">Earn +{POINT_RULES.publish_project} points for each project you publish</p>
          </div>
        )}
        {projects.map((project) => {
          const liked = project.project_likes.some((l) => l.user_id === user?.id);
          return (
            <article
              key={project.id}
              className="bg-card/85 shadow-card border-border/60 animate-fade-up rounded-3xl border p-5 backdrop-blur-xl"
            >
              <header className="flex items-center gap-3">
                <ProfileLink username={project.profiles?.username} className="flex items-center gap-3">
                <Avatar
                  path={project.profiles?.avatar_url}
                  name={project.profiles?.full_name ?? "SC"}
                  size={36}
                />
                <p className="text-muted-foreground truncate text-xs font-semibold">
                  @{project.profiles?.username ?? "member"}
                </p>
                </ProfileLink>
                {adminIds.has(project.owner_id) && <AdminBadge compact />}
                {project.featured && (
                  <span className="bg-primary/10 text-primary ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">
                    Featured
                  </span>
                )}
              </header>
              <h2 className="text-card-foreground mt-3 flex items-center gap-2 text-base font-extrabold">
                <Rocket className="text-primary h-4 w-4" aria-hidden /> <Link to="/projects/$id" params={{ id: project.id }} className="hover:underline">{project.title}</Link>
              </h2>
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                {project.description}
              </p>
              {project.technologies.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {project.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}
              <div className="text-muted-foreground mt-3 flex items-center gap-4 text-xs font-semibold">
                <button
                  className="press flex items-center gap-1"
                  onClick={() =>
                    user && like.mutate({ projectId: project.id, userId: user.id, on: !liked })
                  }
                >
                  <Heart
                    className={`h-4 w-4 ${liked ? "fill-primary text-primary" : ""}`}
                    aria-hidden
                  />
                  {project.project_likes.length}
                </button>
                {project.link_url && (
                  <a
                    href={project.link_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary flex items-center gap-1"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden /> Visit
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <AppNav />
    </main>
  );
}
