const LANGUAGE_PROFICIENCY = ["Basic", "Conversational", "Professional", "Native"];

const fieldError = (errors, key) => errors[key];

const LanguagesSection = ({ languages, errors, onUpdate, onRemove, onAdd }) => (
  <div className="profile-list-section">
    <p className="profile-step-note">Add the languages you speak and your proficiency level for each.</p>

    <div className="profile-card-list">
      {languages.map((item, index) => (
        <div className="profile-repeat-card" key={`lang-${index}`}>
          <div className="profile-repeat-header">
            <h3>{item.language?.trim() ? item.language : `Language ${index + 1}`}</h3>
            {languages.length > 1 && (
              <button type="button" className="profile-icon-btn danger" onClick={() => onRemove(index)}>
                Remove
              </button>
            )}
          </div>
          <div className="profile-field-row profile-field-row-2">
            <label className={fieldError(errors, `language-${index}-language`) ? "has-error" : ""}>
              Language *
              <input
                value={item.language}
                onChange={(e) => onUpdate(index, "language", e.target.value)}
                placeholder="e.g. English"
              />
              {fieldError(errors, `language-${index}-language`) && (
                <span className="field-error">{fieldError(errors, `language-${index}-language`)}</span>
              )}
            </label>
            <label>
              Proficiency
              <select value={item.proficiency} onChange={(e) => onUpdate(index, "proficiency", e.target.value)}>
                {LANGUAGE_PROFICIENCY.map((level) => (
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
      + Add language
    </button>
  </div>
);

export default LanguagesSection;
