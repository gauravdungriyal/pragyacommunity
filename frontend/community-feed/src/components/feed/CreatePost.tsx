import { useState, useRef } from 'react';
import { Image, Smile, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface CreatePostProps {
  onPost: (content: string, image?: string) => void;
  className?: string;
}

export function CreatePost({ onPost, className }: CreatePostProps) {
  const [content, setContent] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const savedUserName = typeof window !== 'undefined' ? (localStorage.getItem("userName") || 'Pragya') : 'Pragya';
  const savedUserAvatar = typeof window !== 'undefined' ? localStorage.getItem("profileImage") : null;
  const isPragya = savedUserName.toLowerCase().includes('pragya');
  const userBadge = typeof window !== 'undefined' ? (localStorage.getItem("userBadge") || (isPragya ? 'Super Diamond 💎✨' : 'Diamond Member 💎')) : 'Diamond Member 💎';
  const activeUser = {
    name: savedUserName,
    badge: userBadge,
    avatar: savedUserAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(savedUserName)}`,
  };

  const emojis = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🎉', '🔥', '👏', '💡'];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddEmoji = (emoji: string) => {
    setContent(prev => prev + emoji);
    setIsEmojiPickerOpen(false);
  };

  const handleSubmit = () => {
    if (content.trim() || image) {
      onPost(content, image || undefined);
      setContent('');
      setImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const isDisabled = !content.trim() && !image;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6', className)}
    >
      <div className="flex items-start gap-3 mb-4">
        <img
          src={activeUser.avatar}
          alt={activeUser.name}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts with the community..."
            className="w-full min-h-[80px] p-3 bg-gray-50 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none resize-none transition-all"
            rows={3}
          />
        </div>
      </div>

      <AnimatePresence>
        {image && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="relative mb-4"
          >
            <img
              src={image}
              alt="Preview"
              className="w-full max-h-96 object-cover rounded-lg"
            />
            <button
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Add image"
          >
            <Image className="w-5 h-5 text-gray-600" />
          </motion.button>

          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Add emoji"
            >
              <Smile className="w-5 h-5 text-gray-600" />
            </motion.button>

            <AnimatePresence>
              {isEmojiPickerOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-0 mb-2 p-3 bg-white rounded-lg shadow-lg border border-gray-200 grid grid-cols-5 gap-2 z-10"
                >
                  {emojis.map((emoji) => (
                    <motion.button
                      key={emoji}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleAddEmoji(emoji)}
                      className="text-2xl p-1 hover:bg-gray-100 rounded"
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={isDisabled}
          className={cn(
            'px-6 py-2 rounded-lg font-medium transition-colors',
            isDisabled
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          )}
        >
          Post
        </motion.button>
      </div>
    </motion.div>
  );
}
