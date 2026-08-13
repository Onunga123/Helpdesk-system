const asyncHandler = require("express-async-handler");
const Offer = require("../models/offerModel");
const Application = require("../models/applicationModel");

const VALID_OFFER_STATUSES = ["Pending", "Approved", "On Hold", "Accepted", "Rejected", "Expired"];

const syncApplicationForOfferStatus = async (offer, status) => {
  if (!offer.applicationId) return;

  if (status === "Accepted") {
    await Application.findByIdAndUpdate(offer.applicationId, { status: "Selected" });
  } else if (status === "Rejected" || status === "Expired") {
    const application = await Application.findById(offer.applicationId);
    if (application && application.status === "Offered") {
      await Application.findByIdAndUpdate(offer.applicationId, { status: "Shortlisted" });
    }
  }
};

const createOffer = asyncHandler(async (req, res) => {
  const { applicationId, jobTitle, salaryOffered, startDate, employmentType, terms, offerLetterPath } = req.body;

  if (!applicationId || !jobTitle || !salaryOffered || !startDate || !employmentType) {
    res.status(400);
    throw new Error("All required fields must be provided");
  }

  const application = await Application.findById(applicationId);
  if (!application) {
    res.status(404);
    throw new Error("Application not found");
  }

  const offer = await Offer.create({
    applicationId,
    jobTitle,
    salaryOffered,
    startDate,
    employmentType,
    terms,
    offerLetterPath,
    sentBy: req.user._id,
  });

  res.status(201).json({ success: true, data: offer });
});

const getOffers = asyncHandler(async (req, res) => {
  const { status, applicationId } = req.query;
  const query = {};

  if (status) query.status = status;
  if (applicationId) query.applicationId = applicationId;

  const offers = await Offer.find(query)
    .populate("applicationId")
    .populate("sentBy", "name email")
    .sort({ sentDate: -1 });

  res.json({ success: true, count: offers.length, data: offers });
});

const getOfferById = asyncHandler(async (req, res) => {
  const offer = await Offer.findById(req.params.id)
    .populate("applicationId")
    .populate("sentBy", "name email role");

  if (!offer) {
    res.status(404);
    throw new Error("Offer not found");
  }

  res.json({ success: true, data: offer });
});

const respondToOffer = asyncHandler(async (req, res) => {
  const { response } = req.body;

  if (!response || !["Accepted", "Rejected"].includes(response)) {
    res.status(400);
    throw new Error("Response must be either 'Accepted' or 'Rejected'");
  }

  const offer = await Offer.findById(req.params.id);

  if (!offer) {
    res.status(404);
    throw new Error("Offer not found");
  }

  if (!["Pending", "Approved"].includes(offer.status)) {
    res.status(400);
    throw new Error("Can only respond to pending or approved offers");
  }

  offer.response = response;
  offer.status = response === "Accepted" ? "Accepted" : "Rejected";
  offer.responseDate = new Date();

  const updated = await offer.save();

  await syncApplicationForOfferStatus(offer, offer.status);

  res.json({ success: true, message: `Offer ${response}`, data: updated });
});

const updateOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findById(req.params.id);

  if (!offer) {
    res.status(404);
    throw new Error("Offer not found");
  }

  if (offer.status !== "Pending") {
    res.status(400);
    throw new Error("Can only update pending offers");
  }

  const { jobTitle, salaryOffered, startDate, employmentType, terms } = req.body;

  if (jobTitle) offer.jobTitle = jobTitle;
  if (salaryOffered) offer.salaryOffered = salaryOffered;
  if (startDate) offer.startDate = startDate;
  if (employmentType) offer.employmentType = employmentType;
  if (terms) offer.terms = terms;

  const updated = await offer.save();
  res.json({ success: true, data: updated });
});

const getOffersByApplicant = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;

  const offers = await Offer.find({ applicationId })
    .populate("sentBy", "name email")
    .sort({ sentDate: -1 });

  res.json({ success: true, count: offers.length, data: offers });
});

const expireOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findById(req.params.id);

  if (!offer) {
    res.status(404);
    throw new Error("Offer not found");
  }

  offer.status = "Expired";
  offer.statusChangedAt = new Date();
  offer.statusChangedBy = req.user._id;
  const updated = await offer.save();

  await syncApplicationForOfferStatus(offer, "Expired");

  res.json({ success: true, message: "Offer expired", data: updated });
});

const updateOfferStatus = asyncHandler(async (req, res) => {
  const { status, statusNote } = req.body;

  if (!status || !VALID_OFFER_STATUSES.includes(status)) {
    res.status(400);
    throw new Error(`Invalid status. Must be one of: ${VALID_OFFER_STATUSES.join(", ")}`);
  }

  const offer = await Offer.findById(req.params.id);

  if (!offer) {
    res.status(404);
    throw new Error("Offer not found");
  }

  offer.status = status;
  if (statusNote !== undefined) offer.statusNote = String(statusNote).trim();
  offer.statusChangedAt = new Date();
  offer.statusChangedBy = req.user._id;

  if (status === "Accepted") {
    offer.response = "Accepted";
    offer.responseDate = new Date();
  } else if (status === "Rejected") {
    offer.response = "Rejected";
    offer.responseDate = new Date();
  }

  const updated = await offer.save();

  await syncApplicationForOfferStatus(offer, status);

  res.json({
    success: true,
    message: `Offer status updated to ${status}`,
    data: updated,
  });
});

module.exports = {
  createOffer,
  getOffers,
  getOfferById,
  respondToOffer,
  updateOffer,
  getOffersByApplicant,
  expireOffer,
  updateOfferStatus,
};
