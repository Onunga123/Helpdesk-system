const asyncHandler = require("express-async-handler");
const fs = require("fs");
const path = require("path");
const Applicant = require("../models/applicantModel");
const {
  serializeApplicantProfile,
  toWebPath,
  getAbsoluteUploadPath,
} = require("../utils/applicantProfileUtils");

const getMyApplicantProfile = asyncHandler(async (req, res) => {
  if (!req.applicant) {
    res.status(403);
    throw new Error("Only applicants can access their profile");
  }

  const applicant = await Applicant.findById(req.applicant._id);
  if (!applicant) {
    res.status(404);
    throw new Error("Applicant not found");
  }

  if (!applicant.profile) applicant.profile = {};

  res.json({
    success: true,
    data: serializeApplicantProfile(applicant),
  });
});

const mergeProfile = (existingProfile, incomingProfile = {}) => {
  const merged = {
    ...existingProfile,
    ...incomingProfile,
    personalDetails: {
      ...(existingProfile.personalDetails || {}),
      ...(incomingProfile.personalDetails || {}),
      location: {
        ...(existingProfile.personalDetails?.location || {}),
        ...(incomingProfile.personalDetails?.location || {}),
      },
    },
    professionalProfile: {
      ...(existingProfile.professionalProfile || {}),
      ...(incomingProfile.professionalProfile || {}),
      expectedSalary: {
        ...(existingProfile.professionalProfile?.expectedSalary || {}),
        ...(incomingProfile.professionalProfile?.expectedSalary || {}),
      },
      workPreferences: {
        ...(existingProfile.professionalProfile?.workPreferences || {}),
        ...(incomingProfile.professionalProfile?.workPreferences || {}),
      },
    },
    documents: {
      ...(existingProfile.documents || {}),
      ...(incomingProfile.documents || {}),
      supportingDocuments:
        incomingProfile.documents?.supportingDocuments ??
        existingProfile.documents?.supportingDocuments ??
        [],
    },
    links: {
      ...(existingProfile.links || {}),
      ...(incomingProfile.links || {}),
      other: incomingProfile.links?.other ?? existingProfile.links?.other ?? [],
    },
    jobPreferences: {
      ...(existingProfile.jobPreferences || {}),
      ...(incomingProfile.jobPreferences || {}),
      preferredLocations:
        incomingProfile.jobPreferences?.preferredLocations ??
        existingProfile.jobPreferences?.preferredLocations ??
        [],
      salaryExpectations: {
        ...(existingProfile.jobPreferences?.salaryExpectations || {}),
        ...(incomingProfile.jobPreferences?.salaryExpectations || {}),
      },
    },
    consent: {
      ...(existingProfile.consent || {}),
      ...(incomingProfile.consent || {}),
    },
  };

  if (incomingProfile.education) merged.education = incomingProfile.education;
  if (incomingProfile.workExperience) merged.workExperience = incomingProfile.workExperience;
  if (incomingProfile.skills) merged.skills = incomingProfile.skills;
  if (incomingProfile.certifications) merged.certifications = incomingProfile.certifications;
  if (incomingProfile.languages) merged.languages = incomingProfile.languages;
  if (incomingProfile.references) merged.references = incomingProfile.references;
  if (incomingProfile.applicationQuestions) {
    merged.applicationQuestions = incomingProfile.applicationQuestions;
  }

  return merged;
};

const updateMyApplicantProfile = asyncHandler(async (req, res) => {
  if (!req.applicant) {
    res.status(403);
    throw new Error("Only applicants can update their profile");
  }

  const applicant = await Applicant.findById(req.applicant._id);
  if (!applicant) {
    res.status(404);
    throw new Error("Applicant not found");
  }

  const {
    firstName,
    lastName,
    email,
    phone,
    yearsOfExperience,
    educationLevel,
    profile,
  } = req.body;

  if (firstName !== undefined) applicant.firstName = String(firstName).trim();
  if (lastName !== undefined) applicant.lastName = String(lastName).trim();
  if (phone !== undefined) applicant.phone = String(phone).trim();
  if (yearsOfExperience !== undefined) applicant.yearsOfExperience = Number(yearsOfExperience) || 0;
  if (educationLevel) applicant.educationLevel = educationLevel;

  if (email !== undefined) {
    const normalizedEmail = String(email).toLowerCase().trim();
    if (!normalizedEmail) {
      res.status(400);
      throw new Error("Email is required");
    }

    const duplicate = await Applicant.findOne({
      email: normalizedEmail,
      _id: { $ne: applicant._id },
    });

    if (duplicate) {
      res.status(400);
      throw new Error("Another account is already using this email address");
    }

    applicant.email = normalizedEmail;
  }

  if (profile) {
    applicant.profile = mergeProfile(applicant.profile || {}, profile);

    if (profile.consent?.privacyConsent && profile.consent?.accuracyDeclaration) {
      applicant.profile.consent.consentedAt = new Date();
    }
  }

  const updated = await applicant.save();

  res.json({
    success: true,
    message: "Profile updated successfully",
    data: serializeApplicantProfile(updated),
  });
});

const removeFileIfExists = (filePath) => {
  const absolute = getAbsoluteUploadPath(filePath) || filePath;
  if (absolute && fs.existsSync(absolute)) {
    fs.unlinkSync(absolute);
  }
};

const uploadApplicantDocument = asyncHandler(async (req, res) => {
  if (!req.applicant) {
    if (req.file?.path) fs.unlinkSync(req.file.path);
    res.status(403);
    throw new Error("Only applicants can upload documents");
  }

  if (!req.file) {
    res.status(400);
    throw new Error("No file uploaded");
  }

  const documentType = req.body.documentType || req.query.documentType;
  const allowedTypes = ["profilePhoto", "cv", "coverLetter", "certificate", "supporting", "applicationDocument"];
  if (!allowedTypes.includes(documentType)) {
    fs.unlinkSync(req.file.path);
    res.status(400);
    throw new Error("Invalid document type");
  }

  const applicant = await Applicant.findById(req.applicant._id);
  if (!applicant) {
    fs.unlinkSync(req.file.path);
    res.status(404);
    throw new Error("Applicant not found");
  }

  if (!applicant.profile) applicant.profile = {};
  if (!applicant.profile.documents) applicant.profile.documents = {};

  const webPath = toWebPath(req.file.path);
  const certificateIndex = Number(req.body.certificateIndex);

  if (documentType === "profilePhoto") {
    removeFileIfExists(applicant.profile.personalDetails?.profilePhoto);
    removeFileIfExists(applicant.profile.documents.profilePhoto);
    applicant.profile.personalDetails = applicant.profile.personalDetails || {};
    applicant.profile.personalDetails.profilePhoto = webPath;
    applicant.profile.documents.profilePhoto = webPath;
  } else if (documentType === "cv") {
    removeFileIfExists(applicant.resumePath);
    removeFileIfExists(applicant.profile.documents.cvPath);
    applicant.resumePath = webPath;
    applicant.profile.documents.cvPath = webPath;
  } else if (documentType === "coverLetter") {
    removeFileIfExists(applicant.profile.documents.coverLetterPath);
    applicant.profile.documents.coverLetterPath = webPath;
  } else if (documentType === "certificate") {
    applicant.profile.certifications = applicant.profile.certifications || [];
    if (!Number.isNaN(certificateIndex) && applicant.profile.certifications[certificateIndex]) {
      removeFileIfExists(applicant.profile.certifications[certificateIndex].certificatePath);
      applicant.profile.certifications[certificateIndex].certificatePath = webPath;
    } else {
      applicant.profile.certifications.push({
        name: req.body.name || req.file.originalname,
        certificatePath: webPath,
      });
    }
  } else if (documentType === "supporting") {
    applicant.profile.documents.supportingDocuments = applicant.profile.documents.supportingDocuments || [];
    applicant.profile.documents.supportingDocuments.push({
      name: req.body.name || req.file.originalname,
      path: webPath,
      uploadedAt: new Date(),
    });
  } else if (documentType === "applicationDocument") {
    // Application-only upload; path is returned to the client and stored on the Application record.
  }

  if (documentType !== "applicationDocument") {
    await applicant.save();
  }

  res.json({
    success: true,
    message: "Document uploaded successfully",
    data: {
      documentType,
      path: webPath,
      fileName: req.file.originalname,
      profile: documentType === "applicationDocument" ? null : serializeApplicantProfile(applicant),
    },
  });
});

const deleteApplicantDocument = asyncHandler(async (req, res) => {
  if (!req.applicant) {
    res.status(403);
    throw new Error("Only applicants can delete documents");
  }

  const { documentType } = req.params;
  const { certificateIndex, supportingIndex } = req.query;

  const applicant = await Applicant.findById(req.applicant._id);
  if (!applicant) {
    res.status(404);
    throw new Error("Applicant not found");
  }

  if (!applicant.profile?.documents) applicant.profile = { ...applicant.profile, documents: {} };

  if (documentType === "profilePhoto") {
    removeFileIfExists(applicant.profile.personalDetails?.profilePhoto);
    removeFileIfExists(applicant.profile.documents.profilePhoto);
    if (applicant.profile.personalDetails) applicant.profile.personalDetails.profilePhoto = "";
    applicant.profile.documents.profilePhoto = "";
  } else if (documentType === "cv") {
    removeFileIfExists(applicant.resumePath);
    removeFileIfExists(applicant.profile.documents.cvPath);
    applicant.resumePath = "";
    applicant.profile.documents.cvPath = "";
  } else if (documentType === "coverLetter") {
    removeFileIfExists(applicant.profile.documents.coverLetterPath);
    applicant.profile.documents.coverLetterPath = "";
  } else if (documentType === "certificate") {
    const index = Number(certificateIndex);
    const cert = applicant.profile.certifications?.[index];
    if (cert) {
      removeFileIfExists(cert.certificatePath);
      cert.certificatePath = "";
    }
  } else if (documentType === "supporting") {
    const index = Number(supportingIndex);
    const doc = applicant.profile.documents.supportingDocuments?.[index];
    if (doc) {
      removeFileIfExists(doc.path);
      applicant.profile.documents.supportingDocuments.splice(index, 1);
    }
  } else {
    res.status(400);
    throw new Error("Invalid document type");
  }

  await applicant.save();

  res.json({
    success: true,
    message: "Document removed successfully",
    data: serializeApplicantProfile(applicant),
  });
});

module.exports = {
  getMyApplicantProfile,
  updateMyApplicantProfile,
  uploadApplicantDocument,
  deleteApplicantDocument,
};
