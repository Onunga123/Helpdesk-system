import { FaEdit, FaTrash } from "react-icons/fa";

const fieldError = (errors, key) => errors[key];

const isReferenceDraft = (item) => !item?.name?.trim() && !item?.email?.trim();

const hasReferenceContent = (item) =>
  Boolean(
    item?.name?.trim() ||
      item?.title?.trim() ||
      item?.organization?.trim() ||
      item?.relationship?.trim() ||
      item?.email?.trim() ||
      item?.phone?.trim() ||
      item?.location?.trim()
  );

const ReferenceForm = ({ item, index, errors, onUpdate, onCancel, title }) => (
  <div className="profile-form-section">
    {title && <h3 className="profile-form-section-title">{title}</h3>}

    <fieldset className="profile-fieldset">
      <legend>Contact Details</legend>
      <div className="profile-field-row profile-field-row-2">
        <label className={fieldError(errors, `reference-${index}-name`) ? "has-error" : ""}>
          Full Name *
          <input
            value={item.name}
            onChange={(e) => onUpdate(index, "name", e.target.value)}
            placeholder="e.g. Jane Wanjiku"
          />
          {fieldError(errors, `reference-${index}-name`) && (
            <span className="field-error">{fieldError(errors, `reference-${index}-name`)}</span>
          )}
        </label>
        <label>
          Job Title
          <input
            value={item.title}
            onChange={(e) => onUpdate(index, "title", e.target.value)}
            placeholder="e.g. HR Manager"
          />
        </label>
      </div>
      <div className="profile-field-row profile-field-row-2">
        <label>
          Organization
          <input
            value={item.organization}
            onChange={(e) => onUpdate(index, "organization", e.target.value)}
            placeholder="e.g. Turkana University College"
          />
        </label>
        <label>
          Relationship
          <input
            value={item.relationship}
            onChange={(e) => onUpdate(index, "relationship", e.target.value)}
            placeholder="e.g. Former supervisor"
          />
        </label>
      </div>
    </fieldset>

    <fieldset className="profile-fieldset">
      <legend>Reachability</legend>
      <div className="profile-field-row profile-field-row-2">
        <label className={fieldError(errors, `reference-${index}-email`) ? "has-error" : ""}>
          Email *
          <input
            type="email"
            value={item.email}
            onChange={(e) => onUpdate(index, "email", e.target.value)}
            placeholder="e.g. jane@example.com"
          />
          {fieldError(errors, `reference-${index}-email`) && (
            <span className="field-error">{fieldError(errors, `reference-${index}-email`)}</span>
          )}
        </label>
        <label>
          Phone
          <input
            value={item.phone}
            onChange={(e) => onUpdate(index, "phone", e.target.value)}
            placeholder="e.g. +254 700 000 000"
          />
        </label>
      </div>
      <label>
        Location
        <input
          value={item.location || ""}
          onChange={(e) => onUpdate(index, "location", e.target.value)}
          placeholder="e.g. Lodwar, Kenya"
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

const ReferenceCard = ({ item, index, onEdit, onDelete }) => (
  <article className="profile-repeat-card">
    <div className="profile-repeat-header">
      <div>
        <h3>{item.name}</h3>
        <p className="profile-card-subtitle">
          {[item.title, item.organization].filter(Boolean).join(" · ")}
          {item.relationship ? ` · ${item.relationship}` : ""}
        </p>
        <p className="profile-card-meta">
          {[item.email, item.phone, item.location].filter(Boolean).join(" · ")}
        </p>
      </div>
      <div className="profile-timeline-actions">
        <button type="button" className="profile-icon-btn" onClick={() => onEdit(index)} aria-label="Edit reference">
          <FaEdit aria-hidden="true" />
          Edit
        </button>
        <button type="button" className="profile-icon-btn danger" onClick={() => onDelete(index)} aria-label="Delete reference">
          <FaTrash aria-hidden="true" />
          Delete
        </button>
      </div>
    </div>
  </article>
);

const ReferencesSection = ({
  references,
  errors,
  editingIndex,
  isAddingNew,
  onUpdate,
  onEdit,
  onDelete,
  onAddNew,
  onCancelEdit,
}) => {
  const formIndex = editingIndex ?? (isAddingNew ? references.length - 1 : 0);
  const showForm =
    (references.length === 1 && isReferenceDraft(references[0]) && editingIndex === null && !isAddingNew) ||
    editingIndex !== null ||
    isAddingNew;

  const visibleCards = references
    .map((item, index) => ({ item, index }))
    .filter(
      ({ item, index }) =>
        !isReferenceDraft(item) && editingIndex !== index && (item.name?.trim() || hasReferenceContent(item))
    );

  return (
    <div className="profile-list-section">
      <p className="profile-step-note">
        Provide professional references who can speak to your work. Saved references appear below.
      </p>

      {visibleCards.length > 0 && (
        <div className="profile-card-list">
          {visibleCards.map(({ item, index }) => (
            <ReferenceCard key={`ref-card-${index}`} item={item} index={index} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}

      {showForm && (
        <ReferenceForm
          item={references[formIndex] || references[0]}
          index={formIndex}
          errors={errors}
          onUpdate={onUpdate}
          onCancel={editingIndex !== null || isAddingNew ? onCancelEdit : null}
          title={editingIndex !== null ? "Edit Reference" : isAddingNew ? "Add Reference" : "Reference"}
        />
      )}

      {!showForm && (
        <button type="button" className="profile-secondary-btn profile-add-btn" onClick={onAddNew}>
          + Add reference
        </button>
      )}
    </div>
  );
};

export default ReferencesSection;
