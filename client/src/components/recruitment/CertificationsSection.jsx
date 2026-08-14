import { resolveMediaUrl } from "../../utils/mediaUrl";
import { toMonthInputValue } from "../../utils/profileFormUtils";

const fieldError = (errors, key) => errors[key];

const getFileName = (path, fallback = "Certificate file") => {
  if (!path) return "";
  const parts = path.split("/");
  return parts[parts.length - 1] || fallback;
};

const CertificationsSection = ({
  certifications,
  errors,
  uploading,
  onUpdate,
  onRemove,
  onAdd,
  onUpload,
  onRemoveCertificate,
}) => (
  <div className="profile-list-section">
    <p className="profile-step-note">
      Add professional certifications and upload supporting certificate documents (PDF, DOC, DOCX, or images up to 5MB).
    </p>

    <div className="profile-card-list">
      {certifications.map((item, index) => (
        <div className="profile-repeat-card" key={`cert-${index}`}>
          <div className="profile-repeat-header">
            <h3>{item.name?.trim() ? item.name : `Certification ${index + 1}`}</h3>
            {certifications.length > 1 && (
              <button type="button" className="profile-icon-btn danger" onClick={() => onRemove(index)}>
                Remove
              </button>
            )}
          </div>

          <fieldset className="profile-fieldset">
            <legend>Certification Details</legend>
            <div className="profile-field-row profile-field-row-2">
              <label className={fieldError(errors, `certification-${index}-name`) ? "has-error" : ""}>
                Certification Name *
                <input
                  value={item.name}
                  onChange={(e) => onUpdate(index, "name", e.target.value)}
                  placeholder="e.g. AWS Certified Solutions Architect"
                />
                {fieldError(errors, `certification-${index}-name`) && (
                  <span className="field-error">{fieldError(errors, `certification-${index}-name`)}</span>
                )}
              </label>
              <label>
                Issuing Organization
                <input
                  value={item.issuingOrganization}
                  onChange={(e) => onUpdate(index, "issuingOrganization", e.target.value)}
                  placeholder="e.g. Amazon Web Services"
                />
              </label>
            </div>
            <div className="profile-field-row profile-field-row-2">
              <label>
                Issue Date
                <input
                  type="month"
                  value={toMonthInputValue(item.issueDate)}
                  onChange={(e) => onUpdate(index, "issueDate", e.target.value)}
                />
              </label>
              <label>
                Expiry Date
                <input
                  type="month"
                  value={toMonthInputValue(item.expiryDate)}
                  onChange={(e) => onUpdate(index, "expiryDate", e.target.value)}
                />
              </label>
            </div>
            <label>
              Credential ID
              <input
                value={item.credentialId}
                onChange={(e) => onUpdate(index, "credentialId", e.target.value)}
                placeholder="e.g. ABC-12345"
              />
            </label>
          </fieldset>

          <div className="profile-doc-card">
            <div>
              <h3>Certificate Document</h3>
              <p>
                {item.certificatePath
                  ? getFileName(item.certificatePath, "Certificate uploaded")
                  : "PDF, DOC, DOCX, JPG, or PNG up to 5MB"}
              </p>
            </div>
            <div className="profile-doc-actions">
              {item.certificatePath && (
                <a
                  href={resolveMediaUrl(item.certificatePath)}
                  target="_blank"
                  rel="noreferrer"
                  className="profile-link-btn"
                >
                  View
                </a>
              )}
              <label className={`profile-upload-btn small ${uploading ? "disabled" : ""}`}>
                {uploading ? "Uploading..." : item.certificatePath ? "Replace" : "Upload"}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  hidden
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onUpload(index, file, item.name);
                    e.target.value = "";
                  }}
                />
              </label>
              {item.certificatePath && (
                <button
                  type="button"
                  className="profile-link-btn danger"
                  disabled={uploading}
                  onClick={() => onRemoveCertificate(index)}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>

    <button type="button" className="profile-secondary-btn profile-add-btn" onClick={onAdd}>
      + Add certification
    </button>
  </div>
);

export default CertificationsSection;
