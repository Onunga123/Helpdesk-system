import { FaEdit, FaTrash } from "react-icons/fa";
import {
  formatMonthRange,
  hasEducationContent,
  isEducationComplete,
  isEducationDraft,
  toMonthInputValue,
} from "../../utils/profileFormUtils";

const fieldError = (errors, key) => errors[key];

const EducationForm = ({ item, index, errors, onUpdate, onCancel, title }) => (
  <div className="profile-form-section">
    {title && <h3 className="profile-form-section-title">{title}</h3>}

    <fieldset className="profile-fieldset">
      <legend>Institution Details</legend>
      <div className="profile-field-row profile-field-row-2">
        <label className={fieldError(errors, `education-${index}-institution`) ? "has-error" : ""}>
          Institution *
          <input
            value={item.institution}
            onChange={(e) => onUpdate(index, "institution", e.target.value)}
            placeholder="e.g. Turkana University College"
          />
          {fieldError(errors, `education-${index}-institution`) && (
            <span className="field-error">{fieldError(errors, `education-${index}-institution`)}</span>
          )}
        </label>
        <label className={fieldError(errors, `education-${index}-qualification`) ? "has-error" : ""}>
          Qualification *
          <input
            value={item.qualification}
            onChange={(e) => onUpdate(index, "qualification", e.target.value)}
            placeholder="e.g. Bachelor of Science"
          />
          {fieldError(errors, `education-${index}-qualification`) && (
            <span className="field-error">{fieldError(errors, `education-${index}-qualification`)}</span>
          )}
        </label>
      </div>
      <div className="profile-field-row profile-field-row-2">
        <label>
          Field of Study
          <input
            value={item.fieldOfStudy}
            onChange={(e) => onUpdate(index, "fieldOfStudy", e.target.value)}
            placeholder="e.g. Computer Science"
          />
        </label>
        <label>
          Grade / Classification
          <input
            value={item.grade}
            onChange={(e) => onUpdate(index, "grade", e.target.value)}
            placeholder="e.g. First Class Honours"
          />
        </label>
      </div>
    </fieldset>

    <fieldset className="profile-fieldset">
      <legend>Study Period</legend>
      <div className="profile-field-row profile-field-row-2">
        <label>
          Start Date
          <input
            type="month"
            value={toMonthInputValue(item.startDate)}
            onChange={(e) => onUpdate(index, "startDate", e.target.value)}
          />
        </label>
        {!item.currentlyStudying && (
          <label>
            End Date
            <input
              type="month"
              value={toMonthInputValue(item.endDate)}
              onChange={(e) => onUpdate(index, "endDate", e.target.value)}
            />
          </label>
        )}
      </div>
      <label className="profile-toggle-check">
        <input
          type="checkbox"
          checked={item.currentlyStudying}
          onChange={(e) => onUpdate(index, "currentlyStudying", e.target.checked)}
        />
        <span>I am currently studying here</span>
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

const EducationCard = ({ item, index, onEdit, onDelete }) => (
  <article className="profile-repeat-card">
    <div className="profile-repeat-header">
      <div>
        <h3>{item.qualification || "Education"}</h3>
        <p className="profile-card-subtitle">
          {item.institution}
          {item.fieldOfStudy ? ` · ${item.fieldOfStudy}` : ""}
          {item.grade ? ` · ${item.grade}` : ""}
        </p>
        {formatMonthRange(item.startDate, item.endDate, item.currentlyStudying) && (
          <p className="profile-card-meta">{formatMonthRange(item.startDate, item.endDate, item.currentlyStudying)}</p>
        )}
      </div>
      <div className="profile-timeline-actions">
        <button type="button" className="profile-icon-btn" onClick={() => onEdit(index)} aria-label="Edit education">
          <FaEdit aria-hidden="true" />
          Edit
        </button>
        <button type="button" className="profile-icon-btn danger" onClick={() => onDelete(index)} aria-label="Delete education">
          <FaTrash aria-hidden="true" />
          Delete
        </button>
      </div>
    </div>
  </article>
);

const EducationSection = ({
  entries,
  errors,
  editingIndex,
  isAddingNew,
  onUpdate,
  onEdit,
  onDelete,
  onAddNew,
  onCancelEdit,
}) => {
  const formIndex = editingIndex ?? (isAddingNew ? entries.length - 1 : 0);
  const showForm =
    (entries.length === 1 && isEducationDraft(entries[0]) && editingIndex === null && !isAddingNew) ||
    editingIndex !== null ||
    isAddingNew;

  const visibleCards = entries
    .map((item, index) => ({ item, index }))
    .filter(
      ({ item, index }) =>
        !isEducationDraft(item) && editingIndex !== index && (isEducationComplete(item) || hasEducationContent(item))
    );

  return (
    <div className="profile-list-section">
      <p className="profile-step-note">
        Add your academic qualifications. Saved entries appear below and can be edited or removed.
      </p>

      {visibleCards.length > 0 && (
        <div className="profile-card-list">
          {visibleCards.map(({ item, index }) => (
            <EducationCard key={`edu-card-${index}`} item={item} index={index} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}

      {showForm && (
        <EducationForm
          item={entries[formIndex] || entries[0]}
          index={formIndex}
          errors={errors}
          onUpdate={onUpdate}
          onCancel={editingIndex !== null || isAddingNew ? onCancelEdit : null}
          title={editingIndex !== null ? "Edit Education" : isAddingNew ? "Add Education" : "Education"}
        />
      )}

      {!showForm && (
        <button type="button" className="profile-secondary-btn profile-add-btn" onClick={onAddNew}>
          + Add education
        </button>
      )}
    </div>
  );
};

export default EducationSection;
