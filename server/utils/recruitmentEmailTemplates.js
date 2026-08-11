const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TUC Recruitment</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: #1a3c6e; color: white; padding: 25px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; }
    .header p { margin: 5px 0 0; font-size: 13px; opacity: 0.85; }
    .body { padding: 30px; color: #333; }
    .body h2 { color: #1a3c6e; margin-top: 0; }
    .info-box { background: #f8f9fa; border-left: 4px solid #1a3c6e; padding: 15px 20px; border-radius: 4px; margin: 20px 0; }
    .info-box p { margin: 6px 0; font-size: 14px; }
    .info-box strong { color: #1a3c6e; }
    .button { display: inline-block; padding: 12px 24px; background: #1a3c6e; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e0e0e0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>TUC Recruitment Portal</h1>
      <p>Turkana University College</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; 2026 Turkana University College. All rights reserved.</p>
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`;

const jobPostedTemplate = (jobTitle, jobId, applicationsLink) => baseTemplate(`
  <h2>New Job Posted</h2>
  <p>Hello,</p>
  <p>A new job position has been posted and is open for applications.</p>
  <div class="info-box">
    <p><strong>Position:</strong> ${jobTitle}</p>
    <p><strong>Job ID:</strong> ${jobId}</p>
    <p><strong>Status:</strong> Published</p>
  </div>
  <p>Interested candidates can now submit their applications through our portal.</p>
  <a href="${applicationsLink}" class="button">View Job</a>
  <p>Best regards,<br>HR Department</p>
`);

const applicationSubmittedTemplate = (applicantName, jobTitle, applicationId) => baseTemplate(`
  <h2>Application Received</h2>
  <p>Hello,</p>
  <p>Thank you for submitting your application. We have received it and it is being reviewed.</p>
  <div class="info-box">
    <p><strong>Applicant:</strong> ${applicantName}</p>
    <p><strong>Position:</strong> ${jobTitle}</p>
    <p><strong>Application ID:</strong> ${applicationId}</p>
    <p><strong>Status:</strong> Under Review</p>
  </div>
  <p>We will contact you shortly with an update on your application status.</p>
  <p>Best regards,<br>HR Department</p>
`);

const interviewScheduledTemplate = (applicantName, jobTitle, interviewDate, interviewTime, meetingLink) => baseTemplate(`
  <h2>Interview Scheduled</h2>
  <p>Hello ${applicantName},</p>
  <p>Congratulations! You have been selected for an interview.</p>
  <div class="info-box">
    <p><strong>Position:</strong> ${jobTitle}</p>
    <p><strong>Interview Date:</strong> ${interviewDate}</p>
    <p><strong>Interview Time:</strong> ${interviewTime}</p>
    ${meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>` : ''}
  </div>
  <p>Please make sure to join on time. If you cannot attend, please notify us as soon as possible.</p>
  <p>Best regards,<br>HR Department</p>
`);

const offerSentTemplate = (applicantName, jobTitle, salary, startDate) => baseTemplate(`
  <h2>Job Offer</h2>
  <p>Hello ${applicantName},</p>
  <p>We are pleased to offer you the position of <strong>${jobTitle}</strong>.</p>
  <div class="info-box">
    <p><strong>Position:</strong> ${jobTitle}</p>
    <p><strong>Salary:</strong> KES ${salary.toLocaleString()}</p>
    <p><strong>Start Date:</strong> ${startDate}</p>
  </div>
  <p>Please review the offer letter attached and confirm your acceptance within 5 business days.</p>
  <p>Best regards,<br>HR Department</p>
`);

const offerAcceptedTemplate = (applicantName, jobTitle, startDate) => baseTemplate(`
  <h2>Offer Accepted</h2>
  <p>Hello,</p>
  <p><strong>${applicantName}</strong> has accepted the job offer for the position of <strong>${jobTitle}</strong>.</p>
  <div class="info-box">
    <p><strong>Applicant:</strong> ${applicantName}</p>
    <p><strong>Position:</strong> ${jobTitle}</p>
    <p><strong>Start Date:</strong> ${startDate}</p>
    <p><strong>Status:</strong> Offer Accepted</p>
  </div>
  <p>Please proceed with onboarding procedures.</p>
  <p>Best regards,<br>Recruitment System</p>
`);

module.exports = {
  jobPostedTemplate,
  applicationSubmittedTemplate,
  interviewScheduledTemplate,
  offerSentTemplate,
  offerAcceptedTemplate,
};
