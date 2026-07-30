import { useEffect, useState } from "react";
import { Store } from "lucide-react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { getPictureUrl } from "@/lib/members";
import type { BusinessPost } from "@/hooks/use-business";

function PostSlide({ post }: { post: BusinessPost }) {
  const [urls, setUrls] = useState<string[]>([]);
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all(post.images.map((p) => getPictureUrl(p))).then((res) => {
      if (active) setUrls(res.filter(Boolean) as string[]);
    });
    getPictureUrl(post.member_image).then((u) => active && setAvatar(u));
    return () => {
      active = false;
    };
  }, [post.images, post.member_image]);

  return (
    <article className="bg-card/85 shadow-card border-border/60 h-full rounded-3xl border p-4 backdrop-blur-xl">
      <div className="grid grid-cols-3 gap-1.5">
        {urls.map((u) => (
          <img
            key={u}
            src={u}
            alt={`${post.business_name ?? "Business"} photo by ${post.member_nickname}`}
            className="aspect-square w-full rounded-xl object-cover"
            loading="lazy"
          />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2.5">
        {avatar ? (
          <img src={avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <div className="bg-secondary text-primary flex h-9 w-9 items-center justify-center rounded-full text-xs font-extrabold">
            {post.member_nickname.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-card-foreground truncate text-sm font-bold">
            {post.business_name ?? "Business spotlight"}
          </p>
          <p className="text-primary truncate text-xs font-semibold">by {post.member_nickname}</p>
        </div>
      </div>
      {post.caption && (
        <p className="text-muted-foreground mt-2 text-xs leading-relaxed">{post.caption}</p>
      )}
    </article>
  );
}

export function BusinessCarousel({ posts }: { posts: BusinessPost[] }) {
  if (posts.length === 0) {
    return (
      <div className="bg-card/70 border-border/60 text-muted-foreground flex items-center gap-3 rounded-3xl border p-5 text-sm">
        <Store className="text-primary h-5 w-5" aria-hidden />
        No business posts yet — check back on Tuesday.
      </div>
    );
  }

  return (
    <Carousel opts={{ align: "start", loop: posts.length > 1 }} className="w-full">
      <CarouselContent className="-ml-3">
        {posts.map((p) => (
          <CarouselItem key={p.id} className="basis-[85%] pl-3">
            <PostSlide post={p} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="-left-1 hidden sm:flex" />
      <CarouselNext className="-right-1 hidden sm:flex" />
    </Carousel>
  );
}
