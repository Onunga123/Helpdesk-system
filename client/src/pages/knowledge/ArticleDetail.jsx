import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaEdit,
  FaEye,
  FaThumbsUp,
  FaThumbsDown,
  FaTrash,
  FaArrowUp,
  FaBookOpen,
} from 'react-icons/fa';
import toast from 'react-hot-toast';

import API from '../../api/axios';
import '../dashboard/Dashboard.css';

const CATEGORY_OPTIONS = [
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

const ArticleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const isPrivileged = user?.role === 'admin' || user?.role === 'ict_officer';
  const isAdmin = user?.role === 'admin';

  const [loading, setLoading] = useState(true);
  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [voting, setVoting] = useState(false);
  const [myVote, setMyVote] = useState(null);

  const [showTopButton, setShowTopButton] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
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

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const resolveMyVote = (nextArticle) => {
    const uid = user?._id;
    if (!uid || !nextArticle) return null;
    const helpful = Array.isArray(nextArticle.helpful) ? nextArticle.helpful.map(String) : [];
    const notHelpful = Array.isArray(nextArticle.notHelpful) ? nextArticle.notHelpful.map(String) : [];
    if (helpful.includes(String(uid))) return 'helpful';
    if (notHelpful.includes(String(uid))) return 'notHelpful';
    return null;
  };

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/knowledge/${id}`);
      const next = data?.data || null;
      setArticle(next);
      setMyVote(resolveMyVote(next));

      if (next?.category) {
        const relRes = await API.get('/knowledge', { params: { category: next.category } });
        const rel = (relRes?.data?.data || []).filter((a) => a._id !== id).slice(0, 3);
        setRelated(rel);
      } else {
        setRelated([]);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load article.');
      setArticle(null);
      setRelated([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const onScroll = () => setShowTopButton(window.scrollY > 300);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const helpfulCount = useMemo(
    () => article?.helpfulCount ?? article?.helpful?.length ?? 0,
    [article]
  );
  const notHelpfulCount = useMemo(
    () => article?.notHelpfulCount ?? article?.notHelpful?.length ?? 0,
    [article]
  );

  const onVote = async (voteType) => {
    if (!article?._id) return;
    try {
      setVoting(true);
      const { data } = await API.post(`/knowledge/${article._id}/vote`, { vote: voteType });
      const counts = data?.data || {};
      setArticle((prev) =>
        prev
          ? {
              ...prev,
              helpfulCount: counts.helpfulCount ?? prev.helpfulCount ?? prev.helpful?.length ?? 0,
              notHelpfulCount:
                counts.notHelpfulCount ?? prev.notHelpfulCount ?? prev.notHelpful?.length ?? 0,
            }
          : prev
      );
      setMyVote(voteType);
      toast.success('Thank you for your feedback!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit vote.');
    } finally {
      setVoting(false);
    }
  };

  const openEditModal = () => {
    if (!article) return;
    setFormError('');
    setShowPreview(false);
    setFormData({
      title: article.title || '',
      category: article.category || 'Network & Wi-Fi',
      status: article.status || 'draft',
      tagsInput: Array.isArray(article.tags) ? article.tags.join(', ') : '',
      content: article.content || '',
    });
    setShowEditModal(true);
  };

  const onSaveEdit = async (e) => {
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
      await API.put(`/knowledge/${id}`, payload);
      toast.success('Article updated successfully');
      setShowEditModal(false);
      await fetchArticle();
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to update article.';
      setFormError(message);
      toast.error(message);
    } finally {
      setSavingForm(false);
    }
  };

  const onDelete = async () => {
    try {
      setDeleting(true);
      await API.delete(`/knowledge/${id}`);
      toast.success('Article deleted');
      navigate('/knowledge');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete article.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="spinner-wrap">
        <div className="spinner" />
      </div>
    );
  }

  if (!article) {
    return (
      <section aria-label="Administrator dashboard">
        <div className="empty-state">
          <FaBookOpen />
          <p>Article not found or unavailable.</p>
          <Link to="/knowledge" className="btn btn-primary">
            Back to Knowledge Base
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Administrator dashboard">
      <div className="kb-detail-wrap">
        <div className="kb-detail-top-actions">
          <Link to="/knowledge" className="btn btn-secondary">
            <FaArrowLeft /> Back to Knowledge Base
          </Link>
          <div className="kb-detail-actions-right">
            {isPrivileged && (
              <button className="btn btn-secondary" type="button" onClick={openEditModal}>
                <FaEdit /> Edit
              </button>
            )}
            {isAdmin && (
              <button className="btn kb-delete-btn" type="button" onClick={() => setShowDeleteModal(true)}>
                <FaTrash /> Delete
              </button>
            )}
          </div>
        </div>

        <article className="card">
          <div className="card-body kb-detail-header">
            <div className={`badge ${getCategoryBadgeClass(article.category)}`}>{article.category}</div>
            <h1 className="kb-detail-title">{article.title}</h1>
            <div className="kb-detail-author">
              <span className="kb-author-avatar">{(article?.author?.name || 'U').charAt(0).toUpperCase()}</span>
              <span>
                {article?.author?.name || 'Unknown'} — {article?.author?.role || 'User'} • {formatDate(article.createdAt)}
              </span>
            </div>
            <div className="kb-meta-row">
              <span>
                <FaEye /> {formatNumber(article.views)} views
              </span>
              <span>
                <FaThumbsUp /> {formatNumber(helpfulCount)} helpful
              </span>
              <span>
                <FaThumbsDown /> {formatNumber(notHelpfulCount)} not helpful
              </span>
            </div>
          </div>
        </article>

        <article className="card">
          <div className="card-body">
            <div className="kb-article-content">{article.content}</div>
            <div className="kb-tags-preview" style={{ marginTop: 16 }}>
              {(article.tags || []).map((tag) => (
                <span key={tag} className="kb-tag-pill">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </article>

        <article className="card">
          <div className="card-header">
            <h3 className="card-title">Was this article helpful?</h3>
          </div>
          <div className="card-body kb-vote-actions">
            <button
              className={`btn ${myVote === 'helpful' ? 'kb-vote-yes-active' : 'kb-vote-yes'}`}
              onClick={() => onVote('helpful')}
              disabled={voting}
              type="button"
            >
              <FaThumbsUp /> Yes, this helped ({formatNumber(helpfulCount)})
            </button>
            <button
              className={`btn ${myVote === 'notHelpful' ? 'kb-vote-no-active' : 'kb-vote-no'}`}
              onClick={() => onVote('notHelpful')}
              disabled={voting}
              type="button"
            >
              <FaThumbsDown /> Not helpful ({formatNumber(notHelpfulCount)})
            </button>
          </div>
        </article>

        <article className="card">
          <div className="card-header">
            <h3 className="card-title">Related Articles</h3>
          </div>
          <div className="card-body">
            {related.length === 0 ? (
              <div className="empty-state kb-empty-small">
                <FaBookOpen />
                <p>No related articles found</p>
              </div>
            ) : (
              <div className="kb-grid kb-grid-related">
                {related.map((item) => (
                  <article key={item._id} className="kb-article">
                    <div className={`badge ${getCategoryBadgeClass(item.category)}`}>{item.category}</div>
                    <h3 className="kb-article-title-2">{item.title}</h3>
                    <p className="kb-meta-row" style={{ marginTop: 0 }}>
                      <span>
                        <FaEye /> {formatNumber(item.views)} views
                      </span>
                    </p>
                    <div className="kb-card-actions">
                      <Link to={`/knowledge/${item._id}`} className="btn btn-primary btn-sm">
                        Read Article
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </article>
      </div>

      {showTopButton && (
        <button
          type="button"
          className="kb-back-top"
          aria-label="Back to top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <FaArrowUp />
        </button>
      )}

      {showEditModal && (
        <div className="um-modal-overlay">
          <div className="card um-modal-card kb-form-modal">
            <div className="card-header">
              <h3 className="card-title">Edit Article</h3>
            </div>
            <form className="card-body um-form-grid" onSubmit={onSaveEdit}>
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
                    {CATEGORY_OPTIONS.map((cat) => (
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
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)} disabled={savingForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingForm}>
                  {savingForm ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="um-modal-overlay">
          <div className="card um-modal-card">
            <div className="card-header">
              <h3 className="card-title">Delete Article</h3>
            </div>
            <div className="card-body">
              <p>Are you sure you want to delete this article? This action cannot be undone.</p>
              <p className="kb-delete-title">"{article.title}"</p>
              <div className="um-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary kb-delete-btn" onClick={onDelete} disabled={deleting}>
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

export default ArticleDetail;
