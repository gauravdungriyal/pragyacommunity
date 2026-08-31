import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Search,
  Download,
  FileText,
  Video,
  Music,
  Plus,
  Trash2,
  ExternalLink,
  Sparkles,
  X,
  Bookmark
} from 'lucide-react';
import { resourcesApi } from '../../api/services';
import { Resource } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const ResourcesPage: React.FC = () => {
  const { user, isAdmin, isMentor } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [category, setCategory] = useState('Yoga Guides');
  const [uploading, setUploading] = useState(false);

  const categories = [
    'All',
    'Yoga Guides',
    'Ayurveda & Nutrition',
    'Meditation Audios',
    'Ancient Sutras & E-Books',
    'Research Papers',
  ];

  const fetchResources = async () => {
    try {
      setLoading(true);
      const data = await resourcesApi.getAll();
      if (Array.isArray(data)) {
        // Enriched defaults if database records are minimal
        const enriched = data.map((r, idx) => ({
          ...r,
          fileType: r.file_url?.endsWith('.mp3') ? 'audio' : r.file_url?.includes('youtube') ? 'video' : 'pdf',
          downloads: 120 + idx * 34,
          size: `${2.4 + (idx % 4) * 1.2} MB`,
        }));
        setResources(enriched);
      }
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !fileUrl || !user) return;

    setUploading(true);
    try {
      await resourcesApi.create({
        title,
        description,
        file_url: fileUrl,
        uploaded_by: user.id || user._id || '1',
        category,
      });
      setIsUploadOpen(false);
      setTitle('');
      setDescription('');
      setFileUrl('');
      await fetchResources();
    } catch (err) {
      alert('Failed to upload resource.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;
    try {
      await resourcesApi.delete(id);
      setResources((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      alert('Failed to delete resource.');
    }
  };

  const filteredResources = resources.filter((r) => {
    const matchSearch =
      r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory =
      selectedCategory === 'All' ||
      r.category?.toLowerCase().includes(selectedCategory.toLowerCase());
    return matchSearch && matchCategory;
  });

  const getFileIcon = (fileType?: string) => {
    switch (fileType) {
      case 'audio':
        return <Music className="w-6 h-6 text-purple-500" />;
      case 'video':
        return <Video className="w-6 h-6 text-rose-500" />;
      default:
        return <FileText className="w-6 h-6 text-terracotta-600 dark:text-gold-400" />;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-terracotta-600 via-terracotta-700 to-burgundy-700 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-gold-500/20 text-gold-300 border border-gold-500/30">
            <BookOpen className="w-3.5 h-3.5" />
            Knowledge & Archives
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl">
            Pragya Digital Library
          </h1>
          <p className="text-sand-100/90 text-xs sm:text-sm max-w-xl">
            Explore curated scriptures, guided pranayama audios, Ayurvedic recipes, and academic research papers.
          </p>
        </div>

        {(isAdmin || isMentor) && (
          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gold-500 hover:bg-gold-600 text-charcoal-900 shadow-md shadow-gold-500/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Upload Document
          </button>
        )}
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-sand-200 dark:border-neutral-800 shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search documents, audios, guides..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 focus:outline-none focus:border-terracotta-600 dark:focus:border-gold-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-terracotta-600 dark:bg-gold-500 text-white dark:text-charcoal-900'
                  : 'bg-sand-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-sand-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Resources Cards Grid */}
      {loading ? (
        <div className="p-16 text-center">
          <div className="w-8 h-8 border-4 border-terracotta-600 border-t-gold-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-neutral-500">Loading library materials...</p>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-neutral-900 rounded-3xl border border-sand-200 dark:border-neutral-800">
          <BookOpen className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
          <h4 className="font-bold text-sm text-neutral-800 dark:text-neutral-200">No resources found</h4>
          <p className="text-xs text-neutral-500 mt-1">Try another category or upload a study guide.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((res) => (
            <div
              key={res._id}
              className="bg-white dark:bg-neutral-900 rounded-3xl border border-sand-200 dark:border-neutral-800 shadow-card hover:shadow-card-hover transition-all p-6 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-terracotta-50 dark:bg-terracotta-950/60 flex items-center justify-center flex-shrink-0 border border-terracotta-200/60 dark:border-terracotta-800/60">
                    {getFileIcon(res.fileType)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sand-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                      {res.category || 'Study Material'}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(res._id)}
                        className="p-1 text-neutral-400 hover:text-red-600 transition-colors"
                        title="Delete Resource"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-base text-neutral-900 dark:text-white leading-snug">
                    {res.title}
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {res.description || 'Comprehensive reference document curated by Pragya Connect educators.'}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px] text-neutral-400 border-t border-sand-200 dark:border-neutral-800">
                  <span>By {res.uploaded_by || 'Pragya Scholar'}</span>
                  <span>{res.downloads || 45} views</span>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-sand-200 dark:border-neutral-800 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-neutral-500">
                  {res.size || '3.5 MB'}
                </span>
                <a
                  href={res.file_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-terracotta-600 hover:bg-terracotta-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-charcoal-900 transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Access Resource
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Resource Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setIsUploadOpen(false)}
          />

          <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-sand-200 dark:border-neutral-800 z-10 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-neutral-900 dark:text-white">
                Upload New Resource
              </h3>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g., Complete Ashtanga Yoga Asana Reference Guide"
                  className="w-full p-2.5 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 font-medium"
                >
                  {categories.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  File URL or Link
                </label>
                <input
                  type="url"
                  required
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://drive.google.com/... or https://example.com/file.pdf"
                  className="w-full p-2.5 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief synopsis and table of contents..."
                  className="w-full p-2.5 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-3 rounded-xl font-bold text-sm bg-terracotta-600 hover:bg-terracotta-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-charcoal-900 shadow-md transition-all cursor-pointer"
              >
                {uploading ? 'Publishing...' : 'Add to Digital Library'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
