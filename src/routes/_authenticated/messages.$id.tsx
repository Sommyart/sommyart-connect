import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Ban, SmilePlus, Bell, BellOff, Check, CheckCheck, Copy, Flag, ImagePlus, Loader2, MoreVertical, Reply, Send, Trash2, X,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar } from "@/components/Media";
import { ProfileLink } from "@/components/ProfileLink";
import { ReportUserDialog } from "@/components/UserActionDialogs";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useMe } from "@/hooks/use-auth";
import { dmMediaUrl, REACTIONS, useBlocks, useConversations, useMessages, useReactions, useSendMessage, useTyping, type Message } from "@/hooks/use-messages";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/messages/$id")({
  component: Conversation,
});

function Conversation() {
  const { id } = Route.useParams();
  const { user } = useMe();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: convs, isLoading: convLoading } = useConversations(user?.id);
  const conv = convs?.find((c) => c.id === id);
  const { messages, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useMessages(id);
  const send = useSendMessage(id, user?.id);
  const { ids: blockedIds, toggle: toggleBlock } = useBlocks(user?.id);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [actionsFor, setActionsFor] = useState<string | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const { reactions, react } = useReactions(id, user?.id);
  const { otherTyping, ping } = useTyping(id, user?.id);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastId = messages[messages.length - 1]?.id;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
    if (user) {
      void supabase.rpc("mark_conversation_read", { _conv: id }).then(() => {
        void queryClient.invalidateQueries({ queryKey: ["dm-unread"] });
        void queryClient.invalidateQueries({ queryKey: ["notifications"] });
        void queryClient.invalidateQueries({ queryKey: ["unread-count"] });
      });
    }
  }, [lastId, id, user, queryClient]);

  if (!convLoading && convs && !conv) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="font-bold">This content is no longer available.</p>
        <Button asChild><Link to="/feed">Back to Feed</Link></Button>
      </div>
    );
  }

  const other = conv?.other;
  const blocked = other ? blockedIds.has(other.id) : false;

  async function submit() {
    if (!text.trim() && !file) return;
    try {
      ping(false);
      await send.mutateAsync({ body: text, file, replyTo: replyTo?.id });
      setText(""); setFile(null); setReplyTo(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Message not sent");
    }
  }
  async function setMuted(muted: boolean) {
    await supabase.from("conversation_participants").update({ muted }).eq("conversation_id", id).eq("user_id", user!.id);
    void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    toast.success(muted ? "Conversation muted" : "Conversation unmuted");
  }
  async function removeConversation() {
    if (!window.confirm("Remove this conversation from your inbox? The other person keeps their copy.")) return;
    await supabase.from("conversation_participants").update({ deleted_at: new Date().toISOString() }).eq("conversation_id", id).eq("user_id", user!.id);
    void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    void navigate({ to: "/messages" });
  }
  async function deleteMessage(m: Message) {
    await supabase.from("messages").update({ deleted_at: new Date().toISOString(), body: "", media_urls: [] }).eq("id", m.id);
    void queryClient.invalidateQueries({ queryKey: ["messages", id] });
  }

  const byId = new Map(messages.map((m) => [m.id, m]));

  return (
    <>
      <header className="border-border flex items-center gap-3 border-b px-3 py-2.5">
        <Link to="/messages" className="md:hidden" aria-label="Back to conversations"><ArrowLeft className="h-5 w-5" /></Link>
        <ProfileLink username={other?.username} className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar path={other?.avatar_url} name={other?.full_name ?? "Member"} size={38} />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{other?.full_name ?? "…"}</p>
            <p className="text-muted-foreground truncate text-xs">@{other?.username}</p>
          </div>
        </ProfileLink>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Conversation options"><MoreVertical className="h-5 w-5" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => void setMuted(!conv?.muted)}>
              {conv?.muted ? <><Bell className="mr-2 h-4 w-4" /> Unmute</> : <><BellOff className="mr-2 h-4 w-4" /> Mute</>}
            </DropdownMenuItem>
            {other && (
              <DropdownMenuItem onClick={() => toggleBlock.mutate({ targetId: other.id, block: !blocked }, { onSuccess: () => toast.success(blocked ? "Unblocked" : "Blocked") })}>
                <Ban className="mr-2 h-4 w-4" /> {blocked ? "Unblock user" : "Block user"}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => setReportOpen(true)}><Flag className="mr-2 h-4 w-4" /> Report user</DropdownMenuItem>
            <DropdownMenuItem onClick={() => void removeConversation()} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete conversation</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {hasNextPage && (
          <div className="text-center">
            <Button size="sm" variant="ghost" onClick={() => void fetchNextPage()} disabled={isFetchingNextPage}>
              {isFetchingNextPage ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load earlier messages"}
            </Button>
          </div>
        )}
        {isLoading && <Loader2 className="text-muted-foreground mx-auto h-5 w-5 animate-spin" />}
        {messages.map((m) => {
          const mine = m.sender_id === user?.id;
          if (m.kind === "system") {
            return <p key={m.id} className="bg-secondary text-primary mx-auto w-fit rounded-full px-3 py-1 text-xs font-semibold">{m.body}</p>;
          }
          const read = mine && conv?.otherLastReadAt && conv.otherLastReadAt >= m.created_at;
          const delivered = mine && (read || (conv?.otherDeliveredAt && conv.otherDeliveredAt >= m.created_at));
          const mr = reactions.filter((r) => r.message_id === m.id);
          const counts = REACTIONS.map((e) => ({ e, n: mr.filter((r) => r.emoji === e).length, me: mr.some((r) => r.emoji === e && r.user_id === user?.id) })).filter((x) => x.n);
          const showActions = actionsFor === m.id;
          const parent = m.reply_to ? byId.get(m.reply_to) : null;
          return (
            <div key={m.id} className={`group flex ${mine ? "justify-end" : "justify-start"}`}
              onTouchStart={() => { clearTimeout(pressTimer.current); pressTimer.current = setTimeout(() => setActionsFor(m.id), 450); }}
              onTouchEnd={() => clearTimeout(pressTimer.current)}
              onTouchMove={() => clearTimeout(pressTimer.current)}
              onContextMenu={(e) => { e.preventDefault(); setActionsFor(m.id); }}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-secondary text-secondary-foreground rounded-bl-sm"}`}>
                {parent && <p className="mb-1 border-l-2 border-current/40 pl-2 text-xs opacity-80 line-clamp-2">{parent.body || "Photo"}</p>}
                {m.deleted_at ? (
                  <p className="italic opacity-70">Message deleted</p>
                ) : (
                  <>
                    {m.media_urls.map((path) => <DmImage key={path} path={path} />)}
                    {m.body && <MessageBody text={m.body} />}
                  </>
                )}
                <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-75">
                  {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {mine && (read
                    ? <CheckCheck className="h-3.5 w-3.5" strokeWidth={3} aria-label="Seen" />
                    : delivered
                      ? <CheckCheck className="h-3.5 w-3.5 opacity-60" aria-label="Delivered" />
                      : <Check className="h-3.5 w-3.5" aria-label="Sent" />)}
                </div>
                {counts.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {counts.map((c) => (
                      <button key={c.e} type="button" onClick={() => void react(m.id, c.e)}
                        className={`bg-background text-foreground rounded-full border px-1.5 text-xs ${c.me ? "border-primary" : "border-border"}`}>
                        {c.e} {c.n > 1 ? c.n : ""}
                      </button>
                    ))}
                  </div>
                )}
                {!m.deleted_at && (
                  <div className={`mt-1 items-center gap-2 ${showActions ? "flex" : "hidden group-hover:flex group-focus-within:flex"}`}>
                    <span className="bg-background text-foreground flex gap-0.5 rounded-full border px-1 py-0.5 shadow-sm">
                      <SmilePlus className="text-muted-foreground mx-0.5 h-3.5 w-3.5 self-center" aria-hidden />
                      {REACTIONS.map((e) => (
                        <button key={e} type="button" aria-label={`React ${e}`} className="press px-0.5 text-sm leading-none"
                          onClick={() => { void react(m.id, e); setActionsFor(null); }}>{e}</button>
                      ))}
                    </span>
                    <button type="button" aria-label="Reply" onClick={() => { setReplyTo(m); setActionsFor(null); }}><Reply className="h-3.5 w-3.5" /></button>
                    {m.body && <button type="button" aria-label="Copy" onClick={() => void navigator.clipboard.writeText(m.body).then(() => toast.success("Copied"))}><Copy className="h-3.5 w-3.5" /></button>}
                    {mine && <button type="button" aria-label="Delete" onClick={() => void deleteMessage(m)}><Trash2 className="h-3.5 w-3.5" /></button>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {otherTyping && (
          <div className="flex justify-start">
            <div className="bg-secondary text-muted-foreground flex items-center gap-1 rounded-2xl rounded-bl-sm px-3 py-2 text-xs">
              <span className="sr-only">{other?.full_name} is typing</span>
              <span className="bg-muted-foreground h-1.5 w-1.5 animate-bounce rounded-full" />
              <span className="bg-muted-foreground h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:150ms]" />
              <span className="bg-muted-foreground h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:300ms]" />
              <span className="ml-1">typing…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <footer className="border-border bg-card border-t p-2">
        {replyTo && (
          <div className="bg-secondary mb-2 flex items-center justify-between rounded-lg px-3 py-1.5 text-xs">
            <span className="border-primary min-w-0 truncate border-l-2 pl-2"><b>{replyTo.sender_id === user?.id ? "You" : other?.full_name}</b> · {replyTo.body || "Photo"}</span>
            <button type="button" onClick={() => setReplyTo(null)} aria-label="Cancel reply"><X className="h-4 w-4" /></button>
          </div>
        )}
        {file && (
          <div className="bg-secondary mb-2 flex items-center justify-between rounded-lg px-3 py-1.5 text-xs">
            <span className="truncate">{file.name}</span>
            <button type="button" onClick={() => setFile(null)} aria-label="Remove image"><X className="h-4 w-4" /></button>
          </div>
        )}
        {blocked ? (
          <p className="text-muted-foreground p-2 text-center text-sm">You blocked this member. Unblock to send messages.</p>
        ) : (
          <div className="flex items-end gap-2">
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <Button variant="ghost" size="icon" aria-label="Attach image" onClick={() => fileRef.current?.click()}><ImagePlus className="h-5 w-5" /></Button>
            <Textarea
              rows={1}
              value={text}
              onChange={(e) => { setText(e.target.value); if (e.target.value) ping(); }}
              onBlur={() => ping(false)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void submit(); } }}
              placeholder="Write a message"
              className="max-h-32 min-h-10 flex-1 resize-none"
            />
            <Button size="icon" aria-label="Send" disabled={send.isPending} onClick={() => void submit()}>
              {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </footer>
      {user && other && <ReportUserDialog open={reportOpen} onOpenChange={setReportOpen} reporterId={user.id} reportedId={other.id} name={other.full_name} />}
    </>
  );
}

function DmImage({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => { void dmMediaUrl(path).then(setUrl); }, [path]);
  if (!url) return <div className="bg-muted mb-1 h-40 w-56 animate-pulse rounded-lg" />;
  return <a href={url} target="_blank" rel="noreferrer"><img src={url} alt="Shared" loading="lazy" className="mb-1 max-h-72 rounded-lg object-cover" /></a>;
}

function MessageBody({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/\S+)/g);
  return (
    <p className="break-words whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (!/^https?:\/\//.test(part)) return <span key={i}>{part}</span>;
        const internal = typeof window !== "undefined" && part.startsWith(window.location.origin);
        const label = internal
          ? part.includes("/projects/") ? "SOMMYART project" : part.includes("/feed") ? "Community post" : part.replace(window.location.origin, "")
          : part;
        return (
          <a key={i} href={part} target={internal ? undefined : "_blank"} rel="noreferrer" className="font-semibold underline">
            {label}
          </a>
        );
      })}
    </p>
  );
}
