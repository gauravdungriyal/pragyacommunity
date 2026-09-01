import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Download,
  FileText,
  Video,
  Music,
  Plus,
  Trash2,
  X,
  GraduationCap,
  Library,
  SlidersHorizontal,
  Check,
  AlertCircle,
} from 'lucide-react';
import { coursesApi, resourcesApi } from '../../api/services';
import { Course, Resource, ResourceCategory } from '../../types';
import { useAuth } from '../../context/AuthContext';

const fileIcon = (fileUrl: string) => {
  const url = (fileUrl || '').toLowerCase();
  if (url.endsWith('.mp3') || url.endsWith('.wav') || url.endsWith('.m4a')) {
    return <Music className="w-5 h-5 text-purple-500" />;
  }
  if (url.includes('youtube') || url.includes('vimeo') || url.endsWith('.mp4')) {
    return <Video className="w-5 h-5 text-rose-500" />;
  }
  return <FileText className="w-5 h-5 text-terracotta-600 dark:text-gold-400" />;
};

const ResourceCard: React.FC<{
  resource: Resource;
  canManage: boolean;
  onDelete: (id: string) => void;
}> = ({ resource, canManage, onDelete }) => (
  <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-sand-200 dark:border-neutral-800 shadow-card hover:shadow-card-hover transition-all p-4 sm:p-5 flex flex-col justify-between gap-4">
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="w-10 h-10 rounded-xl bg-terracotta-50 dark:bg-terracotta-950/60 flex items-center justify-center flex-shrink-0 border border-terracotta-200/60 dark:border-terracotta-800/60">
          {fileIcon(resource.file_url)}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sand-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
            {resource.category || 'Material'}
          </span>
          {canManage && (
            <button
              onClick={() => onDelete(resource._id)}
              className="p-1 text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
              title="Delete resource"
              aria-label={`Delete ${resource.title}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div>
        <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white leading-snug">
          {resource.title}
        </h3>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1.5 line-clamp-2 leading-relaxed">
          {resource.description || 'Reference material curated by Pragya Connect educators.'}
        </p>
      </div>
    </div>

    <div className="pt-3 border-t border-sand-200 dark:border-neutral-800 flex items-center justify-between gap-2">
      <span className="text-[11px] text-neutral-500 truncate">By {resource.author_name || 'Pragya Scholar'}</span>
      <a
        href={resource.file_url || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="px-3 py-2 rounded-xl text-xs font-bold bg-terracotta-600 hover:bg-terracotta-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-charcoal-900 transition-all flex items-center gap-1.5 shadow-xs flex-shrink-0"
      >
        <Download className="w-3.5 h-3.5" />
        Open
      </a>
    </div>
  </div>
);

export const ResourcesPage: React.FC = () => {
  const { isAdmin, isStaff } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [resources, setResources] = useState<Resource[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const courseFilter = searchParams.get('course');

  // Upload modal
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [category, setCategory] = useState('');
  const [uploadCourseId, setUploadCourseId] = useState('');
  const [uploading, setUploading] = useState(false);

  // Filter manager (admin)
  const [isFilterManagerOpen, setIsFilterManagerOpen] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');
  const [filterBusy, setFilterBusy] = useState(false);
  const [filterError, setFilterError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [resourceData, courseData, categoryData] = await Promise.allSettled([
        resourcesApi.getAll(),
        coursesApi.getMine(),
        resourcesApi.getCategories(),
      ]);

      if (resourceData.status === 'fulfilled') setResources(resourceData.value);
      if (courseData.status === 'fulfilled') setCourses(courseData.value);
      if (categoryData.status === 'fulfilled') {
        setCategories(categoryData.value);
        if (categoryData.value.length > 0) {
          setCategory((current) => current || categoryData.value[0].name);
        }
      }
    } catch (err) {
      setError('Failed to load the library.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !fileUrl) return;

    setUploading(true);
    setError(null);
    try {
      await resourcesApi.create({
        title,
        description,
        file_url: fileUrl,
        category: category || 'Yoga Guides',
        course_id: uploadCourseId ? Number(uploadCourseId) : null,
      });
      setIsUploadOpen(false);
      setTitle('');
      setDescription('');
      setFileUrl('');
      setUploadCourseId('');
      await loadAll();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to upload the resource.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this resource?')) return;
    try {
      await resourcesApi.delete(id);
      setResources((prev) => prev.filter((r) => r._id !== id));
    } catch {
      setError('Failed to delete the resource.');
    }
  };

  const handleCreateFilter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilterName.trim()) return;

    setFilterBusy(true);
    setFilterError(null);
    try {
      const created = await resourcesApi.createCategory(newFilterName.trim());
      setCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewFilterName('');
    } catch (err: any) {
      setFilterError(err?.response?.data?.message || 'Could not create that filter.');
    } finally {
      setFilterBusy(false);
    }
  };

  const handleDeleteFilter = async (id: number) => {
    try {
      await resourcesApi.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setFilterError('Could not delete that filter.');
    }
  };

  /** Apply the search box and the active category to any list. */
  const applyFilters = useCallback(
    (list: Resource[]) =>
      list.filter((r) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          !q ||
          r.title?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q);
        const matchesCategory = selectedCategory === 'All' || r.category === selectedCategory;
        return matchesSearch && matchesCategory;
      }),
    [searchQuery, selectedCategory]
  );

  // Course material is grouped per course; staff see every course, members see theirs
  const courseSections = useMemo(() => {
    const visibleCourses = courseFilter
      ? courses.filter((c) => String(c.id) === courseFilter)
      : courses;

    const sections = visibleCourses.map((course) => ({
      course,
      items: applyFilters(resources.filter((r) => r.course_id === course.id)),
    }));

    if (isStaff && !courseFilter) {
      // Include course material the staff member is not enrolled on
      const knownIds = new Set(visibleCourses.map((c) => c.id));
      const orphanCourses = new Map<number, string>();
      resources.forEach((r) => {
        if (r.course_id && !knownIds.has(r.course_id)) {
          orphanCourses.set(r.course_id, r.course_name || 'Course');
        }
      });
      orphanCourses.forEach((name, id) => {
        sections.push({
          course: { id, _id: String(id), name } as Course,
          items: applyFilters(resources.filter((r) => r.course_id === id)),
        });
      });
    }

    return sections.filter((s) => s.items.length > 0);
  }, [courses, resources, applyFilters, isStaff, courseFilter]);

  // Everything not tied to a course sits on the shared shelf at the bottom
  const extraResources = useMemo(
    () => applyFilters(resources.filter((r) => r.is_extra)),
    [resources, applyFilters]
  );

  const filterOptions = ['All', ...categories.map((c) => c.name)];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-8">
      {/* Header */}
      <div className="p-5 sm:p-8 rounded-3xl bg-gradient-to-r from-terracotta-600 via-terracotta-700 to-burgundy-700 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-gold-500/20 text-gold-300 border border-gold-500/30">
            <BookOpen className="w-3.5 h-3.5" />
            Knowledge & Archives
          </div>
          <h1 className="font-display font-extrabold text-xl sm:text-3xl">Resource Library</h1>
          <p className="text-sand-100/90 text-xs sm:text-sm max-w-xl">
            Material for the courses you are enrolled on, plus an open shelf of extra reading for everyone.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {isAdmin && (
            <button
              onClick={() => setIsFilterManagerOpen(true)}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-2 cursor-pointer flex-1 md:flex-none justify-center"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Manage Filters
            </button>
          )}
          {isStaff && (
            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-gold-500 hover:bg-gold-600 text-charcoal-900 shadow-md shadow-gold-500/20 transition-all flex items-center gap-2 cursor-pointer flex-1 md:flex-none justify-center"
            >
              <Plus className="w-4 h-4" />
              Upload
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </span>
          <button onClick={() => setError(null)} className="font-bold underline whitespace-nowrap">Dismiss</button>
        </div>
      )}

      {/* Search + category filters */}
      <div className="bg-white dark:bg-neutral-900 p-3 sm:p-4 rounded-2xl border border-sand-200 dark:border-neutral-800 shadow-card flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative w-full lg:w-80 flex-shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search documents, audios, guides…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 focus:outline-none focus:border-terracotta-600 dark:focus:border-gold-500 text-neutral-900 dark:text-white"
          />
        </div>

        <div className="flex items-center lg:flex-wrap gap-2 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0 scrollbar-none">
          {filterOptions.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-terracotta-600 dark:bg-gold-500 text-white dark:text-charcoal-900'
                  : 'bg-sand-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-sand-100 dark:hover:bg-neutral-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {courseFilter && (
          <button
            onClick={() => setSearchParams({})}
            className="text-xs font-bold text-terracotta-700 dark:text-gold-400 underline whitespace-nowrap lg:ml-auto"
          >
            Clear course filter
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-12 sm:p-16 text-center">
          <div className="w-8 h-8 border-4 border-terracotta-600 border-t-gold-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-neutral-500">Loading library…</p>
        </div>
      ) : (
        <>
          {/* Course-specific material, grouped by course name */}
          <section className="space-y-5">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-forest-600 dark:text-gold-400" />
              <h2 className="font-display font-bold text-lg sm:text-xl text-neutral-900 dark:text-white">
                Course Material
              </h2>
            </div>

            {courseSections.length > 0 ? (
              <div className="space-y-6">
                {courseSections.map(({ course, items }) => (
                  <div key={course.id} className="space-y-3">
                    <div className="flex items-center justify-between gap-3 pb-2 border-b border-sand-200 dark:border-neutral-800">
                      <h3 className="font-bold text-sm sm:text-base text-neutral-800 dark:text-neutral-100">
                        {course.name}
                      </h3>
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-forest-50 dark:bg-forest-950/60 text-forest-700 dark:text-forest-300 whitespace-nowrap">
                        {items.length} {items.length === 1 ? 'file' : 'files'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {items.map((res) => (
                        <ResourceCard key={res._id} resource={res} canManage={isStaff} onDelete={handleDelete} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 sm:p-8 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-sand-200 dark:border-neutral-800">
                <GraduationCap className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                  No course material matches this view
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  {courses.length === 0
                    ? 'You are not enrolled on a course yet — the extra resources below are open to everyone.'
                    : 'Try clearing the search or filter above.'}
                </p>
              </div>
            )}
          </section>

          {/* Extra resources — open to every member */}
          <section className="space-y-4 pt-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Library className="w-5 h-5 text-brandTeal-600 dark:text-brandTeal-300" />
                <h2 className="font-display font-bold text-lg sm:text-xl text-neutral-900 dark:text-white">
                  Extra Resources
                </h2>
              </div>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 text-right">
                Open to every member
              </span>
            </div>

            {extraResources.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {extraResources.map((res) => (
                  <ResourceCard key={res._id} resource={res} canManage={isStaff} onDelete={handleDelete} />
                ))}
              </div>
            ) : (
              <div className="p-6 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-sand-200 dark:border-neutral-800">
                <p className="text-xs text-neutral-500">No extra resources match your search.</p>
              </div>
            )}
          </section>
        </>
      )}

      {/* Upload modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setIsUploadOpen(false)} />

          <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl p-5 sm:p-8 shadow-2xl border border-sand-200 dark:border-neutral-800 z-10 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base sm:text-lg text-neutral-900 dark:text-white">
                Upload Resource
              </h3>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                aria-label="Close"
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
                  placeholder="Hatha Sequence Workbook"
                  className="w-full p-2.5 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  Course
                </label>
                <select
                  value={uploadCourseId}
                  onChange={(e) => setUploadCourseId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
                >
                  <option value="">Extra resource (open to everyone)</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-neutral-500 mt-1">
                  Choosing a course files this under that course's material.
                </p>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  Filter / Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
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
                  placeholder="https://example.com/file.pdf"
                  className="w-full p-2.5 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
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
                  placeholder="What this covers…"
                  className="w-full p-2.5 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 resize-none text-neutral-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-3 rounded-xl font-bold text-sm bg-terracotta-600 hover:bg-terracotta-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-charcoal-900 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {uploading ? 'Publishing…' : 'Add to Library'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Admin filter manager */}
      {isFilterManagerOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setIsFilterManagerOpen(false)} />

          <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl p-5 sm:p-8 shadow-2xl border border-sand-200 dark:border-neutral-800 z-10 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base sm:text-lg text-neutral-900 dark:text-white">
                Library Filters
              </h3>
              <button
                onClick={() => setIsFilterManagerOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Filters appear as category buttons on the library and in the upload form.
            </p>

            {filterError && (
              <p className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs font-semibold text-red-700 dark:text-red-300">
                {filterError}
              </p>
            )}

            <form onSubmit={handleCreateFilter} className="flex items-center gap-2">
              <input
                type="text"
                value={newFilterName}
                onChange={(e) => setNewFilterName(e.target.value)}
                placeholder="New filter name"
                className="flex-1 p-2.5 text-xs rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={filterBusy || !newFilterName.trim()}
                className="p-2.5 rounded-xl bg-forest-600 dark:bg-gold-500 text-white dark:text-charcoal-900 disabled:opacity-50 cursor-pointer"
                aria-label="Add filter"
              >
                <Check className="w-4 h-4" />
              </button>
            </form>

            <ul className="space-y-2">
              {categories.map((cat) => (
                <li
                  key={cat.id}
                  className="flex items-center justify-between gap-2 p-3 rounded-xl bg-sand-50 dark:bg-neutral-800/60 border border-sand-200 dark:border-neutral-700"
                >
                  <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                    {cat.name}
                  </span>
                  <button
                    onClick={() => handleDeleteFilter(cat.id)}
                    className="p-1 text-neutral-400 hover:text-red-600 transition-colors cursor-pointer flex-shrink-0"
                    aria-label={`Delete ${cat.name} filter`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
              {categories.length === 0 && (
                <li className="text-xs text-neutral-500 text-center py-3">No filters yet.</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
