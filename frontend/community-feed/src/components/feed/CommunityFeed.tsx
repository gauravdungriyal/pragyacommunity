import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreatePost } from './CreatePost';
import { PostCard } from './PostCard';
import { PostSkeleton, CreatePostSkeleton } from '../ui/Skeleton';
import { EmptyState, ErrorState } from '../ui/EmptyState';
import { Post } from '../../types';
import { cn } from '../../lib/utils';
import { mockPosts } from '../../data/mockData';

interface CommunityFeedProps {
  className?: string;
}

const mapApiPostToReactPost = (apiPost: any): Post => {
  const currentUser = localStorage.getItem("userName") || "Pragya";
  const currentUserImage = localStorage.getItem("profileImage");

  const authorName = apiPost.user_id?.name || apiPost.userName || currentUser;
  const isPragya = authorName.toLowerCase().includes("pragya");
  const authorBadge = apiPost.userBadge || (isPragya ? "Super Diamond 💎✨" : "Diamond Member 💎");
  let userAvatar = apiPost.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(authorName)}`;
  if (authorName === currentUser && currentUserImage) {
    userAvatar = currentUserImage;
  }

  const pId = apiPost._id || apiPost.id;
  const likedPosts = JSON.parse(localStorage.getItem("liked_posts") || "[]");
  const isLiked = likedPosts.includes(pId);
  const likedComments = JSON.parse(localStorage.getItem("liked_comments") || "[]");

  return {
    id: pId,
    userId: apiPost.user_id?._id || apiPost.user_id || "user1",
    userName: authorName,
    userRole: `${apiPost.user_id?.role || apiPost.userRole || "Student"} • ${authorBadge}`,
    userAvatar: userAvatar,
    content: apiPost.content,
    image: apiPost.image,
    timestamp: apiPost.createdAt ? new Date(apiPost.createdAt).toLocaleDateString() : "Just now",
    likes: apiPost.likes || 0,
    isLiked: isLiked,
    comments: (apiPost.comments || []).map((c: any) => {
      const cAuthor = c.user_id?.name || c.userName || "User";
      let cAvatar = c.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cAuthor)}`;
      if (cAuthor === currentUser && currentUserImage) {
        cAvatar = currentUserImage;
      }
      const cId = c._id || c.id;
      return {
        id: cId,
        userId: c.user_id?._id || c.user_id || "user1",
        userName: cAuthor,
        userAvatar: cAvatar,
        content: c.comment_text || c.content || "",
        timestamp: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "Just now",
        likes: c.likes || 0,
        isLiked: likedComments.includes(cId)
      };
    }),
    shares: apiPost.shares || 0
  };
};

export function CommunityFeed({ className }: CommunityFeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const getMappedMockPosts = () => {
    const likedPosts = JSON.parse(localStorage.getItem("liked_posts") || "[]");
    const likedComments = JSON.parse(localStorage.getItem("liked_comments") || "[]");
    return mockPosts.map((p) => ({
      ...p,
      isLiked: likedPosts.includes(p.id),
      comments: p.comments.map((c) => ({
        ...c,
        isLiked: likedComments.includes(c.id),
      })),
    }));
  };

  const loadPosts = async () => {
    try {
      const AppService = (window as any).AppService;
      let fetched: any[] = [];
      if (AppService) {
        fetched = await AppService.getPosts();
      } else {
        const local = localStorage.getItem("local_posts") || localStorage.getItem("cached_posts");
        fetched = local ? JSON.parse(local) : [];
      }
      if (fetched && fetched.length > 0) {
        setPosts(fetched.map(mapApiPostToReactPost));
      } else {
        setPosts(getMappedMockPosts());
      }
      setError(false);
    } catch (e) {
      console.error(e);
      setPosts(getMappedMockPosts());
      setError(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
    const sync = () => loadPosts();
    window.addEventListener("focus", sync);
    window.addEventListener("storage", sync);
    window.addEventListener("postsUpdated", sync);
    return () => {
        window.removeEventListener("focus", sync);
        window.removeEventListener("storage", sync);
        window.removeEventListener("postsUpdated", sync);
    };
}, []);

  const handleCreatePost = async (content: string, image?: string) => {
    const AppService = (window as any).AppService;
    if (AppService) {
      await AppService.createPost(content, image);
    } else {
      let localPosts = JSON.parse(localStorage.getItem("local_posts") || "[]");
      const savedUserName = localStorage.getItem("userName") || "Gyan Prakash";
      const savedUserRole = localStorage.getItem("userRole") || "Student";
      const newPost = {
        _id: "post_" + Date.now(),
        user_id: { name: savedUserName, role: savedUserRole },
        content,
        image,
        likes: 0,
        comments: [],
        createdAt: new Date().toISOString()
      };
      localPosts.unshift(newPost);
      localStorage.setItem("local_posts", JSON.stringify(localPosts));
    }
    loadPosts();
  };

  const handleLike = async (postId: string) => {
    // Optimistic toggle for instant UI response
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const willLike = !post.isLiked;
          return {
            ...post,
            isLiked: willLike,
            likes: willLike ? post.likes + 1 : Math.max(0, post.likes - 1)
          };
        }
        return post;
      })
    );

    const AppService = (window as any).AppService;
    if (AppService) {
      await AppService.likePost(postId);
    } else {
      let likedPosts = JSON.parse(localStorage.getItem("liked_posts") || "[]");
      const isCurrentlyLiked = likedPosts.includes(postId);
      if (isCurrentlyLiked) {
        likedPosts = likedPosts.filter((id: string) => id !== postId);
      } else {
        likedPosts.push(postId);
      }
      localStorage.setItem("liked_posts", JSON.stringify(likedPosts));

      let localPosts = JSON.parse(localStorage.getItem("local_posts") || "[]");
      localPosts = localPosts.map((p: any) => {
        if (p._id === postId || p.id === postId) {
          const cur = p.likes || 0;
          return { ...p, likes: !isCurrentlyLiked ? cur + 1 : Math.max(0, cur - 1) };
        }
        return p;
      });
      localStorage.setItem("local_posts", JSON.stringify(localPosts));
    }
  };

  const handleComment = async (postId: string, content: string) => {
    const AppService = (window as any).AppService;
    if (AppService) {
      await AppService.addComment(postId, content);
    } else {
      let localPosts = JSON.parse(localStorage.getItem("local_posts") || "[]");
      const savedUserName = localStorage.getItem("userName") || "Gyan Prakash";
      const savedUserRole = localStorage.getItem("userRole") || "Student";
      const newComment = {
        _id: "cmt_" + Date.now(),
        user_id: { name: savedUserName, role: savedUserRole },
        comment_text: content,
        createdAt: new Date().toISOString()
      };
      localPosts = localPosts.map((p: any) => {
        if (p._id === postId || p.id === postId) {
          return { ...p, comments: [...(p.comments || []), newComment] };
        }
        return p;
      });
      localStorage.setItem("local_posts", JSON.stringify(localPosts));
    }
    loadPosts();
  };

  const handleCommentLike = (postId: string, commentId: string) => {
    let likedComments = JSON.parse(localStorage.getItem("liked_comments") || "[]");
    const isCurrentlyLiked = likedComments.includes(commentId);
    if (isCurrentlyLiked) {
      likedComments = likedComments.filter((id: string) => id !== commentId);
    } else {
      likedComments.push(commentId);
    }
    localStorage.setItem("liked_comments", JSON.stringify(likedComments));

    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: post.comments.map((comment) =>
                comment.id === commentId
                  ? {
                      ...comment,
                      likes: comment.isLiked ? Math.max(0, comment.likes - 1) : comment.likes + 1,
                      isLiked: !comment.isLiked,
                    }
                  : comment
              ),
            }
          : post
      )
    );
  };

  const handleCommentEdit = async (postId: string, commentId: string, content: string) => {
    const AppService = (window as any).AppService;
    // Call edit endpoint if online and not a local comment
    if (AppService && !commentId.startsWith("cmt_")) {
      try {
        await fetch(`${AppService.API_BASE}/posts/comment/${commentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comment_text: content })
        });
      } catch (e) {
        console.error(e);
      }
    }

    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: post.comments.map((comment) =>
                comment.id === commentId ? { ...comment, content } : comment
              ),
            }
          : post
      )
    );
  };

  const handleCommentDelete = async (postId: string, commentId: string) => {
    const AppService = (window as any).AppService;
    if (AppService && !commentId.startsWith("cmt_")) {
      try {
        await fetch(`${AppService.API_BASE}/posts/comment/${commentId}`, {
          method: "DELETE"
        });
      } catch (e) {
        console.error(e);
      }
    }

    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: post.comments.filter((comment) => comment.id !== commentId),
            }
          : post
      )
    );
  };

  const handleShare = (postId: string) => {
    const postToShare = posts.find((p) => p.id === postId);
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, shares: post.shares + 1 } : post
      )
    );

    const shareData = {
      title: 'Pragya Connect Community Post',
      text: postToShare ? `"${postToShare.content.substring(0, 100)}..." - ${postToShare.userName}` : 'Check out this post on Pragya Connect!',
      url: window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert('✨ Post link copied to clipboard!');
      });
    }
  };

  const handleRetry = () => {
    setLoading(true);
    setError(false);
    loadPosts();
  };

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [pranaBlessings, setPranaBlessings] = useState<number>(142);
  const [hasBlessed, setHasBlessed] = useState<boolean>(false);
  const [sutraCopied, setSutraCopied] = useState<boolean>(false);

  const handleSendBlessing = () => {
    if (!hasBlessed) {
      setPranaBlessings(prev => prev + 1);
      setHasBlessed(true);
      // Trigger subtle notification
      const audioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (audioCtx) {
        try {
          const ctx = new audioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(528, ctx.currentTime); // 528Hz Solfeggio Love frequency
          gain.gain.setValueAtTime(0.01, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.8);
        } catch (e) {}
      }
    }
  };

  const copySutra = () => {
    const text = '"Yogas Chitta Vritti Nirodha" — Yoga is the calming of the fluctuations of the mind. (Patanjali Yoga Sutras 1.2)';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setSutraCopied(true);
        setTimeout(() => setSutraCopied(false), 2000);
      });
    }
  };

  const filteredPosts = posts.filter(post => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'sadhana') return post.content.toLowerCase().includes('sadhana') || post.content.toLowerCase().includes('streak') || post.content.toLowerCase().includes('pranayama');
    if (activeCategory === 'alignment') return post.content.toLowerCase().includes('alignment') || post.content.toLowerCase().includes('posture') || post.content.toLowerCase().includes('spine');
    if (activeCategory === 'mentors') return post.userRole.toLowerCase().includes('mentor') || post.userRole.toLowerCase().includes('faculty');
    if (activeCategory === 'ayurveda') return post.content.toLowerCase().includes('ayurveda') || post.content.toLowerCase().includes('diet') || post.content.toLowerCase().includes('herb');
    return true;
  });

  if (error) {
    return (
      <div className={cn('max-w-2xl mx-auto py-8 px-4', className)}>
        <ErrorState onRetry={handleRetry} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className={cn('max-w-2xl mx-auto py-8 px-4', className)}>
        <CreatePostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </div>
    );
  }

  return (
    <div className={cn('max-w-3xl mx-auto py-6 px-4 space-y-6', className)}>
      {/* ── 1. Unique Community Prana Pulse Barometer ── */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-5 text-white shadow-lg relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #00381F 0%, #00522E 60%, #9D9D48 100%)',
          border: '1px solid rgba(217, 174, 41, 0.4)'
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: 'rgba(217, 174, 41, 0.2)', border: '1px solid #D9AE29' }}>
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full" style={{ background: '#D9AE29', color: '#00381F' }}>
                  Live Sadhana Pulse
                </span>
                <span className="text-xs text-amber-200 font-semibold">432Hz High Resonance</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                {pranaBlessings} Yogis Practicing in Harmony Today
              </h3>
              <p className="text-xs text-white/80 mt-0.5">
                Collective Sadhana: <strong className="text-amber-300 font-bold">3,840 Hours Logged</strong> across 18 Countries
              </p>
            </div>
          </div>

          <button
            onClick={handleSendBlessing}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md ${
              hasBlessed
                ? 'bg-emerald-800/80 text-amber-200 border border-amber-400/40'
                : 'bg-gradient-to-r from-amber-400 to-amber-300 text-emerald-950 hover:scale-105 active:scale-95'
            }`}
          >
            <span>{hasBlessed ? '✨ Blessings Sent!' : '🙏 Send Namaste Energy'}</span>
          </button>
        </div>
      </motion.div>

      {/* ── 2. Daily Yogic Wisdom & Sutra Card ── */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl p-4 bg-white shadow-sm border border-emerald-900/10 flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
            🕉️
          </div>
          <div>
            <div className="text-[11px] font-bold text-amber-700 tracking-wide uppercase">Patanjali Yoga Sutra 1.2</div>
            <p className="text-sm font-semibold text-emerald-950 mt-0.5 italic">
              "Yogas Chitta Vritti Nirodha — Yoga is the calming of the mind’s ripples."
            </p>
          </div>
        </div>
        <button
          onClick={copySutra}
          className="text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
        >
          <span>{sutraCopied ? '✓ Copied!' : '📋 Copy Wisdom'}</span>
        </button>
      </motion.div>

      {/* ── 3. Category Filter Chips ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: '✨ All Posts', icon: '🌟' },
          { id: 'sadhana', label: '🔥 Daily Sadhana', icon: '🧘' },
          { id: 'alignment', label: '📐 Asana Alignment', icon: '🦴' },
          { id: 'mentors', label: '🎓 Mentor Insights', icon: '👤' },
          { id: 'ayurveda', label: '🌿 Ayurveda & Diet', icon: '🍃' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveCategory(tab.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeCategory === tab.id
                ? 'bg-emerald-900 text-amber-300 shadow-sm'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-emerald-50 hover:text-emerald-900'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── 4. Create Post Component ── */}
      <CreatePost onPost={handleCreatePost} />

      {/* ── 5. Posts Feed Stream ── */}
      {filteredPosts.length === 0 ? (
        <EmptyState
          title="No posts in this category yet"
          description="Be the first to share your practice insights with the community!"
        />
      ) : (
        <AnimatePresence mode="popLayout">
          {filteredPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.08 }}
            >
              <PostCard
                post={post}
                onLike={handleLike}
                onComment={handleComment}
                onCommentLike={handleCommentLike}
                onCommentEdit={handleCommentEdit}
                onCommentDelete={handleCommentDelete}
                onShare={handleShare}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}
