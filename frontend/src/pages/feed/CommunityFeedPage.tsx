import React, { useEffect, useState } from 'react';
import {
  Flame,
  Heart,
  MessageCircle,
  Share2,
  Image as ImageIcon,
  Send,
  Trash2,
  Filter,
  Sparkles,
  User as UserIcon,
  Tag,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { postsApi } from '../../api/services';
import { Post, Comment } from '../../types';

export const CommunityFeedPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Post Form State
  const [newContent, setNewContent] = useState('');
  const [newImage, setNewImage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [postCategory, setPostCategory] = useState('Yoga & Asana');
  const [submitting, setSubmitting] = useState(false);

  // Active Comment Box State (map of postId -> boolean/string)
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});

  const categories = [
    'All',
    'Yoga & Asana',
    'Ayurveda & Nutrition',
    'Meditation & Pranayama',
    'Philosophy & Sutras',
    'Career & Mentorship',
  ];

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const data = await postsApi.getAll();
      if (Array.isArray(data)) {
        setPosts(data);
      }
    } catch (err: any) {
      setError('Failed to load community discussions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim() || !user) return;

    setSubmitting(true);
    try {
      await postsApi.create({
        user_id: user.id || user._id || '',
        content: newContent,
        image: newImage.trim() ? newImage : undefined,
        category: postCategory,
      });
      setNewContent('');
      setNewImage('');
      await fetchPosts();
    } catch (err) {
      alert('Failed to publish post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    const isCurrentlyLiked = !!likedPosts[postId];
    setLikedPosts((prev) => ({ ...prev, [postId]: !isCurrentlyLiked }));

    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) =>
        p._id === postId
          ? { ...p, likes: isCurrentlyLiked ? Math.max(0, p.likes - 1) : p.likes + 1 }
          : p
      )
    );

    try {
      await postsApi.toggleLike(postId, isCurrentlyLiked ? 'unlike' : 'like');
    } catch (err) {
      // Revert on error
      setLikedPosts((prev) => ({ ...prev, [postId]: isCurrentlyLiked }));
      await fetchPosts();
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text || !user) return;

    try {
      const newComment = await postsApi.addComment({
        post_id: postId,
        user_id: user.id || user._id || '',
        comment_text: text,
      });

      setPosts((prev) =>
        prev.map((p) => {
          if (p._id === postId) {
            const existingComments = p.comments || [];
            const commentObj: Comment = {
              _id: newComment._id || Math.random().toString(),
              post_id: postId,
              user_id: {
                _id: user.id || user._id || '',
                name: user.name,
                role: user.role,
              },
              comment_text: text,
              createdAt: new Date().toISOString(),
            };
            return { ...p, comments: [...existingComments, commentObj] };
          }
          return p;
        })
      );

      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    } catch (err) {
      alert('Failed to add comment.');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await postsApi.delete(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      alert('Failed to delete post.');
    }
  };

  const filteredPosts =
    selectedCategory === 'All'
      ? posts
      : posts.filter((p) => p.category === selectedCategory);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-terracotta-600 via-terracotta-700 to-burgundy-700 text-white shadow-xl flex items-center justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-gold-500/20 text-gold-300 border border-gold-500/30">
            <Flame className="w-3.5 h-3.5" />
            Vibrant Community
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl">
            Community Wisdom Feed
          </h1>
          <p className="text-sand-100/90 text-xs sm:text-sm">
            Share reflections, ask spiritual questions, and engage with fellow learners & mentors.
          </p>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-terracotta-600 dark:bg-gold-500 text-white dark:text-charcoal-900 shadow-sm'
                : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-sand-100 border border-sand-200 dark:border-neutral-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Create Post Card */}
      <div className="bg-white dark:bg-neutral-900 p-5 sm:p-6 rounded-3xl border border-sand-200 dark:border-neutral-800 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-terracotta-600 text-white font-bold text-sm flex items-center justify-center">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
              {user?.name || 'Share an insight'}
            </h3>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Posting to Pragya Community
            </p>
          </div>
        </div>

        <form onSubmit={handleCreatePost} className="space-y-3">
          <textarea
            rows={3}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Share what you discovered during your yoga or study practice..."
            className="w-full p-3.5 text-sm rounded-2xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 focus:outline-none focus:border-terracotta-600 dark:focus:border-gold-500 text-neutral-900 dark:text-white resize-none"
          />

          {/* Optional Image URL Input */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="url"
                value={newImage}
                onChange={(e) => setNewImage(e.target.value)}
                placeholder="Optional image URL (https://...)"
                className="w-full pl-10 pr-3 py-2 text-xs rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 focus:outline-none focus:border-terracotta-600 dark:focus:border-gold-500"
              />
            </div>

            <select
              value={postCategory}
              onChange={(e) => setPostCategory(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 font-semibold text-neutral-700 dark:text-neutral-300"
            >
              {categories.filter((c) => c !== 'All').map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={submitting || !newContent.trim()}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-terracotta-600 hover:bg-terracotta-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-charcoal-900 transition-all flex items-center gap-1.5 disabled:opacity-50 ml-auto cursor-pointer"
            >
              {submitting ? 'Publishing...' : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Publish Post
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Feed Posts List */}
      <div className="space-y-5">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-terracotta-600 border-t-gold-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-neutral-500">Loading community wisdom...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-neutral-900 rounded-3xl border border-sand-200 dark:border-neutral-800">
            <Flame className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
            <h4 className="font-bold text-sm text-neutral-800 dark:text-neutral-200">No posts in this category yet</h4>
            <p className="text-xs text-neutral-500 mt-1">Be the first to share an insight above!</p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const authorName = post.user_id?.name || 'Pragya Member';
            const authorRole = post.user_id?.role || 'Seeker';
            const isAuthor = user && (user.id === post.user_id?._id || user._id === post.user_id?._id);
            const canDelete = isAuthor || isAdmin;
            const isLiked = !!likedPosts[post._id];

            return (
              <article
                key={post._id}
                className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-sand-200 dark:border-neutral-800 shadow-card space-y-4"
              >
                {/* Author Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-terracotta-600 to-terracotta-800 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                      {authorName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                          {authorName}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gold-100 dark:bg-gold-950/60 text-gold-800 dark:text-gold-300 border border-gold-300 dark:border-gold-800">
                          {authorRole}
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-400">
                        {post.createdAt ? new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                      </span>
                    </div>
                  </div>

                  {canDelete && (
                    <button
                      onClick={() => handleDeletePost(post._id)}
                      className="p-2 text-neutral-400 hover:text-red-600 transition-colors"
                      title="Delete Post"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Post Content */}
                <p className="text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-line leading-relaxed">
                  {post.content}
                </p>

                {/* Post Media Attachment */}
                {post.image && (
                  <div className="rounded-2xl overflow-hidden max-h-96 border border-sand-200 dark:border-neutral-800">
                    <img
                      src={post.image}
                      alt="Post visual"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Actions Toolbar */}
                <div className="pt-3 border-t border-sand-200 dark:border-neutral-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-6">
                    {/* Like Button */}
                    <button
                      onClick={() => handleToggleLike(post._id)}
                      className={`flex items-center gap-1.5 font-bold transition-all ${
                        isLiked
                          ? 'text-rose-500 fill-rose-500 scale-105'
                          : 'text-neutral-500 hover:text-rose-500'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                      <span>{post.likes || 0} Likes</span>
                    </button>

                    {/* Comment Toggle Button */}
                    <button
                      onClick={() =>
                        setActiveCommentPostId(
                          activeCommentPostId === post._id ? null : post._id
                        )
                      }
                      className="flex items-center gap-1.5 font-bold text-neutral-500 hover:text-terracotta-700 dark:hover:text-gold-400 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.comments?.length || 0} Comments</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.href);
                      alert('Post link copied to clipboard!');
                    }}
                    className="flex items-center gap-1.5 font-bold text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>

                {/* Comment Section (Expandable) */}
                {activeCommentPostId === post._id && (
                  <div className="mt-4 pt-4 border-t border-sand-200 dark:border-neutral-800 space-y-3">
                    {/* Comments List */}
                    <div className="space-y-2.5 max-h-60 overflow-y-auto">
                      {post.comments && post.comments.length > 0 ? (
                        post.comments.map((c) => (
                          <div
                            key={c._id}
                            className="p-3 rounded-2xl bg-sand-50 dark:bg-neutral-800/60 text-xs flex items-start gap-2.5"
                          >
                            <div className="w-7 h-7 rounded-full bg-terracotta-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0">
                              {typeof c.user_id === 'object'
                                ? c.user_id.name?.charAt(0) || 'U'
                                : 'U'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-neutral-900 dark:text-white">
                                  {typeof c.user_id === 'object' ? c.user_id.name : 'Seeker'}
                                </span>
                                <span className="text-[10px] text-neutral-400">
                                  {new Date(c.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-neutral-700 dark:text-neutral-300 mt-0.5">
                                {c.comment_text}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-neutral-400 text-center py-2">
                          No comments yet. Start the conversation!
                        </p>
                      )}
                    </div>

                    {/* Add Comment Input */}
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="text"
                        placeholder="Write a thoughtful comment..."
                        value={commentInputs[post._id] || ''}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({
                            ...prev,
                            [post._id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post._id)}
                        className="flex-1 px-4 py-2 text-xs rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 focus:outline-none focus:border-terracotta-600 dark:focus:border-gold-500"
                      />
                      <button
                        onClick={() => handleAddComment(post._id)}
                        className="p-2 rounded-xl bg-terracotta-600 dark:bg-gold-500 text-white dark:text-charcoal-900 font-bold"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};
