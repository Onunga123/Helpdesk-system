const sendEmail = require("./sendEmail");
const {
  jobPostedTemplate,
  applicationSubmittedTemplate,
  interviewScheduledTemplate,
  offerSentTemplate,
  offerAcceptedTemplate,
} = require("./recruitmentEmailTemplates");

const notifyJobPosted = async (jobTitle, jobId, recipientEmail) => {
  try {
    const applicationsLink = "https://helpdinesk-system-smoky.vercel.app/recruitment/jobs/" + jobId;
    await sendEmail({
      to: recipientEmail,
      subject: "New Job Posted: " + jobTitle,
      html: jobPostedTemplate(jobTitle, jobId, applicationsLink),
    });
    console.log("[Recruitment] Job posted email sent to:", recipientEmail);
  } catch (err) {
    console.error("[Recruitment] Failed to send job posted email:", err.message);
  }
};

const notifyApplicationSubmitted = async (applicantName, applicantEmail, jobTitle, applicationId) => {
  try {
    await sendEmail({
      to: applicantEmail,
      subject: "Application Received: " + jobTitle,
      html: applicationSubmittedTemplate(applicantName, jobTitle, applicationId),
    });
    console.log("[Recruitment] Application submitted email sent to:", applicantEmail);
  } catch (err) {
    console.error("[Recruitment] Failed to send application submitted email:", err.message);
  }
};

const notifyInterviewScheduled = async (applicantName, applicantEmail, jobTitle, interviewDate, interviewTime, meetingLink) => {
  try {
    await sendEmail({
      to: applicantEmail,
      subject: "Interview Scheduled: " + jobTitle,
      html: interviewScheduledTemplate(applicantName, jobTitle, interviewDate, interviewTime, meetingLink),
    });
    console.log("[Recruitment] Interview scheduled email sent to:", applicantEmail);
  } catch (err) {
    console.error("[Recruitment] Failed to send interview scheduled email:", err.message);
  }
};

const notifyOfferSent = async (applicantName, applicantEmail, jobTitle, salary, startDate) => {
  try {
    await sendEmail({
      to: applicantEmail,
      subject: "Job Offer: " + jobTitle,
      html: offerSentTemplate(applicantName, jobTitle, salary, startDate),
    });
    console.log("[Recruitment] Offer sent email sent to:", applicantEmail);
  } catch (err) {
    console.error("[Recruitment] Failed to send offer sent email:", err.message);
  }
};

const notifyOfferAccepted = async (applicantName, hrEmail, jobTitle, startDate) => {
  try {
    await sendEmail({
      to: hrEmail,
      subject: "Offer Accepted: " + jobTitle + " - " + applicantName,
      html: offerAcceptedTemplate(applicantName, jobTitle, startDate),
    });
    console.log("[Recruitment] Offer accepted notification email sent to:", hrEmail);
  } catch (err) {
    console.error("[Recruitment] Failed to send offer accepted email:", err.message);
  }
};

module.exports = {
  notifyJobPosted,
  notifyApplicationSubmitted,
  notifyInterviewScheduled,
  notifyOfferSent,
  notifyOfferAccepted,
};
