const SKILL_CATEGORIES = [
  { value: "technical", label: "Technical" },
  { value: "professional", label: "Professional" },
];

const PROFICIENCY_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];

const fieldError = (errors, key) => errors[key];

const SkillsSection = ({ skills, errors, onUpdate, onRemove, onAdd }) => (
  <div className="profile-list-section">
    <p className="profile-step-note">List your key technical and professional skills with proficiency levels.</p>

    <div className="profile-card-list">
      {skills.map((item, index) => (
        <div className="profile-repeat-card" key={`skill-${index}`}>
          <div className="profile-repeat-header">
            <h3>{item.name?.trim() ? item.name : `Skill ${index + 1}`}</h3>
            {skills.length > 1 && (
              <button type="button" className="profile-icon-btn danger" onClick={() => onRemove(index)}>
                Remove
              </button>
            )}
          </div>
          <div className="profile-field-row profile-field-row-2">
            <label className={fieldError(errors, `skill-${index}-name`) ? "has-error" : ""}>
              Skill *
              <input
                value={item.name}
                onChange={(e) => onUpdate(index, "name", e.target.value)}
                placeholder="e.g. Project Management"
              />
              {fieldError(errors, `skill-${index}-name`) && (
                <span className="field-error">{fieldError(errors, `skill-${index}-name`)}</span>
              )}
            </label>
            <label>
              Category
              <select value={item.category} onChange={(e) => onUpdate(index, "category", e.target.value)}>
                {SKILL_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="profile-field-row profile-field-row-2">
            <label>
              Proficiency
              <select value={item.proficiency} onChange={(e) => onUpdate(index, "proficiency", e.target.value)}>
                {PROFICIENCY_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      ))}
    </div>

    <button type="button" className="profile-secondary-btn profile-add-btn" onClick={onAdd}>
      + Add skill
    </button>
  </div>
);

export default SkillsSection;
