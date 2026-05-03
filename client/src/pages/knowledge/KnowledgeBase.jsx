import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FaPlus,
  FaSearch,
  FaTimes,
  FaEye,
  FaThumbsUp,
  FaBookOpen,
  FaExclamationCircle,
  FaEdit,
  FaTrash,
} from 'react-icons/fa';
import toast from 'react-hot-toast';

import API from '../../api/axios';
import '../dashboard/Dashboard.css';

const CATEGORY_TABS = [
  'All',
  'Network & Wi-Fi',
  'Password & Account',
  'Hardware',
  'Software',
  'Email',
  'Printing',
  'General ICT',
  'Security',
];

const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const formatNumber = (value) => Number(value || 0).toLocaleString('en-US');

const getCategoryBadgeClass = (category) => {
  switch (category) {
    case 'Network & Wi-Fi':
      return 'kb-cat-network';
    case 'Password & Account':
      return 'kb-cat-password';
    case 'Hardware':
      return 'kb-cat-hardware';
    case 'Software':
      return 'kb-cat-software';
    case 'Email':
      return 'kb-cat-email';
    case 'Printing':
      return 'kb-cat-printing';
    case 'General ICT':
      return 'kb-cat-general';
    case 'Security':
      return 'kb-cat-security';
    default:
      return 'kb-cat-general';
  }
};

const normalizeTags = (input) =>
  input
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

const KnowledgeBase = () => {
  const { user } = useSelector((state) => state.auth);
  const [searchParams, setSearchParams] = useSearchParams();

  const isPrivileged = user?.role === 'admin' || user?.role === 'ict_officer';
  const isAdmin = user?.role === 'admin';

  const [baseLoading, setBaseLoading] = useState(true);
  const [articles, setArticles] = useState([]);
  const [allArticles, setAllArticles] = useState([]);
  const [stats, setStats] = useState(null);

  const [searchLoading, setSearchLoading] = useState(false);
  const [searchText, setSearchText] = useState(searchParams.get('q') || '');
  const activeCategory = searchParams.get('category') || 'All';

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [savingForm, setSavingForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Network & Wi-Fi',
    status: 'draft',
    tagsInput: '',
    content: '',
  });

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const q = searchParams.get('q') || '';

  const fetchArticles = async (params = {}) => {
    const hasSearch = !!params.q;
    if (hasSearch) setSearchLoading(true);
    else setBaseLoading(true);

    try {
      const endpoint = hasSearch ? '/knowledge/search' : '/knowledge';
      const { data } = await API.get(endpoint, { params });
      setArticles(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load articles.');
      setArticles([]);
    } finally {
      if (hasSearch) setSearchLoading(false);
      else setBaseLoading(false);
    }
  };

  const refreshAll = async () => {
    try {
      const [allRes, statsRes] = await Promise.all([
        API.get('/knowledge'),
        isPrivileged ? API.get('/knowledge/stats') : Promise.resolve(null),
      ]);

      const all = Array.isArray(allRes?.data?.data) ? allRes.data.data : [];
      setAllArticles(all);
      setStats(statsRes?.data?.data || null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to refresh knowledge data.');
    }
  };

  useEffect(() => {
    const init = async () => {
      await refreshAll();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPrivileged]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const category = searchParams.get('category');
      const query = searchParams.get('q');
      const params = {};
      if (query) params.q = query;
      if (category && category !== 'All' && !query) params.category = category;
      fetchArticles(params);
    }, 280);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  const categoryCounts = useMemo(() => {
    const counts = Object.fromEntries(CATEGORY_TABS.map((c) => [c, 0]));
    counts.All = allArticles.length;
    allArticles.forEach((a) => {
      if (counts[a.category] !== undefined) counts[a.category] += 1;
    });
    return counts;
  }, [allArticles]);

  const mostViewed = useMemo(() => {
    return [...allArticles]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5);
  }, [allArticles]);

  const openCreateModal = () => {
    setEditingArticle(null);
    setFormError('');
    setShowPreview(false);
    setFormData({
      title: '',
      category: 'Network & Wi-Fi',
      status: 'draft',
      tagsInput: '',
      content: '',
    });
    setShowFormModal(true);
  };

  const openEditModal = async (articleId) => {
    try {
      const { data } = await API.get(`/knowledge/${articleId}`);
      const article = data?.data;
      if (!article) return;
      setEditingArticle(article);
      setFormError('');
      setShowPreview(false);
      setFormData({
        title: article.title || '',
        category: article.category || 'Network & Wi-Fi',
        status: article.status || 'draft',
        tagsInput: Array.isArray(article.tags) ? article.tags.join(', ') : '',
        content: article.content || '',
      });
      setShowFormModal(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load article for edit.');
    }
  };

  const onSubmitForm = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.title.trim() || !formData.category || !formData.content.trim()) {
      setFormError('Title, category and content are required.');
      return;
    }

    const payload = {
      title: formData.title.trim(),
      category: formData.category,
      status: formData.status,
      tags: normalizeTags(formData.tagsInput),
      content: formData.content.trim(),
    };

    try {
      setSavingForm(true);
      if (editingArticle?._id) {
        await API.put(`/knowledge/${editingArticle._id}`, payload);
        toast.success('Article updated successfully');
      } else {
        await API.post('/knowledge', payload);
        toast.success('Article published successfully');
      }
      setShowFormModal(false);
      await refreshAll();
      const params = {};
      if (q) params.q = q;
      if (activeCategory !== 'All' && !q) params.category = activeCategory;
      await fetchArticles(params);
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to save article.';
      setFormError(message);
      toast.error(message);
    } finally {
      setSavingForm(false);
    }
  };

  const onDeleteArticle = async () => {
    if (!deleteTarget?._id) return;
    try {
      setDeleting(true);
      await API.delete(`/knowledge/${deleteTarget._id}`);
      toast.success('Article deleted');
      setDeleteTarget(null);
      await refreshAll();
      const params = {};
      if (q) params.q = q;
      if (activeCategory !== 'All' && !q) params.category = activeCategory;
      await fetchArticles(params);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete article.');
    } finally {
      setDeleting(false);
    }
  };

  const onCategoryChange = (category) => {
    const next = new URLSearchParams(searchParams);
    if (category === 'All') next.delete('category');
    else next.set('category', category);
    if (next.get('q')) next.delete('q');
    setSearchText('');
    setSearchParams(next);
  };

  const onSearchInput = (value) => {
    setSearchText(value);
    const next = new URLSearchParams(searchParams);
    if (value.trim()) next.set('q', value.trim());
    else next.delete('q');
    if (next.get('category')) next.delete('category');
    setSearchParams(next);
  };

  const clearSearch = () => {
    setSearchText('');
    const next = new URLSearchParams(searchParams);
    next.delete('q');
    setSearchParams(next);
  };

  const loading = baseLoading || searchLoading;

  return (
    <section aria-label="Administrator dashboard">
      <header className="page-header">
        <div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', color: 'var(--text)' }}>Knowledge Base</h1>
          <p style={{ margin: '8px 0 0', color: 'var(--text-muted)' }}>
            Find answers to common ICT problems and self-service guides
          </p>
        </div>

        {isPrivileged && (
          <button type="button" className="btn btn-primary" onClick={openCreateModal}>
            <FaPlus /> New Article
          </button>
        )}
      </header>

      {isPrivileged && (
        <div className="stats-grid" style={{ marginTop: 4, marginBottom: 10 }}>
          <article className="stat-card">
            <div className="stat-icon" style={{ color: '#2563eb', background: 'rgba(37, 99, 235, 0.12)' }}>
              <FaBookOpen />
            </div>
            <div>
              <p className="stat-value">{formatNumber(stats?.total || allArticles.length)}</p>
              <p className="stat-label">Total Articles</p>
            </div>
          </article>
          <article className="stat-card">
            <div className="stat-icon" style={{ color: '#16a34a', background: 'rgba(22, 163, 74, 0.12)' }}>
              <FaBookOpen />
            </div>
            <div>
              <p className="stat-value">
                {formatNumber((stats?.byStatus || []).find((s) => s._id === 'published')?.count || 0)}
              </p>
              <p className="stat-label">Published</p>
            </div>
          </article>
          <article className="stat-card">
            <div className="stat-icon" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.14)' }}>
              <FaBookOpen />
            </div>
            <div>
              <p className="stat-value">
                {formatNumber((stats?.byStatus || []).find((s) => s._id === 'draft')?.count || 0)}
              </p>
              <p className="stat-label">Drafts</p>
            </div>
          </article>
          <article className="stat-card">
            <div className="stat-icon" style={{ color: '#0ea5e9', background: 'rgba(14, 165, 233, 0.14)' }}>
              <FaEye />
            </div>
            <div>
              <p className="stat-value">
                {formatNumber(
                  (Array.isArray(stats?.topViewed) ? stats.topViewed : []).reduce((acc, it) => acc + (it.views || 0), 0)
                )}
              </p>
              <p className="stat-label">Total Views (Top 5)</p>
            </div>
          </article>
        </div>
      )}

      <article className="card">
        <div className="card-body">
          <div className="kb-search-bar-wrap">
            <FaSearch className="kb-search-icon" />
            <input
              className="kb-search-input"
              value={searchText}
              onChange={(e) => onSearchInput(e.target.value)}
              placeholder="Search articles... e.g. Wi-Fi, password reset, printing"
            />
            {searchLoading && <div className="kb-search-spinner" aria-label="Searching" />}
            {!!searchText && !searchLoading && (
              <button className="kb-clear-search" type="button" onClick={clearSearch} aria-label="Clear search">
                <FaTimes />
              </button>
            )}
          </div>

          {!!q && (
            <p className="kb-result-line">
              Showing {articles.length} results for <strong>{q}</strong>
            </p>
          )}

          <div className="kb-tabs-scroll">
            {CATEGORY_TABS.map((tab) => {
              const active = activeCategory === tab || (tab === 'All' && !searchParams.get('category'));
              return (
                <button
                  key={tab}
                  type="button"
                  className={`kb-tab ${active ? 'active' : ''}`}
                  onClick={() => onCategoryChange(tab)}
                >
                  <span>{tab}</span>
                  <span className="kb-tab-count">{categoryCounts[tab] || 0}</span>
                </button>
              );
            })}
          </div>
        </div>
      </article>

      <div className="kb-layout">
        <div className="kb-main">
          {loading ? (
            <div className="spinner-wrap">
              <div className="spinner" />
            </div>
          ) : articles.length === 0 ? (
            <div className="empty-state">
              <FaExclamationCircle />
              <p>No articles found. Try a different search or category.</p>
            </div>
          ) : (
            <div className="kb-grid">
              {articles.map((article) => (
                <article key={article._id} className="kb-article">
                  {article.status === 'draft' && isPrivileged && <span className="kb-draft-badge">Draft</span>}
                  <div className={`badge ${getCategoryBadgeClass(article.category)}`}>{article.category}</div>
                  <h3 className="kb-article-title-2">{article.title}</h3>
                  <p className="kb-article-preview-2">
                    {article.content
                      ? `${article.content.slice(0, 120)}${article.content.length > 120 ? '...' : ''}`
                      : 'Open article to read full content preview.'}
                  </p>
                  <p className="kb-author-line">
                    {article?.author?.name || 'Unknown'} — {article?.author?.role || 'User'}
                  </p>
                  <div className="kb-meta-row">
                    <span>
                      <FaEye /> {formatNumber(article.views)} views
                    </span>
                    <span>
                      <FaThumbsUp /> {formatNumber(article.helpfulCount || article.helpful?.length || 0)} found this helpful
                    </span>
                  </div>
                  <p className="kb-date-line">{formatDate(article.createdAt)}</p>

                  <div className="kb-card-actions">
                    <Link to={`/knowledge/${article._id}`} className="btn btn-primary btn-sm">
                      Read Article
                    </Link>
                    {isPrivileged && (
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => openEditModal(article._id)}>
                        <FaEdit /> Edit
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm kb-delete-btn"
                        onClick={() => setDeleteTarget(article)}
                      >
                        <FaTrash /> Delete
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="kb-sidebar card">
          <div className="card-header">
            <h3 className="card-title">Most Viewed</h3>
          </div>
          <div className="card-body">
            {mostViewed.length === 0 ? (
              <div className="empty-state kb-empty-small">
                <FaBookOpen />
                <p>No data yet</p>
              </div>
            ) : (
              <div className="kb-most-list">
                {mostViewed.map((item) => (
                  <Link to={`/knowledge/${item._id}`} key={item._id} className="kb-most-item">
                    <p className="kb-most-title">{item.title}</p>
                    <div className="kb-most-meta">
                      <span className={`badge ${getCategoryBadgeClass(item.category)}`}>{item.category}</span>
                      <span>
                        <FaEye /> {formatNumber(item.views)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {showFormModal && (
        <div className="um-modal-overlay">
          <div className="card um-modal-card kb-form-modal">
            <div className="card-header">
              <h3 className="card-title">{editingArticle ? 'Edit Article' : 'Create Article'}</h3>
            </div>
            <form className="card-body um-form-grid" onSubmit={onSubmitForm}>
              <div>
                <label className="kb-form-label">Title *</label>
                <input
                  className="um-input"
                  value={formData.title}
                  onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
                  required
                />
              </div>
              <div className="kb-form-two">
                <div>
                  <label className="kb-form-label">Category *</label>
                  <select
                    className="um-select"
                    value={formData.category}
                    onChange={(e) => setFormData((f) => ({ ...f, category: e.target.value }))}
                  >
                    {CATEGORY_TABS.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="kb-form-label">Status</label>
                  <select
                    className="um-select"
                    value={formData.status}
                    onChange={(e) => setFormData((f) => ({ ...f, status: e.target.value }))}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="kb-form-label">Tags (comma separated)</label>
                <input
                  className="um-input"
                  placeholder="wifi, network, internet"
                  value={formData.tagsInput}
                  onChange={(e) => setFormData((f) => ({ ...f, tagsInput: e.target.value }))}
                />
                <div className="kb-tags-preview">
                  {normalizeTags(formData.tagsInput).map((tag) => (
                    <span key={tag} className="kb-tag-pill">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="kb-form-label">Content *</label>
                <textarea
                  className="um-input kb-content-textarea"
                  value={formData.content}
                  onChange={(e) => setFormData((f) => ({ ...f, content: e.target.value }))}
                  required
                />
                <p className="kb-char-count">{formData.content.length} characters</p>
              </div>

              <label className="um-checkbox-row">
                <input type="checkbox" checked={showPreview} onChange={(e) => setShowPreview(e.target.checked)} />
                Preview content
              </label>
              {showPreview && <div className="kb-content-preview">{formData.content || 'Nothing to preview yet.'}</div>}
              {formError && <p className="um-form-error">{formError}</p>}
              <div className="um-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowFormModal(false)} disabled={savingForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingForm}>
                  {savingForm ? 'Saving...' : editingArticle ? 'Save Changes' : 'Publish Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!!deleteTarget && (
        <div className="um-modal-overlay">
          <div className="card um-modal-card">
            <div className="card-header">
              <h3 className="card-title">Delete Article</h3>
            </div>
            <div className="card-body">
              <p>Are you sure you want to delete this article? This action cannot be undone.</p>
              <p className="kb-delete-title">"{deleteTarget.title}"</p>
              <div className="um-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary kb-delete-btn" onClick={onDeleteArticle} disabled={deleting}>
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default KnowledgeBase;
