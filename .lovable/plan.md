# SOMMYART CONNECT — Profiles, Messaging & Collaboration Update

All changes are additive: no data is deleted or reset. Everything uses the current green/white design, Lucide icons, and Light/Dark/Auto themes.

## Phase 1 — Public profiles
- New public profile page at `/u/<username>`. Tapping an avatar, a name or a username anywhere (feed posts, comments, projects, ranks, notifications) opens it.
- Header: cover, photo, name, @username, occupation, bio, skills/interests, member-since date, points, streak, favourite count, badges.
- Buttons: Send Message, Favourite / Favourited, Share Profile, Collaborate, plus a "more" menu with Block and Report. On your own profile, Edit Profile replaces Send Message.
- Tabs: Posts (reuses the feed carousel), Projects (grid with likes, views, comments and share counts), Achievements.
- Email and phone number are never shown.
- New "Skills/interests" field on My Profile.

## Phase 2 — Direct messages
- New Messages page at `/messages`, with a nav item that shows an unread badge (no "0" badge).
- Conversation list is sorted by latest activity and shows the photo, name, last message, time and unread count. Unread conversations appear in bold. Search covers name, username and message text.
- Conversation screen: incoming and outgoing bubbles, timestamps, sent/read ticks, and older messages loading as you scroll. Each message has Reply, Copy and Delete (own messages only). You can attach images (compressed, 5 MB limit), and project or post links show as preview cards.
- New messages appear instantly. Mobile opens conversations full-screen with a back button. Desktop shows the list and the conversation side by side, with a capped width.
- Per-conversation Mute/Unmute. "Delete conversation" removes it only from your own inbox.

## Phase 3 — Privacy, blocking, reporting
- My Profile → Account → Privacy offers three message settings: Everyone (default), Members I favourite, or Nobody. It also lists blocked users with an Unblock button.
- The server enforces blocks and privacy settings on every send. A blocked user can't message you and isn't told they were blocked, and their posts are hidden from your feed.
- Report User offers seven reasons plus optional details. Reports go to a new Admin tab.

## Phase 4 — Collaboration
- "Collaborate" button on profiles and projects opens a form: category (AI projects, design, UI/UX, web, AI photo/video/music, automation, branding, content, other), project/topic, and message.
- The recipient can Accept or Decline. Accepting opens a DM that starts with "Collaboration started".

## Phase 5 — Notifications and deep links
- New notification types: message, collaboration request/accepted/declined, favourite creator posted, favourite creator published a project.
- Every notification points to an exact destination: a conversation, a post (the comment is highlighted), a project, a challenge or an announcement.
- Opening a conversation marks its message notifications as read. Muted conversations send no notifications.
- If the content is gone, a "This content is no longer available" page appears with a "Back to Feed" button.
- New project detail page at `/projects/<id>`, with share to X, share to LinkedIn and Copy Link.

## Phase 6 — Admin
- A new Messaging & Safety tab shows total conversations, daily active messengers, 7-day message activity, collaboration requests, and user reports with resolve/dismiss actions.
- Admins cannot read private message contents.

## Phase 7 — QA
- Run the full two-user acceptance test from the brief in the preview, on mobile and desktop and in both themes.

## Technical details
- New tables, each with GRANTs and RLS limited to participants or owners: `conversations`, `conversation_participants` (last_read_at, muted, deleted_at), `messages` (reply_to, media_urls, deleted_at), `blocked_users`, `user_reports`, `collaboration_requests`. New profile columns: `message_privacy` (default 'everyone') and `skills text[]`.
- Security-definer RPCs: `start_conversation(other)` checks blocks and privacy and reuses an existing pair. `send_message` revalidates the same rules. `mark_conversation_read`, `respond_collaboration`, and an `admin_messaging_stats` function that returns aggregates only.
- A trigger on `messages` notifies the other participant unless they muted the conversation, linking to `/messages/<id>`. Triggers on posts and projects notify followers.
- Realtime is enabled on `messages` and `conversation_participants`, with one channel per open view.
- Image attachments go to a private `dm-media` storage bucket, and only conversation participants can read them.
- New routes: `/u/$username`, `/messages`, `/messages/$id`, `/projects/$id`, all under the signed-in area.
