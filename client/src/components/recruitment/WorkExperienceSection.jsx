import { FaEdit, FaTrash } from "react-icons/fa";
import {
  EMPLOYMENT_TYPES,
  TEXT_LIMITS,
  formatDateRange,
  hasExperienceContent,
  isExperienceComplete,
  isExperienceDraft,
  toDateInputValue,
} from "../../utils/profileFormUtils";

const fieldError = (errors, key) => errors[key];

const CharCounter = ({ value = "", max }) => (
  <span className="profile-char-count" aria-live="polite">
    {value.length}/{max} characters
  </span>
);

const ExperienceForm = ({ item, index, errors, onUpdate, onCancel, title }) => (
  <div className="profile-form-section">
    {title && <h3 className="profile-form-section-title">{title}</h3>}

    <fieldset className="profile-fieldset">
      <legend>Employer Information</legend>
      <div className="profile-field-row profile-field-row-2">
        <label className={fieldError(errors, `experience-${index}-employer`) ? "has-error" : ""}>
          Employer *
          <input
            value={item.employer}
            onChange={(e) => onUpdate(index, "employer", e.target.value)}
            placeholder="e.g. Turkana University College"
          />
          {fieldError(errors, `experience-${index}-employer`) && (
            <span className="field-error">{fieldError(errors, `experience-${index}-employer`)}</span>
          )}
        </label>
        <label className={fieldError(errors, `experience-${index}-jobTitle`) ? "has-error" : ""}>
          Job Title *
          <input
            value={item.jobTitle}
            onChange={(e) => onUpdate(index, "jobTitle", e.target.value)}
            placeholder="e.g. ICT Support Officer"
          />
          {fieldError(errors, `experience-${index}-jobTitle`) && (
            <span className="field-error">{fieldError(errors, `experience-${index}-jobTitle`)}</span>
          )}
        </label>
      </div>
      <div className="profile-field-row profile-field-row-2">
        <label className={fieldError(errors, `experience-${index}-employmentType`) ? "has-error" : ""}>
          Employment Type *
          <select
            value={item.employmentType}
            onChange={(e) => onUpdate(index, "employmentType", e.target.value)}
          >
            <option value="">Select employment type</option>
            {EMPLOYMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {fieldError(errors, `experience-${index}-employmentType`) && (
            <span className="field-error">{fieldError(errors, `experience-${index}-employmentType`)}</span>
          )}
        </label>
        <label>
          Location
          <input
            value={item.location}
            onChange={(e) => onUpdate(index, "location", e.target.value)}
            placeholder="e.g. Lodwar, Kenya"
          />
        </label>
      </div>
    </fieldset>

    <fieldset className="profile-fieldset">
      <legend>Employment Period</legend>
      <div className="profile-field-row profile-field-row-2">
        <label className={fieldError(errors, `experience-${index}-startDate`) ? "has-error" : ""}>
          Start Date *
          <input
            type="date"
            value={toDateInputValue(item.startDate)}
            onChange={(e) => onUpdate(index, "startDate", e.target.value)}
          />
          {fieldError(errors, `experience-${index}-startDate`) && (
            <span className="field-error">{fieldError(errors, `experience-${index}-startDate`)}</span>
          )}
        </label>
        {!item.currentlyWorking && (
          <label className={fieldError(errors, `experience-${index}-endDate`) ? "has-error" : ""}>
            End Date *
            <input
              type="date"
              value={toDateInputValue(item.endDate)}
              onChange={(e) => onUpdate(index, "endDate", e.target.value)}
            />
            {fieldError(errors, `experience-${index}-endDate`) && (
              <span className="field-error">{fieldError(errors, `experience-${index}-endDate`)}</span>
            )}
          </label>
        )}
      </div>
      <label className="profile-toggle-check">
        <input
          type="checkbox"
          checked={item.currentlyWorking}
          onChange={(e) => onUpdate(index, "currentlyWorking", e.target.checked)}
        />
        <span>I currently work here</span>
      </label>
    </fieldset>

    <fieldset className="profile-fieldset">
      <legend>Role Description</legend>
      <label className="profile-field-full">
        <span className="profile-label-row">
          Responsibilities
          <CharCounter value={item.responsibilities || ""} max={TEXT_LIMITS.responsibilities} />
        </span>
        <textarea
          rows={4}
          value={item.responsibilities}
          maxLength={TEXT_LIMITS.responsibilities}
          onChange={(e) => onUpdate(index, "responsibilities", e.target.value)}
          placeholder="e.g. Managed ICT help desk tickets, supported staff systems, and maintained network documentation."
        />
      </label>
      <label className="profile-field-full">
        <span className="profile-label-row">
          Key Achievements
          <CharCounter value={item.achievements || ""} max={TEXT_LIMITS.achievements} />
        </span>
        <textarea
          rows={4}
          value={item.achievements}
          maxLength={TEXT_LIMITS.achievements}
          onChange={(e) => onUpdate(index, "achievements", e.target.value)}
          placeholder="e.g. Reduced ticket resolution time by 30% through improved triage and knowledge base articles."
        />
      </label>
    </fieldset>

    {onCancel && (
      <div className="profile-form-actions">
        <button type="button" className="profile-secondary-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    )}
  </div>
);

const ExperienceCard = ({ item, index, onEdit, onDelete }) => (
  <article className="profile-timeline-card">
    <div className="profile-timeline-marker" aria-hidden="true" />
    <div className="profile-timeline-content">
      <div className="profile-timeline-header">
        <div>
          <h3>{item.jobTitle}</h3>
          <p className="profile-timeline-subtitle">
            {item.employer}
            {item.employmentType ? ` · ${item.employmentType}` : ""}
            {item.location ? ` · ${item.location}` : ""}
          </p>
          <p className="profile-timeline-dates">
            {formatDateRange(item.startDate, item.endDate, item.currentlyWorking)}
          </p>
        </div>
        <div className="profile-timeline-actions">
          <button type="button" className="profile-icon-btn" onClick={() => onEdit(index)} aria-label="Edit experience">
            <FaEdit aria-hidden="true" />
            Edit
          </button>
          <button
            type="button"
            className="profile-icon-btn danger"
            onClick={() => onDelete(index)}
            aria-label="Delete experience"
          >
            <FaTrash aria-hidden="true" />
            Delete
          </button>
        </div>
      </div>
      {item.responsibilities?.trim() && (
        <div className="profile-timeline-block">
          <strong>Responsibilities</strong>
          <p>{item.responsibilities}</p>
        </div>
      )}
      {item.achievements?.trim() && (
        <div className="profile-timeline-block">
          <strong>Key Achievements</strong>
          <p>{item.achievements}</p>
        </div>
      )}
      {!isExperienceComplete(item) && (
        <p className="profile-timeline-incomplete">This entry is incomplete. Select Edit to add required details.</p>
      )}
    </div>
  </article>
);

const WorkExperienceSection = ({
  experiences,
  errors,
  editingIndex,
  isAddingNew,
  onUpdate,
  onEdit,
  onDelete,
  onAddNew,
  onCancelEdit,
}) => {
  const formIndex = editingIndex ?? (isAddingNew ? experiences.length - 1 : 0);
  const showForm =
    (experiences.length === 1 && isExperienceDraft(experiences[0]) && editingIndex === null && !isAddingNew) ||
    editingIndex !== null ||
    isAddingNew;

  const visibleCards = experiences
    .map((item, index) => ({ item, index }))
    .filter(
      ({ item, index }) =>
        !isExperienceDraft(item) && editingIndex !== index && (isExperienceComplete(item) || hasExperienceContent(item))
    );

  return (
    <div className="profile-experience-section">
      <p className="profile-step-note">
        Add your professional work history. Saved roles appear below as timeline entries that you can edit or remove.
      </p>

      {visibleCards.length > 0 && (
        <div className="profile-timeline">
          {visibleCards.map(({ item, index }) => (
            <ExperienceCard key={`exp-card-${index}`} item={item} index={index} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}

      {showForm && (
        <ExperienceForm
          item={experiences[formIndex] || experiences[0]}
          index={formIndex}
          errors={errors}
          onUpdate={onUpdate}
          onCancel={editingIndex !== null || isAddingNew ? onCancelEdit : null}
          title={
            editingIndex !== null ? "Edit Work Experience" : isAddingNew ? "Add Work Experience" : "Work Experience"
          }
        />
      )}

      {!showForm && (
        <button type="button" className="profile-secondary-btn profile-add-btn" onClick={onAddNew}>
          + Add another experience
        </button>
      )}
    </div>
  );
};

export default WorkExperienceSection;
