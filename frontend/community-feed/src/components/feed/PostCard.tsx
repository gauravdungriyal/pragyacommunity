import { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Send, Edit2, Trash2, Smile } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Post, Comment } from '../../types';

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
  onCommentLike: (postId: string, commentId: string) => void;
  onCommentEdit: (postId: string, commentId: string, content: string) => void;
  onCommentDelete: (postId: string, commentId: string) => void;
  onShare: (postId: string) => void;
  className?: string;
}

export function PostCard({
  post,
  onLike,
  onComment,
  onCommentLike,
  onCommentEdit,
  onCommentDelete,
  onShare,
  className,
}: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [copiedCommentId, setCopiedCommentId] = useState<string | null>(null);
  const [showCommentEmojiPicker, setShowCommentEmojiPicker] = useState(false);

  const whatsappEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🎉', '🔥', '👏', '💡'];

  const handleAddCommentEmoji = (emoji: string) => {
    setCommentText((prev) => prev + emoji);
    setShowCommentEmojiPicker(false);
  };

  const handleCommentShare = (comment: Comment) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(comment.content).then(() => {
        setCopiedCommentId(comment.id);
        setTimeout(() => setCopiedCommentId(null), 2000);
      });
    }
    if (navigator.share) {
      navigator.share({
        text: comment.content,
      }).catch(() => {});
    }
  };

  const handleCommentSubmit = () => {
    if (commentText.trim()) {
      onComment(post.id, commentText.trim());
      setCommentText('');
      setShowComments(true);
    }
  };

  const handleCommentEdit = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditCommentText(comment.content);
  };

  const handleCommentEditSubmit = () => {
    if (editingCommentId && editCommentText.trim()) {
      onCommentEdit(post.id, editingCommentId, editCommentText.trim());
      setEditingCommentId(null);
      setEditCommentText('');
    }
  };

  const handleCommentEditCancel = () => {
    setEditingCommentId(null);
    setEditCommentText('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden', className)}
    >
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={post.userAvatar}
            alt={post.userName}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <h4 className="font-semibold text-gray-900">{post.userName}</h4>
            <p className="text-sm text-gray-500">{post.userRole}</p>
            <p className="text-xs text-gray-400">{post.timestamp}</p>
          </div>
        </div>
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="More options"
          >
            <MoreHorizontal className="w-5 h-5 text-gray-600" />
          </motion.button>
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10"
              >
                <button 
                  onClick={() => {
                    const saved = JSON.parse(localStorage.getItem("saved_posts") || "[]");
                    if (!saved.includes(post.id)) {
                      saved.push(post.id);
                      localStorage.setItem("saved_posts", JSON.stringify(saved));
                      alert("Post saved successfully!");
                    } else {
                      alert("Post is already saved!");
                    }
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm text-gray-700"
                >
                  Save post
                </button>
                <button 
                  onClick={() => {
                    const hidden = JSON.parse(localStorage.getItem("hidden_posts") || "[]");
                    hidden.push(post.id);
                    localStorage.setItem("hidden_posts", JSON.stringify(hidden));
                    alert("Post hidden.");
                    setShowMenu(false);
                    window.dispatchEvent(new Event("postsUpdated"));
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm text-gray-700"
                >
                  Hide post
                </button>
                <button 
                  onClick={() => {
                    const reason = prompt("Enter reason for reporting this post:");
                    if (reason !== null && reason.trim() !== "") {
                      alert("Thank you. Our moderators will review this post shortly.");
                    }
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm text-red-600"
                >
                  Report
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-4">
        <p className="text-gray-900 whitespace-pre-wrap mb-4">{post.content}</p>
        {post.image && (
          <img
            src={post.image}
            alt="Post image"
            className="w-full rounded-lg object-cover max-h-96"
          />
        )}
      </div>

      {/* Post Actions */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => onLike(post.id)}
          className={cn(
            'p-2 rounded-lg transition-colors cursor-pointer',
            post.isLiked ? 'text-red-500 bg-red-50' : 'text-gray-600 hover:bg-gray-100'
          )}
          aria-label={post.isLiked ? "Unlike post" : "Like post"}
        >
          <motion.div
            key={post.isLiked ? 'liked' : 'unliked'}
            animate={{ scale: post.isLiked ? [1, 1.4, 1] : [1, 0.85, 1] }}
            transition={{ duration: 0.25 }}
          >
            <Heart className={cn('w-5 h-5 transition-colors', post.isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600')} />
          </motion.div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setShowComments(!showComments)}
          className={cn(
            'p-2 rounded-lg transition-colors cursor-pointer',
            showComments ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:bg-gray-100'
          )}
          aria-label="Comments"
        >
          <MessageCircle className="w-5 h-5" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => onShare(post.id)}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Share post"
        >
          <Share2 className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-100"
          >
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {post.comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <img
                    src={comment.userAvatar}
                    alt={comment.userName}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1">
                    {editingCommentId === comment.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editCommentText}
                          onChange={(e) => setEditCommentText(e.target.value)}
                          className="w-full p-2 border border-gray-200 rounded-lg text-sm resize-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleCommentEditSubmit}
                            className="px-3 py-1 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"
                          >
                            Save
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleCommentEditCancel}
                            className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
                          >
                            Cancel
                          </motion.button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between">
                          <div>
                            <h5 className="font-semibold text-sm text-gray-900">{comment.userName}</h5>
                            <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleCommentEdit(comment)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                              aria-label="Edit comment"
                            >
                              <Edit2 className="w-3 h-3 text-gray-400" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => onCommentDelete(post.id, comment.id)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                              aria-label="Delete comment"
                            >
                              <Trash2 className="w-3 h-3 text-gray-400" />
                            </motion.button>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onCommentLike(post.id, comment.id)}
                            className={cn(
                              'flex items-center text-xs transition-colors cursor-pointer p-1 rounded hover:bg-gray-100',
                              comment.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                            )}
                            aria-label={comment.isLiked ? "Unlike comment" : "Like comment"}
                          >
                            <Heart className={cn('w-3.5 h-3.5 transition-colors', comment.isLiked ? 'fill-red-500 text-red-500' : 'text-gray-500')} />
                          </motion.button>
                          <span className="text-xs text-gray-400">{comment.timestamp}</span>
                          <span className="text-xs text-gray-300">•</span>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleCommentShare(comment)}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-600 transition-colors"
                            aria-label="Share comment"
                          >
                            <Share2 className="w-3 h-3" />
                            <span>{copiedCommentId === comment.id ? 'Copied!' : 'Share'}</span>
                          </motion.button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Comment */}
            <div className="p-4 border-t border-gray-100">
              <div className="flex gap-3 items-center">
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowCommentEmojiPicker(!showCommentEmojiPicker)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                    aria-label="Add emoji"
                  >
                    <Smile className="w-5 h-5" />
                  </motion.button>
                  <AnimatePresence>
                    {showCommentEmojiPicker && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full left-0 mb-2 p-2 bg-white rounded-lg shadow-lg border border-gray-200 grid grid-cols-5 gap-1.5 z-10"
                      >
                        {whatsappEmojis.map((emoji) => (
                          <motion.button
                            key={emoji}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleAddCommentEmoji(emoji)}
                            className="text-xl p-1 hover:bg-gray-100 rounded"
                          >
                            {emoji}
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit()}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCommentSubmit}
                  disabled={!commentText.trim()}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    commentText.trim()
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  )}
                >
                  <Send className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
