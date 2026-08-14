const asyncHandler = require("express-async-handler");
const Interview = require("../models/interviewModel");
const Application = require("../models/applicationModel");

const VALID_RECOMMENDATIONS = ["Proceed", "Reject", "On Hold"];

const scheduleInterview = asyncHandler(async (req, res) => {
  const { applicationId, interviewDate, interviewTime, location, interviewType, meetingLink } = req.body;

  if (!applicationId || !interviewDate || !interviewTime || !location || !interviewType) {
    res.status(400);
    throw new Error("All required fields must be provided");
  }

  const application = await Application.findById(applicationId);
  if (!application) {
    res.status(404);
    throw new Error("Application not found");
  }

  const interview = await Interview.create({
    applicationId,
    interviewDate,
    interviewTime,
    location,
    interviewType,
    interviewerId: req.user._id,
    meetingLink,
  });

  res.status(201).json({ success: true, data: interview });
});

const getInterviews = asyncHandler(async (req, res) => {
  const { applicationId, status, interviewerId } = req.query;
  const query = {};

  if (applicationId) query.applicationId = applicationId;
  if (status) query.status = status;
  if (interviewerId) query.interviewerId = interviewerId;

  const interviews = await Interview.find(query)
    .populate({
      path: "applicationId",
      populate: [
        { path: "applicantId", select: "firstName lastName email" },
        { path: "jobId", select: "jobTitle department" },
      ],
    })
    .populate("interviewerId", "name email")
    .sort({ interviewDate: -1 });

  res.json({ success: true, count: interviews.length, data: interviews });
});

const getInterviewById = asyncHandler(async (req, res) => {
  const interview = await Interview.findById(req.params.id)
    .populate({
      path: "applicationId",
      populate: [
        { path: "applicantId", select: "firstName lastName email phone" },
        { path: "jobId", select: "jobTitle department" },
      ],
    })
    .populate("interviewerId", "name email role");

  if (!interview) {
    res.status(404);
    throw new Error("Interview not found");
  }

  res.json({ success: true, data: interview });
});

const updateInterview = asyncHandler(async (req, res) => {
  const interview = await Interview.findById(req.params.id);

  if (!interview) {
    res.status(404);
    throw new Error("Interview not found");
  }

  if (interview.status !== "Scheduled") {
    res.status(400);
    throw new Error("Only scheduled interviews can be updated");
  }

  const { interviewDate, interviewTime, location, interviewType, meetingLink } = req.body;

  if (interviewDate) interview.interviewDate = interviewDate;
  if (interviewTime) interview.interviewTime = interviewTime;
  if (location) interview.location = location;
  if (interviewType) interview.interviewType = interviewType;
  if (meetingLink !== undefined) interview.meetingLink = meetingLink;

  const updated = await interview.save();
  res.json({ success: true, data: updated });
});

const completeInterview = asyncHandler(async (req, res) => {
  const { interviewNotes, recommendation } = req.body;

  if (!recommendation || !VALID_RECOMMENDATIONS.includes(recommendation)) {
    res.status(400);
    throw new Error("A valid recommendation is required (Proceed, Reject, or On Hold)");
  }

  const interview = await Interview.findById(req.params.id);

  if (!interview) {
    res.status(404);
    throw new Error("Interview not found");
  }

  if (interview.status !== "Scheduled") {
    res.status(400);
    throw new Error(`Cannot complete an interview with status "${interview.status}"`);
  }

  interview.status = "Completed";
  interview.interviewNotes = interviewNotes?.trim() || "";
  interview.recommendation = recommendation;

  const updated = await interview.save();
  res.json({ success: true, message: "Interview marked as completed", data: updated });
});

const cancelInterview = asyncHandler(async (req, res) => {
  const { cancellationReason } = req.body;

  const interview = await Interview.findById(req.params.id);

  if (!interview) {
    res.status(404);
    throw new Error("Interview not found");
  }

  if (interview.status !== "Scheduled") {
    res.status(400);
    throw new Error(`Cannot cancel an interview with status "${interview.status}"`);
  }

  interview.status = "Cancelled";
  interview.cancellationReason = cancellationReason?.trim() || "";

  const updated = await interview.save();

  res.json({ success: true, message: "Interview cancelled", data: updated });
});

const updateInterviewOutcome = asyncHandler(async (req, res) => {
  const { interviewNotes, recommendation } = req.body;

  const interview = await Interview.findById(req.params.id);

  if (!interview) {
    res.status(404);
    throw new Error("Interview not found");
  }

  if (interview.status !== "Completed") {
    res.status(400);
    throw new Error("Only completed interviews can have their outcome updated");
  }

  if (recommendation !== undefined) {
    if (!VALID_RECOMMENDATIONS.includes(recommendation)) {
      res.status(400);
      throw new Error("Invalid recommendation. Use Proceed, Reject, or On Hold");
    }
    interview.recommendation = recommendation;
  }

  if (interviewNotes !== undefined) {
    interview.interviewNotes = interviewNotes.trim();
  }

  const updated = await interview.save();
  res.json({ success: true, message: "Interview outcome updated", data: updated });
});

const getInterviewsByApplicant = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;

  const interviews = await Interview.find({ applicationId })
    .populate("interviewerId", "name email")
    .sort({ interviewDate: -1 });

  res.json({ success: true, count: interviews.length, data: interviews });
});

module.exports = {
  scheduleInterview,
  getInterviews,
  getInterviewById,
  updateInterview,
  completeInterview,
  cancelInterview,
  updateInterviewOutcome,
  getInterviewsByApplicant,
};
