import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiFilePlus, FiPlus, FiUpload, FiX } from 'react-icons/fi';
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
  'image/*,.pdf,.doc,.docx,.xls,.xlsx';

const CreateTicket = () => {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [department, setDepartment] = useState(user?.department || '');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);

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

  const normalizeFiles = (list) => {
    const arr = Array.from(list || []);
    return arr.slice(0, 5);
  };

  const onPickFiles = (e) => {
    const picked = normalizeFiles(e.target.files);
    const invalid = picked.filter((f) => {
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      const allowedExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg', 'gif'];
      if (f.type.startsWith('image/')) return true;
      return allowedExts.includes(ext);
    });
    if (invalid.length) {
      toast.error('Some selected files are not allowed. Please upload images, PDF, Word or Excel files.');
      setFiles(picked.filter((f) => !invalid.includes(f)));
      return;
    }
    setFiles(picked);
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
        priority,
        department: department || user?.department || '',
      };

      const { data } = await API.post('/tickets', body);
      const newTicket = data?.data;

      // Upload attachments (if any)
      if (files.length) {
        const formData = new FormData();
        files.forEach((file) => formData.append('attachments', file));
        await API.post(`/upload/ticket/${newTicket._id}`, formData);
      }

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={fileAccept}
                style={{ display: 'none' }}
                onChange={onPickFiles}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={submitting}
              >
                <FiUpload /> Choose Files
              </button>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                {files.length ? `${files.length} file(s) selected` : 'No files selected'}
              </span>
            </div>
            {files.length > 0 && (
              <ul style={{ margin: '10px 0 0', paddingLeft: 18 }}>
                {files.map((f) => (
                  <li key={f.name + f.size} style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    {f.name}
                  </li>
                ))}
              </ul>
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