import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiFile, FiFileText, FiImage, FiPlus, FiUpload, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import API from '../../api/axios';

const CATEGORY_OPTIONS = [
  'Network Issue',
  'Hardware Repair',
  'Software Installation',
  'Email Issue',
  'Password Reset',
  'Printer Issue',
  'Computer Maintenance',
  'System Access',
  'Other',
];

const priorityOptions = ['Low', 'Medium', 'High', 'Critical'];

const fileAccept =
  '.jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt';
const MAX_FILES = 5;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const allowedExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg', 'gif'];

const normalizePriority = (value) => {
  const clean = String(value || '').trim().toLowerCase();
  if (clean === 'low') return 'Low';
  if (clean === 'medium') return 'Medium';
  if (clean === 'high') return 'High';
  if (clean === 'critical') return 'Critical';
  return 'Medium';
};

const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (filename) => {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return <FiImage style={{ color: '#16a34a' }} />;
  if (ext === 'pdf') return <FiFileText style={{ color: '#dc2626' }} />;
  if (['doc', 'docx'].includes(ext)) return <FiFileText style={{ color: '#2563eb' }} />;
  if (['xls', 'xlsx'].includes(ext)) return <FiFileText style={{ color: '#16a34a' }} />;
  return <FiFile style={{ color: '#64748b' }} />;
};

const CreateTicket = () => {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [department, setDepartment] = useState(user?.department || '');
  const [description, setDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fileInputRef = useRef(null);

  const canSubmit = useMemo(() => {
    return (
      title.trim().length > 0 &&
      category.trim().length > 0 &&
      description.trim().length >= 20 &&
      department.trim().length >= 0
    );
  }, [title, category, description, department]);

  const addFiles = (incoming) => {
    if (!incoming.length) return;
    setSelectedFiles((prev) => {
      const next = [...prev];
      incoming.forEach((file) => {
        const ext = (file.name.split('.').pop() || '').toLowerCase();
        if (file.size > MAX_FILE_SIZE_BYTES) {
          toast.error(`File ${file.name} exceeds the 5MB limit`);
          return;
        }
        if (!allowedExts.includes(ext)) {
          toast.error('File type not allowed. Use JPG, PNG, PDF, Word or Excel');
          return;
        }
        if (next.some((f) => f.name === file.name)) {
          toast.error(`File ${file.name} is already selected`);
          return;
        }
        if (next.length >= MAX_FILES) {
          toast.error('Maximum 5 files allowed');
          return;
        }
        next.push(file);
      });
      return next;
    });
  };

  const onPickFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    addFiles(picked);
    e.target.value = '';
  };

  const onDropFiles = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = Array.from(e.dataTransfer.files || []);
    addFiles(dropped);
  };

  const onRemoveFile = (indexToRemove) => {
    setSelectedFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim() || !category.trim()) {
      setFormError('Title and category are required.');
      return;
    }
    if (description.trim().length < 20) {
      setFormError('Description must be at least 20 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        title: title.trim(),
        description: description.trim(),
        category,
        priority: normalizePriority(priority),
        department: department || user?.department || '',
      };

      const { data } = await API.post('/tickets', body);
      const newTicket = data?.data;

      // Upload attachments (if any)
      if (selectedFiles.length) {
        const formData = new FormData();
        selectedFiles.forEach((file) => formData.append('attachments', file));
        await API.post(`/upload/ticket/${newTicket._id}`, formData);
      }

      setSelectedFiles([]);
      toast.success('Ticket submitted successfully!');
      navigate(`/tickets/${newTicket._id}`);
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to submit ticket.';
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="um-page" aria-label="Submit new ticket">
      <div className="page-header">
        <div>
          <h1 className="um-title">Submit New Ticket</h1>
          <p className="um-subtitle">Create an ICT support request</p>
        </div>
      </div>

      <div className="card">
        <form className="card-body um-form-grid" onSubmit={onSubmit}>
          <div>
            <label style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem' }}>Title *</label>
            <input className="um-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Brief ticket title" />
          </div>

          <div>
            <label style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem' }}>Category *</label>
            <select className="um-select" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Select category</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem' }}>Priority</label>
            <select className="um-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
              {priorityOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem' }}>Department</label>
            <input className="um-input" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Department" />
          </div>

          <div>
            <label style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem' }}>Description *</label>
            <textarea
              className="um-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue / request in detail"
              rows={5}
            />
            <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 6 }}>
              {description.trim().length}/20 minimum characters
            </div>
          </div>

          <div>
            <label style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem' }}>Attachments (up to 5)</label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={fileAccept}
              style={{ display: 'none' }}
              onChange={onPickFiles}
            />

            {selectedFiles.length < MAX_FILES ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={onDropFiles}
                style={{
                  marginTop: 8,
                  width: '100%',
                  border: `2px dashed ${isDragOver ? '#2563eb' : '#e2e8f0'}`,
                  borderRadius: 10,
                  padding: 24,
                  background: isDragOver ? '#eff6ff' : '#fff',
                  cursor: 'pointer',
                  transition: 'all 160ms ease',
                  display: 'grid',
                  gap: 8,
                  justifyItems: 'center',
                  color: 'var(--text)',
                }}
              >
                <FiUpload />
                <span style={{ fontWeight: 700 }}>Click to select files or drag and drop</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  Accepted: JPG, PNG, PDF, Word, Excel - Max 5MB each - Up to 5 files
                </span>
              </button>
            ) : (
              <p style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                Maximum files reached. Remove a file to add a different one.
              </p>
            )}

            {selectedFiles.length > 0 && (
              <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
                {selectedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${file.size}`}
                    style={{
                      background: '#f8fafc',
                      borderRadius: 8,
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      transition: 'opacity 160ms ease',
                    }}
                  >
                    {getFileIcon(file.name)}
                    <span
                      style={{
                        flex: 1,
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: 'var(--text)',
                        fontSize: '0.88rem',
                      }}
                      title={file.name}
                    >
                      {file.name}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{formatFileSize(file.size)}</span>
                    <button
                      type="button"
                      onClick={() => onRemoveFile(index)}
                      aria-label={`Remove ${file.name}`}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#dc2626',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <FiX />
                    </button>
                  </div>
                ))}
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  {selectedFiles.length} of {MAX_FILES} files selected
                </p>
              </div>
            )}
          </div>

          {formError && (
            <p className="um-form-error" role="alert">
              {formError}
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/tickets')} disabled={submitting}>
              <FiX /> Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting || !canSubmit}>
              <FiPlus /> {submitting ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default CreateTicket;