const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatDate = (value) => {
  if (!value) return 'Not available';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleString('en-KE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const getClientUrl = () => {
  const url = (process.env.CLIENT_URL || '').replace(/\/$/, '');
  return url || null;
};

const ticketLink = (ticketId) => {
  const base = getClientUrl();
  if (!base || !ticketId) return null;
  return `${base}/tickets/${ticketId}`;
};

const baseTemplate = ({ content, plainText }) => ({
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TUC ICT Help Desk</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: #1a3c6e; color: white; padding: 25px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; }
    .header p { margin: 5px 0 0; font-size: 13px; opacity: 0.85; }
    .body { padding: 30px; color: #333; line-height: 1.6; }
    .body h2 { color: #1a3c6e; margin-top: 0; font-size: 20px; }
    .ticket-info { background: #f8f9fa; border-left: 4px solid #1a3c6e; padding: 15px 20px; border-radius: 4px; margin: 20px 0; }
    .ticket-info p { margin: 6px 0; font-size: 14px; }
    .ticket-info strong { color: #1a3c6e; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: bold; }
    .badge-open { background: #e3f2fd; color: #1565c0; }
    .badge-progress { background: #fff3e0; color: #e65100; }
    .badge-resolved { background: #e8f5e9; color: #2e7d32; }
    .badge-closed { background: #f3e5f5; color: #6a1b9a; }
    .cta { display: inline-block; margin-top: 16px; padding: 10px 18px; background: #1a3c6e; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold; }
    .footer { background: #f8f9fa; text-align: center; padding: 20px; font-size: 12px; color: #888; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>TUC ICT Help Desk</h1>
      <p>Turkana University College — ICT Support Services</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>This is an automated message from the TUC ICT Help Desk System.</p>
      <p>Do not reply to this email. Contact ICT support at ict@tuc.ac.ke</p>
      <p>Turkana University College, Lodwar, Turkana County, Kenya</p>
    </div>
  </div>
</body>
</html>`,
  text: plainText,
});

const viewTicketBlock = (ticketId, ticketNumber) => {
  const link = ticketLink(ticketId);
  if (!link) {
    return `<p>Log in to the ICT Help Desk system to view ticket <strong>${escapeHtml(ticketNumber)}</strong>.</p>`;
  }
  return `<a class="cta" href="${escapeHtml(link)}">View Ticket ${escapeHtml(ticketNumber)}</a>`;
};

const viewTicketText = (ticketId, ticketNumber) => {
  const link = ticketLink(ticketId);
  return link
    ? `View ticket: ${link}`
    : `Log in to the ICT Help Desk system to view ticket ${ticketNumber}.`;
};

const ticketCreatedTemplate = ({
  name,
  ticketNumber,
  title,
  category,
  priority,
  status = 'Open',
  submittedAt,
  ticketId,
}) => {
  const safe = {
    name: escapeHtml(name),
    ticketNumber: escapeHtml(ticketNumber),
    title: escapeHtml(title),
    category: escapeHtml(category),
    priority: escapeHtml(priority),
    status: escapeHtml(status),
    submittedAt: escapeHtml(formatDate(submittedAt)),
  };

  const content = `
    <h2>Ticket Submitted Successfully</h2>
    <p>Hello <strong>${safe.name}</strong>,</p>
    <p>Your ICT support request has been received. Our team will attend to it shortly.</p>
    <div class="ticket-info">
      <p><strong>Ticket Number:</strong> ${safe.ticketNumber}</p>
      <p><strong>Title:</strong> ${safe.title}</p>
      <p><strong>Category:</strong> ${safe.category}</p>
      <p><strong>Priority:</strong> ${safe.priority}</p>
      <p><strong>Status:</strong> <span class="badge badge-open">${safe.status}</span></p>
      <p><strong>Date Submitted:</strong> ${safe.submittedAt}</p>
    </div>
    <p><strong>Next steps:</strong> You will receive email updates whenever your ticket status changes. Keep your ticket number for reference.</p>
    ${viewTicketBlock(ticketId, ticketNumber)}
  `;

  const plainText = [
    'Ticket Submitted Successfully',
    '',
    `Hello ${name},`,
    '',
    'Your ICT support request has been received.',
    '',
    `Ticket Number: ${ticketNumber}`,
    `Title: ${title}`,
    `Category: ${category}`,
    `Priority: ${priority}`,
    `Status: ${status}`,
    `Date Submitted: ${formatDate(submittedAt)}`,
    '',
    viewTicketText(ticketId, ticketNumber),
  ].join('\n');

  return baseTemplate({ content, plainText });
};

const ticketStatusUpdatedTemplate = ({
  name,
  ticketNumber,
  title,
  status,
  resolutionNote,
  updatedBy,
  updatedAt,
  ticketId,
}) => {
  const badgeClass = {
    Open: 'badge-open',
    'In Progress': 'badge-progress',
    Resolved: 'badge-resolved',
    Closed: 'badge-closed',
  }[status] || 'badge-open';

  const safe = {
    name: escapeHtml(name),
    ticketNumber: escapeHtml(ticketNumber),
    title: escapeHtml(title),
    status: escapeHtml(status),
    resolutionNote: resolutionNote ? escapeHtml(resolutionNote) : '',
    updatedBy: escapeHtml(updatedBy || 'ICT Support Team'),
    updatedAt: escapeHtml(formatDate(updatedAt)),
  };

  const statusMessage =
    status === 'Resolved'
      ? 'Your issue has been resolved. If you are satisfied, no further action is needed.'
      : status === 'Closed'
        ? 'This ticket has been closed. Contact ICT support if you need further assistance.'
        : 'Our ICT team is working on your request. You will be notified of further updates.';

  const content = `
    <h2>Ticket Status Updated</h2>
    <p>Hello <strong>${safe.name}</strong>,</p>
    <p>The status of your ICT support ticket has been updated.</p>
    <div class="ticket-info">
      <p><strong>Ticket Number:</strong> ${safe.ticketNumber}</p>
      <p><strong>Title:</strong> ${safe.title}</p>
      <p><strong>New Status:</strong> <span class="badge ${badgeClass}">${safe.status}</span></p>
      <p><strong>Updated By:</strong> ${safe.updatedBy}</p>
      <p><strong>Date:</strong> ${safe.updatedAt}</p>
      ${safe.resolutionNote ? `<p><strong>Resolution Note:</strong> ${safe.resolutionNote}</p>` : ''}
    </div>
    <p>${statusMessage}</p>
    ${viewTicketBlock(ticketId, ticketNumber)}
  `;

  const plainText = [
    'Ticket Status Updated',
    '',
    `Hello ${name},`,
    '',
    `Ticket Number: ${ticketNumber}`,
    `Title: ${title}`,
    `New Status: ${status}`,
    `Updated By: ${updatedBy || 'ICT Support Team'}`,
    `Date: ${formatDate(updatedAt)}`,
    resolutionNote ? `Resolution Note: ${resolutionNote}` : null,
    '',
    statusMessage,
    '',
    viewTicketText(ticketId, ticketNumber),
  ]
    .filter(Boolean)
    .join('\n');

  return baseTemplate({ content, plainText });
};

const ticketAssignedTemplate = ({
  officerName,
  ticketNumber,
  title,
  submittedBy,
  department,
  priority,
  ticketId,
}) => {
  const safe = {
    officerName: escapeHtml(officerName),
    ticketNumber: escapeHtml(ticketNumber),
    title: escapeHtml(title),
    submittedBy: escapeHtml(submittedBy),
    department: escapeHtml(department || 'Not specified'),
    priority: escapeHtml(priority || 'Medium'),
  };

  const content = `
    <h2>New Ticket Assigned to You</h2>
    <p>Hello <strong>${safe.officerName}</strong>,</p>
    <p>A support ticket has been assigned to you. Please review and respond promptly.</p>
    <div class="ticket-info">
      <p><strong>Ticket Number:</strong> ${safe.ticketNumber}</p>
      <p><strong>Title:</strong> ${safe.title}</p>
      <p><strong>Priority:</strong> ${safe.priority}</p>
      <p><strong>Submitted By:</strong> ${safe.submittedBy}</p>
      <p><strong>Department:</strong> ${safe.department}</p>
    </div>
    ${viewTicketBlock(ticketId, ticketNumber)}
  `;

  const plainText = [
    'New Ticket Assigned to You',
    '',
    `Hello ${officerName},`,
    '',
    `Ticket Number: ${ticketNumber}`,
    `Title: ${title}`,
    `Priority: ${priority || 'Medium'}`,
    `Submitted By: ${submittedBy}`,
    `Department: ${department || 'Not specified'}`,
    '',
    viewTicketText(ticketId, ticketNumber),
  ].join('\n');

  return baseTemplate({ content, plainText });
};

const ticketCommentTemplate = ({
  name,
  ticketNumber,
  title,
  commentBy,
  comment,
  ticketId,
}) => {
  const safe = {
    name: escapeHtml(name),
    ticketNumber: escapeHtml(ticketNumber),
    title: escapeHtml(title),
    commentBy: escapeHtml(commentBy),
    comment: escapeHtml(comment),
  };

  const content = `
    <h2>New Update on Your Ticket</h2>
    <p>Hello <strong>${safe.name}</strong>,</p>
    <p>A new comment has been added to your support ticket.</p>
    <div class="ticket-info">
      <p><strong>Ticket Number:</strong> ${safe.ticketNumber}</p>
      <p><strong>Title:</strong> ${safe.title}</p>
      <p><strong>Comment by:</strong> ${safe.commentBy}</p>
      <p><strong>Comment:</strong> ${safe.comment}</p>
    </div>
    ${viewTicketBlock(ticketId, ticketNumber)}
  `;

  const plainText = [
    'New Update on Your Ticket',
    '',
    `Hello ${name},`,
    '',
    `Ticket Number: ${ticketNumber}`,
    `Title: ${title}`,
    `Comment by: ${commentBy}`,
    `Comment: ${comment}`,
    '',
    viewTicketText(ticketId, ticketNumber),
  ].join('\n');

  return baseTemplate({ content, plainText });
};

const accountCreatedTemplate = ({ name, email, role, createdBy }) => {
  const safe = {
    name: escapeHtml(name),
    email: escapeHtml(email),
    role: escapeHtml(role),
    createdBy: escapeHtml(createdBy || 'ICT Administrator'),
  };

  const loginLink = getClientUrl();

  const content = `
    <h2>Your ICT Help Desk Account</h2>
    <p>Hello <strong>${safe.name}</strong>,</p>
    <p>An account has been created for you on the Turkana University College ICT Help Desk System.</p>
    <div class="ticket-info">
      <p><strong>Email:</strong> ${safe.email}</p>
      <p><strong>Role:</strong> ${safe.role}</p>
      <p><strong>Created By:</strong> ${safe.createdBy}</p>
    </div>
    <p>Use the credentials provided to you by ICT staff to sign in. For security reasons, passwords are never sent by email.</p>
    ${loginLink ? `<a class="cta" href="${escapeHtml(loginLink)}">Sign In to Help Desk</a>` : '<p>Log in using your institutional email at the ICT Help Desk portal.</p>'}
  `;

  const plainText = [
    'Your ICT Help Desk Account',
    '',
    `Hello ${name},`,
    '',
    `Email: ${email}`,
    `Role: ${role}`,
    `Created By: ${createdBy || 'ICT Administrator'}`,
    '',
    'Use the credentials provided to you by ICT staff to sign in.',
    loginLink ? `Sign in: ${loginLink}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return baseTemplate({ content, plainText });
};

const welcomeRegistrationTemplate = ({ name, email }) => {
  const safe = { name: escapeHtml(name), email: escapeHtml(email) };
  const loginLink = getClientUrl();

  const content = `
    <h2>Welcome to TUC ICT Help Desk</h2>
    <p>Hello <strong>${safe.name}</strong>,</p>
    <p>Your registration was successful. You can now submit and track ICT support requests using your account (<strong>${safe.email}</strong>).</p>
    ${loginLink ? `<a class="cta" href="${escapeHtml(loginLink)}">Go to Help Desk</a>` : ''}
  `;

  const plainText = [
    'Welcome to TUC ICT Help Desk',
    '',
    `Hello ${name},`,
    '',
    `Your account (${email}) is ready. You can submit and track ICT support requests.`,
    loginLink ? `Portal: ${loginLink}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return baseTemplate({ content, plainText });
};

const newTicketStaffTemplate = ({
  ticketNumber,
  title,
  category,
  priority,
  submittedBy,
  department,
  ticketId,
}) => {
  const safe = {
    ticketNumber: escapeHtml(ticketNumber),
    title: escapeHtml(title),
    category: escapeHtml(category),
    priority: escapeHtml(priority),
    submittedBy: escapeHtml(submittedBy),
    department: escapeHtml(department || 'Not specified'),
  };

  const content = `
    <h2>New Support Ticket Submitted</h2>
    <p>A new ICT support ticket requires attention.</p>
    <div class="ticket-info">
      <p><strong>Ticket Number:</strong> ${safe.ticketNumber}</p>
      <p><strong>Title:</strong> ${safe.title}</p>
      <p><strong>Category:</strong> ${safe.category}</p>
      <p><strong>Priority:</strong> ${safe.priority}</p>
      <p><strong>Submitted By:</strong> ${safe.submittedBy}</p>
      <p><strong>Department:</strong> ${safe.department}</p>
    </div>
    ${viewTicketBlock(ticketId, ticketNumber)}
  `;

  const plainText = [
    'New Support Ticket Submitted',
    '',
    `Ticket Number: ${ticketNumber}`,
    `Title: ${title}`,
    `Category: ${category}`,
    `Priority: ${priority}`,
    `Submitted By: ${submittedBy}`,
    `Department: ${department || 'Not specified'}`,
    '',
    viewTicketText(ticketId, ticketNumber),
  ].join('\n');

  return baseTemplate({ content, plainText });
};

module.exports = {
  ticketCreatedTemplate,
  ticketStatusUpdatedTemplate,
  ticketAssignedTemplate,
  ticketCommentTemplate,
  accountCreatedTemplate,
  welcomeRegistrationTemplate,
  newTicketStaffTemplate,
};
