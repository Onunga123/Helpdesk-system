export const SHORT_DESCRIPTION_LENGTH = 140;

export const formatJobDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const getDeadlineInfo = (deadline, status) => {
  if (status === "Closed") {
    return { label: "Closed", tone: "closed", daysRemaining: null };
  }

  if (!deadline) {
    return { label: "No deadline", tone: "normal", daysRemaining: null };
  }

  const now = new Date();
  const end = new Date(deadline);
  end.setHours(23, 59, 59, 999);
  const diffMs = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: "Deadline passed", tone: "expired", daysRemaining: diffDays };
  }
  if (diffDays === 0) {
    return { label: "Closes today", tone: "urgent", daysRemaining: 0 };
  }
  if (diffDays <= 7) {
    return {
      label: `Closes in ${diffDays} day${diffDays === 1 ? "" : "s"}`,
      tone: "urgent",
      daysRemaining: diffDays,
    };
  }

  return {
    label: `Closes in ${diffDays} days`,
    tone: "normal",
    daysRemaining: diffDays,
  };
};

export const jobToForm = (job) => ({
  jobTitle: job.jobTitle || "",
  department: job.department || "",
  description: job.description || "",
  requirements: job.requirements || "",
  salaryMin: job.salary?.min ?? "",
  salaryMax: job.salary?.max ?? "",
  jobType: job.jobType || "Administrative",
  deadline: job.deadline ? new Date(job.deadline).toISOString().slice(0, 10) : "",
});

export const getRecruitmentMetrics = (job) => {
  const metrics = job.recruitmentMetrics;
  return {
    applications: metrics?.applications ?? job.applicantCount ?? 0,
    shortlisted: metrics?.shortlisted ?? 0,
    interviews: metrics?.interviews ?? 0,
    offers: metrics?.offers ?? 0,
  };
};

export const buildJobPayload = (form) => ({
  jobTitle: form.jobTitle.trim(),
  department: form.department.trim(),
  description: form.description.trim(),
  requirements: form.requirements.trim(),
  salary: {
    min: form.salaryMin ? Number(form.salaryMin) : undefined,
    max: form.salaryMax ? Number(form.salaryMax) : undefined,
  },
  jobType: form.jobType,
  deadline: form.deadline,
});
