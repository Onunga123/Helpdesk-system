import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  FiBookOpen,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiEdit2,
  FiFile,
  FiFileText,
  FiHelpCircle,
  FiImage,
  FiMessageCircle,
  FiPlus,
  FiRefreshCw,
  FiSend,
  FiTrash2,
  FiUpload,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import API from '../../api/axios';

const statusBadgeClass = (status) => {
  if (status === 'Open') return 'badge-open';
  if (status === 'In Progress') return 'badge-progress';
  if (status === 'Resolved') return 'badge-resolved';
  return 'badge-closed';
};

const priorityBadgeClass = (priority) => {
  if (priority === 'Low') return 'badge-low';
  if (priority === 'Medium') return 'badge-medium';
  if (priority === 'High') return 'badge-high';
  return 'badge-critical';
};

const roleBadgeClass = (role) => {
  if (role === 'admin') return 'badge-admin';
  if (role === 'ict_officer') return 'badge-ict';
  if (role === 'staff') return 'badge-staff';
  return 'badge-student';
};

const getInitials = (name) => {
  const parts = (name || '').split(' ').filter(Boolean);
  const a = parts[0]?.[0]?.toUpperCase() || '';
  const b = parts[1]?.[0]?.toUpperCase() || '';
  return (a + b) || 'U';
};

const getFileIcon = (fileName = '') => {
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return 'image';
  if (['pdf'].includes(ext)) return 'pdf';
  if (['doc', 'docx'].includes(ext)) return 'doc';
  if (['xls', 'xlsx'].includes(ext)) return 'xls';
  if (['txt', 'rtf'].includes(ext)) return 'text';
  return 'other';
};

const normalizePriority = (value) => {
  const clean = String(value || '').trim().toLowerCase();
  if (clean === 'low') return 'Low';
  if (clean === 'medium') return 'Medium';
  if (clean === 'high') return 'High';
  if (clean === 'critical') return 'Critical';
  return 'Medium';
};

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'];
const MAX_FILES_PER_UPLOAD = 5;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const TicketDetail = () => {
  const user = useSelector((state) => state.auth.user);
  const role = user?.role;
  const isPrivileged = role === 'admin' || role === 'ict_officer';

  const { id } = useParams();
  const ticketId = id;

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [comment, setComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  const [officers, setOfficers] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignTo, setAssignTo] = useState('');

  const [statusLoading, setStatusLoading] = useState(false);
  const [statusForm, setStatusForm] = useState({
    status: 'Open',
    priority: 'Medium',
    resolutionNote: '',
  });

  const [uploadLoading, setUploadLoading] = useState(false);
  const uploadInputRef = useRef(null);
  const [uploadError, setUploadError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);

  const canManageAssignment = isPrivileged; // server authorizes on PUT route too
  const canUpdateStatus = isPrivileged;
  const ticketIsClosed = ticket?.status === 'Closed';

  const isTicketOwner = useMemo(() => {
    if (!ticket?.submittedBy?._id) return false;
    return ticket.submittedBy._id.toString() === (user?._id || '').toString();
  }, [ticket, user]);

  const canUpload = !ticketIsClosed;
  const canDeleteAttachment = useMemo(() => {
    if (!ticket) return false;
    if (role === 'admin' || role === 'ict_officer') return true;
    return isTicketOwner;
  }, [ticket, role, isTicketOwner]);

  const fetchTicket = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await API.get(`/tickets/${ticketId}`);
      setTicket(data?.data || null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load ticket.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  useEffect(() => {
    if (!ticket) return;
    setStatusForm({
      status: ticket.status || 'Open',
      priority: ticket.priority || 'Medium',
      resolutionNote: ticket.resolutionNote || '',
    });
    setAssignTo(ticket.assignedTo?._id?.toString?.() || ticket.assignedTo?._id || '');
  }, [ticket]);

  useEffect(() => {
    if (!canManageAssignment) return;
    // Backend currently restricts /api/users to admin, but we follow your spec.
    const loadOfficers = async () => {
      try {
        const { data } = await API.get('/users', { params: { role: 'ict_officer' } });
        setOfficers(data?.data || []);
      } catch {
        // If API is blocked for ict_officer, assignment dropdown will be empty (still allows UI on admin).
      }
    };
    loadOfficers();
  }, [canManageAssignment]);

  const onAddComment = async (e) => {
    e.preventDefault();
    if (ticketIsClosed) return;
    if (!comment.trim()) {
      toast.error('Comment cannot be empty.');
      return;
    }

    setCommentLoading(true);
    try {
      await API.post(`/tickets/${ticketId}/comments`, { comment: comment.trim() });
      toast.success('Comment added');
      setComment('');
      await fetchTicket();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add comment.');
    } finally {
      setCommentLoading(false);
    }
  };

  const onSaveStatus = async (e) => {
    e.preventDefault();
    if (!canUpdateStatus) return;
    setStatusLoading(true);

    try {
      const payload = {
        status: statusForm.status,
        priority: normalizePriority(statusForm.priority),
      };
      const shouldHaveNote = statusForm.status === 'Resolved' || statusForm.status === 'Closed';
      if (shouldHaveNote && statusForm.resolutionNote.trim()) payload.resolutionNote = statusForm.resolutionNote.trim();

      await API.put(`/tickets/${ticketId}`, payload);
      toast.success('Ticket updated');
      await fetchTicket();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update ticket.');
    } finally {
      setStatusLoading(false);
    }
  };

  const onAssign = async (e) => {
    e.preventDefault();
    if (!canManageAssignment) return;
    if (!assignTo) {
      toast.error('Select an ICT officer to assign.');
      return;
    }

    setAssignLoading(true);
    try {
      await API.put(`/tickets/${ticketId}`, { assignedTo: assignTo });
      toast.success('Ticket assigned');
      await fetchTicket();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to assign ticket.');
    } finally {
      setAssignLoading(false);
    }
  };

  const onPickAttachments = (e) => {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;
    if (picked.length > MAX_FILES_PER_UPLOAD) {
      setUploadError('You can upload up to 5 files at a time.');
      setSelectedFiles([]);
      return;
    }
    const invalid = picked.filter((f) => {
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      const isValidExt = ALLOWED_EXTENSIONS.includes(ext);
      const isValidSize = f.size <= MAX_FILE_SIZE_BYTES;
      return !isValidExt || !isValidSize;
    });
    if (invalid.length) {
      setUploadError('Only jpg, jpeg, png, gif, pdf, doc, docx, xls, xlsx, txt files are allowed (max 5MB each).');
      setSelectedFiles([]);
      return;
    }
    setUploadError('');
    setSelectedFiles(picked);
  };

  const onUploadAttachments = async () => {
    if (!selectedFiles.length) {
      setUploadError('Please select at least one file before uploading.');
      return;
    }
    setUploadLoading(true);

    try {
      const formData = new FormData();
      selectedFiles.forEach((f) => formData.append('attachments', f));
      await API.post(`/upload/ticket/${ticketId}`, formData);
      toast.success('Files uploaded successfully');
      setSelectedFiles([]);
      await fetchTicket();
    } catch (err) {
      const backendMessage = err?.response?.data?.message || 'Failed to upload files.';
      toast.error(backendMessage);
      setUploadError(backendMessage);
    } finally {
      setUploadLoading(false);
      if (uploadInputRef.current) uploadInputRef.current.value = '';
    }
  };

  const attachmentDownloadBase = useMemo(() => 'http://localhost:5000', []);

  const onDeleteAttachment = async (attachmentId) => {
    if (!attachmentId) return;
    setUploadLoading(true);
    try {
      await API.delete(`/upload/ticket/${ticketId}/${attachmentId}`);
      toast.success('Attachment deleted');
      await fetchTicket();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete attachment.');
    } finally {
      setUploadLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="um-page" aria-label="Ticket details loading">
        <div className="spinner-wrap">
          <div className="spinner" />
        </div>
      </section>
    );
  }

  if (error || !ticket) {
    return (
      <section className="um-page" aria-label="Ticket details error">
        <div className="empty-state">
          <FiHelpCircle />
          <p>{error || 'Ticket not found'}</p>
          <Link to="/tickets" className="btn btn-primary btn-sm">
            Back to Tickets
          </Link>
        </div>
      </section>
    );
  }

  const submittedBy = ticket.submittedBy || {};
  const assignee = ticket.assignedTo || null;
  const comments = Array.isArray(ticket.comments) ? [...ticket.comments] : [];
  comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const resolutionNoteHasContent = (ticket.resolutionNote || '').trim().length > 0;

  return (
    <section className="um-page" aria-label="Ticket detail">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="badge" style={{ fontSize: '0.78rem' }}>
              {ticket.ticketNumber}
            </span>
            <span className={`badge ${statusBadgeClass(ticket.status)}`}>
              {ticket.status}
            </span>
            <span className={`badge ${priorityBadgeClass(ticket.priority)}`}>
              {ticket.priority}
            </span>
          </div>
          <h1 className="um-title" style={{ marginTop: 10 }}>
            {ticket.title}
          </h1>
          <div style={{ marginTop: 10, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="um-avatar" style={{ width: 42, height: 42, background: 'rgba(37,99,235,0.12)' }}>
              {getInitials(submittedBy.name)}
            </div>
            <div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 900 }}>{submittedBy.name}</div>
                {submittedBy.role ? (
                  <span className={`badge ${roleBadgeClass(submittedBy.role)}`} style={{ fontSize: '0.74rem' }}>
                    {submittedBy.role}
                  </span>
                ) : null}
              </div>
              <p className="um-subtitle" style={{ marginTop: 4 }}>
                {submittedBy.department || '-'}
              </p>
              <p className="um-subtitle" style={{ marginTop: 2 }}>
                Date submitted: {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : '-'} • Last updated:{' '}
                {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : '-'}
              </p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/tickets" className="btn btn-secondary btn-sm">
            Back
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 65%', minWidth: 320 }}>
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <h2 className="card-title">Ticket Description</h2>
              <span className="badge badge-open" style={{ background: 'rgba(37,99,235,0.08)', borderColor: 'transparent' }}>
                <FiBookOpen /> {ticket.category}
              </span>
            </div>
            <div className="card-body" style={{ lineHeight: 1.55 }}>
              {ticket.description}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <h2 className="card-title">Attachments</h2>
              <span className="badge" style={{ fontSize: '0.78rem' }}>
                {ticket.attachments?.length || 0} file(s)
              </span>
            </div>
            <div className="card-body">
              {ticket.attachments?.length ? (
                <div style={{ display: 'grid', gap: 10 }}>
                  {ticket.attachments.map((att) => {
                    const iconKind = getFileIcon(att.fileName || '');
                    const icon =
                      iconKind === 'image' ? <FiImage /> :
                      iconKind === 'pdf' ? <FiFileText /> :
                      iconKind === 'doc' ? <FiFileText /> :
                      iconKind === 'xls' ? <FiFileText /> :
                      iconKind === 'text' ? <FiFileText /> :
                      <FiFile />;
                    return (
                      <div key={att._id || att.filePath} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <a
                          href={`${attachmentDownloadBase}${att.filePath}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary"
                          style={{ textDecoration: 'none', flex: 1, justifyContent: 'flex-start' }}
                        >
                          <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                            {icon} <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.fileName}</span>
                          </span>
                        </a>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                          {att.uploadedAt ? new Date(att.uploadedAt).toLocaleDateString() : '-'}
                        </div>
                        {canDeleteAttachment && (
                          <button
                            type="button"
                            className="btn btn-sm um-delete-btn"
                            onClick={() => onDeleteAttachment(att._id)}
                            disabled={uploadLoading}
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  <FiUpload />
                  <p>No attachments yet</p>
                </div>
              )}

              {ticketIsClosed ? (
                <div style={{ marginTop: 12, color: 'var(--text-muted)' }}>
                  This ticket is closed. Upload is disabled.
                </div>
              ) : (
                <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    ref={uploadInputRef}
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    style={{ display: 'none' }}
                    onChange={onPickAttachments}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => uploadInputRef.current?.click()}
                    disabled={uploadLoading}
                  >
                    <FiUpload /> Choose Files
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={onUploadAttachments}
                    disabled={uploadLoading || !selectedFiles.length}
                  >
                    <FiUpload /> {uploadLoading ? 'Uploading...' : 'Upload Selected'}
                  </button>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                    {selectedFiles.length ? `${selectedFiles.length} file(s) selected` : 'No files selected'}
                  </span>
                  {uploadError ? <p className="um-form-error">{uploadError}</p> : null}
                </div>
              )}
              {selectedFiles.length > 0 && (
                <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                  {selectedFiles.map((f) => (
                    <li key={`${f.name}-${f.size}`} style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                      {f.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Comments & Activity</h2>
              <span className="badge" style={{ fontSize: '0.78rem' }}>
                <FiMessageCircle /> {comments.length} comment(s)
              </span>
            </div>
            <div className="card-body">
              {ticketIsClosed ? (
                <div className="empty-state" style={{ minHeight: 120 }}>
                  <FiCheckCircle />
                  <p>This ticket is closed</p>
                </div>
              ) : null}

              <div style={{ display: 'grid', gap: 12, marginBottom: ticketIsClosed ? 0 : 18 }}>
                {comments.length ? (
                  comments.map((c) => (
                    <div key={(c._id || c.createdAt) + c.userName} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div className="um-avatar" style={{ width: 38, height: 38, background: 'rgba(37,99,235,0.12)' }}>
                        {getInitials(c.userName)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                          <div style={{ fontWeight: 800 }}>{c.userName}</div>
                          <span className={`badge ${roleBadgeClass(c.userRole)}`} style={{ fontSize: '0.7rem' }}>
                            {c.userRole}
                          </span>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            {c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}
                          </div>
                        </div>
                        <div
                          style={{
                            marginTop: 6,
                            background: '#f8fbff',
                            border: '1px solid var(--border)',
                            borderRadius: 10,
                            padding: '10px 12px',
                            textAlign: 'left',
                          }}
                        >
                          {c.comment}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state" style={{ minHeight: 80 }}>
                    <FiMessageCircle />
                    <p>No comments yet</p>
                  </div>
                )}
              </div>

              {!ticketIsClosed && (
                <form onSubmit={onAddComment} style={{ display: 'grid', gap: 10 }}>
                  <textarea
                    className="um-input"
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment..."
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary" type="button" onClick={() => setComment('')} disabled={commentLoading}>
                      Clear
                    </button>
                    <button className="btn btn-primary" type="submit" disabled={commentLoading || !comment.trim()}>
                      <FiSend /> {commentLoading ? 'Adding...' : 'Add Comment'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        <div style={{ flex: '0 1 35%', minWidth: 320 }}>
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <h2 className="card-title">Ticket Details</h2>
            </div>
            <div className="card-body" style={{ display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Status</span>
                <span className={`badge ${statusBadgeClass(ticket.status)}`}>{ticket.status}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Priority</span>
                <span className={`badge ${priorityBadgeClass(ticket.priority)}`}>{ticket.priority}</span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <strong style={{ color: 'var(--text)' }}>Category:</strong> {ticket.category}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <strong style={{ color: 'var(--text)' }}>Department:</strong> {ticket.department}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <strong style={{ color: 'var(--text)' }}>Date Created:</strong>{' '}
                {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : '-'}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <strong style={{ color: 'var(--text)' }}>Last Updated:</strong>{' '}
                {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : '-'}
              </div>

              {ticket.resolvedAt ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  <strong style={{ color: 'var(--text)' }}>Resolved At:</strong>{' '}
                  {new Date(ticket.resolvedAt).toLocaleString()}
                </div>
              ) : null}

              {ticket.closedAt ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  <strong style={{ color: 'var(--text)' }}>Closed At:</strong>{' '}
                  {new Date(ticket.closedAt).toLocaleString()}
                </div>
              ) : null}
            </div>
          </div>

          {canManageAssignment && (
            <>
              <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-header">
                  <h2 className="card-title">Assignment</h2>
                </div>
                <div className="card-body" style={{ display: 'grid', gap: 12 }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    <strong style={{ color: 'var(--text)' }}>Assigned To:</strong>{' '}
                    {assignee?.name || 'Unassigned'}
                  </div>

                  <div>
                    <label style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem' }}>
                      Assign to ICT Officer
                    </label>
                    <select className="um-select" value={assignTo || ''} onChange={(e) => setAssignTo(e.target.value)}>
                      <option value="">Select ICT officer</option>
                      {officers.map((o) => (
                        <option key={o._id} value={o._id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button className="btn btn-primary" type="button" onClick={onAssign} disabled={assignLoading || !assignTo}>
                    <FiUsers /> {assignLoading ? 'Assigning...' : 'Assign'}
                  </button>
                </div>
              </div>

              <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-header">
                  <h2 className="card-title">Update Status</h2>
                </div>
                <form className="card-body" onSubmit={onSaveStatus} style={{ display: 'grid', gap: 12 }}>
                  <div>
                    <label style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem' }}>Status</label>
                    <select
                      className="um-select"
                      value={statusForm.status}
                      onChange={(e) => setStatusForm((p) => ({ ...p, status: e.target.value }))}
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem' }}>Priority</label>
                    <select
                      className="um-select"
                      value={statusForm.priority}
                      onChange={(e) => setStatusForm((p) => ({ ...p, priority: e.target.value }))}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  {(statusForm.status === 'Resolved' || statusForm.status === 'Closed') && (
                    <div>
                      <label style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem' }}>
                        Resolution Note
                      </label>
                      <textarea
                        className="um-input"
                        rows={4}
                        value={statusForm.resolutionNote}
                        onChange={(e) => setStatusForm((p) => ({ ...p, resolutionNote: e.target.value }))}
                        placeholder="Add resolution details..."
                      />
                    </div>
                  )}

                  <button className="btn btn-primary" type="submit" disabled={statusLoading}>
                    <FiEdit2 /> {statusLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>
            </>
          )}

          {resolutionNoteHasContent && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Resolution Note</h2>
              </div>
              <div className="card-body">
                <div
                  style={{
                    background: 'rgba(37,99,235,0.06)',
                    border: '1px solid rgba(37,99,235,0.18)',
                    borderRadius: 10,
                    padding: 14,
                    color: 'var(--text)',
                    lineHeight: 1.55,
                  }}
                >
                  {ticket.resolutionNote}
                </div>
              </div>
            </div>
          )}

          {role === 'admin' && (
            <div style={{ marginTop: 18 }}>
              {/* Optional destructive action not specified; keep minimal UI footprint. */}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TicketDetail;