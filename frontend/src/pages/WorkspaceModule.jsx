
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const API =
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8000/api/v1';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.txt',
  '.png',
  '.jpg',
  '.jpeg',
];

const MODULES = {
  goals: {
    title: 'Goals & Progress',
    description: 'Review goals and acknowledge your progress.',
    item: 'goal',
    createRoles: ['hr', 'manager'],
    ownerRequired: true,
    updateRoles: ['hr', 'manager'],
    staffStatuses: [],
    ackStatuses: ['completed', 'pending', 'in_progress'],
  },

  leave: {
    title: 'Leave Management',
    description: 'Submit leave requests for a date range.',
    item: 'leave request',
    createRoles: ['intern'],
    updateRoles: ['hr', 'manager'],
    staffStatuses: ['pending', 'approved', 'rejected'],
  },

  feedback: {
    title: 'Feedback & Reviews',
    description: 'Read feedback and acknowledge each review.',
    item: 'feedback record',
    createRoles: ['hr', 'manager'],
    ownerRequired: true,
    updateRoles: ['hr', 'manager'],
    staffStatuses: ['open', 'reviewed', 'completed'],
    ackStatuses: ['reviewed', 'in_progress', 'completed'],
  },

  submissions: {
    title: 'Work Submissions',
    description:
      'Submit your work, certificates and supporting documents. HR and managers can review submissions.',
    item: 'work submission',
    createRoles: ['intern'],
    updateRoles: ['manager', 'hr'],
    staffStatuses: ['submitted', 'reviewed'],
  },

  learning: {
    title: 'Learning & Webinars',
    description: 'Explore learning resources and webinars.',
    item: 'learning resource',
    createRoles: ['hr', 'manager'],
    updateRoles: ['hr', 'manager'],
    staffStatuses: [],
    ackStatuses: ['acknowledged', 'in_progress', 'completed'],
  },

  certifications: {
    title: 'Certifications',
    description: 'Add completed certificates or publish course links.',
    item: 'certification or course',
    createRoles: ['intern', 'hr', 'manager'],
    updateRoles: ['hr', 'manager'],
    staffStatuses: ['open', 'verified', 'completed'],
  },

  onboarding: {
    title: 'Onboarding',
    description: 'Track onboarding requirements with HR.',
    item: 'onboarding requirement',
    createRoles: ['hr'],
    ownerRequired: true,
    updateRoles: ['hr'],
    staffStatuses: ['open', 'in_progress', 'completed', 'verified'],
  },

  evaluations: {
    title: 'Evaluations',
    description: 'Review structured internship evaluations.',
    item: 'evaluation',
    createRoles: ['hr', 'manager'],
    ownerRequired: true,
    updateRoles: ['hr', 'manager'],
    staffStatuses: ['open', 'reviewed', 'completed'],
  },
};

function readUser() {
  try {
    return JSON.parse(sessionStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
}

function readableStatus(status) {
  return String(status || 'open')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatFileSize(bytes) {
  if (!bytes) return '';

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function WorkspaceModule() {
  const { kind } = useParams();
  const navigate = useNavigate();

  const user = useMemo(() => readUser(), []);
  const token = sessionStorage.getItem('access_token');
  const meta = MODULES[kind];

  const [rows, setRows] = useState([]);
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [owner, setOwner] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [value, setValue] = useState('');

  // Work Submission attachment fields
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submissionType, setSubmissionType] = useState('work_document');

  const canCreate = Boolean(meta?.createRoles.includes(user.role));

  const canUpdate = Boolean(meta?.updateRoles.includes(user.role));

  const isInternCertificate =
    kind === 'certifications' && user.role === 'intern';

  const ownerRequired = Boolean(
    meta?.ownerRequired ||
      (kind === 'certifications' && !isInternCertificate)
  );

  const requestHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token || ''}`,
      'Content-Type': 'application/json',
    }),
    [token]
  );

  const loadRecords = useCallback(async () => {
    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API}/workspace/${kind}`, {
        headers: requestHeaders,
      });

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('user');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error(data?.detail || 'Could not load records.');
      }

      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Unable to connect to the Sattva API.');
    } finally {
      setLoading(false);
    }
  }, [kind, navigate, requestHeaders, token]);

  useEffect(() => {
    if (meta) loadRecords();
  }, [meta, loadRecords]);

  useEffect(() => {
    if (!ownerRequired || !canCreate || !token) {
      setInterns([]);
      return;
    }

    let cancelled = false;

    async function loadInterns() {
      try {
        const response = await fetch(`${API}/interns`, {
          headers: requestHeaders,
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.detail || 'Could not load interns.');
        }

        if (!cancelled) {
          setInterns(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }

    loadInterns();

    return () => {
      cancelled = true;
    };
  }, [ownerRequired, canCreate, token, requestHeaders]);

  if (!meta) {
    return (
      <main className="workspace-page">
        <h1>Module not found</h1>

        <button
          className="workspace-primary-button"
          onClick={() => navigate('/')}
        >
          Back to overview
        </button>
      </main>
    );
  }

  async function createRecord(event) {
    event.preventDefault();

    setError('');
    setNotice('');

    if (!token) {
      navigate('/login');
      return;
    }

    if (ownerRequired && !owner) {
      setError('Please select an intern.');
      return;
    }

    if (kind === 'leave') {
      if (!startDate || !endDate) {
        setError('Select both the leave start date and end date.');
        return;
      }

      if (endDate < startDate) {
        setError('The end date cannot be before the start date.');
        return;
      }
    }

    if (kind === 'submissions') {
      if (!submissionFile) {
        setError(
          'Please attach a certificate or work document before submitting.'
        );
        return;
      }

      const extension = `.${submissionFile.name
        .split('.')
        .pop()
        .toLowerCase()}`;

      if (!ALLOWED_EXTENSIONS.includes(extension)) {
        setError(
          'Unsupported file type. Please upload a PDF, Office document, TXT or image.'
        );
        return;
      }

      if (submissionFile.size > MAX_UPLOAD_BYTES) {
        setError('The maximum document size is 10 MB.');
        return;
      }
    }

    if (kind === 'learning' && value.trim()) {
      try {
        const parsedUrl = new URL(value.trim());

        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          throw new Error();
        }
      } catch {
        setError('Please enter a valid webinar URL starting with https:// or http://.');
        return;
      }
    }

    setSaving(true);

    try {
      const body = {
        title: title.trim(),
        description: description.trim() || null,
        due_date: dueDate || null,
        value: value.trim() || null,
      };

      if (ownerRequired) {
        body.owner_user_id = Number(owner);
      }

      if (kind === 'leave') {
        body.start_date = startDate;
        body.end_date = endDate;
      }

      let response;

      if (kind === 'submissions') {
        const formData = new FormData();

        formData.append('title', title.trim());
        formData.append('description', description.trim());
        formData.append('document_type', submissionType);
        formData.append('document', submissionFile);

        response = await fetch(`${API}/workspace/submissions/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token || ''}`,
          },
          body: formData,
        });
      } else {
        response = await fetch(`${API}/workspace/${kind}`, {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify(body),
        });
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.detail || 'Could not save this record.');
      }

      setTitle('');
      setDescription('');
      setOwner('');
      setDueDate('');
      setStartDate('');
      setEndDate('');
      setValue('');
      setSubmissionFile(null);
      setSubmissionType('work_document');

      setNotice(
        kind === 'submissions'
          ? 'Your work submission and attachment were uploaded successfully.'
          : `${meta.item} saved successfully.`
      );

      await loadRecords();
    } catch (err) {
      setError(err.message || 'Could not save this record.');
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(record, status) {
    setError('');
    setNotice('');

    try {
      const response = await fetch(
        `${API}/workspace/${kind}/${record.id}`,
        {
          method: 'PATCH',
          headers: requestHeaders,
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.detail || 'Could not update status.');
      }

      setNotice(`Status updated for "${record.title}".`);

      await loadRecords();
    } catch (err) {
      setError(err.message || 'Status update failed.');
    }
  }

  async function acknowledge(record, status) {
    setError('');
    setNotice('');

    try {
      const response = await fetch(
        `${API}/workspace/${kind}/${record.id}/acknowledgement`,
        {
          method: 'PATCH',
          headers: requestHeaders,
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.detail || 'Could not save acknowledgement.');
      }

      setNotice(`Your response to "${record.title}" was saved.`);

      await loadRecords();
    } catch (err) {
      setError(err.message || 'Acknowledgement failed.');
    }
  }

  async function downloadAttachment(attachment) {
    setError('');
    setNotice('');

    try {
      const response = await fetch(
        `${API}/workspace/attachments/${attachment.id}/download`,
        {
          headers: {
            Authorization: `Bearer ${token || ''}`,
          },
        }
      );

      if (response.status === 401) {
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('user');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.detail || 'Could not download this document.'
        );
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = downloadUrl;
      link.download = attachment.filename || 'document';
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError(err.message || 'Document download failed.');
    }
  }

  return (
    <main className="workspace-page module-page">
      <button className="workspace-back" onClick={() => navigate('/')}>
        ← Overview
      </button>

      <header className="workspace-page-header">
        <div>
          <span className="workspace-eyebrow">SATTVA WORKSPACE</span>
          <h1>{meta.title}</h1>
          <p>{meta.description}</p>
        </div>

        <button
          className="workspace-primary-button"
          onClick={loadRecords}
          disabled={loading}
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </header>

      {error && (
        <p className="module-message module-error" role="alert">
          {error}
        </p>
      )}

      {notice && (
        <p className="module-message module-success" role="status">
          {notice}
        </p>
      )}

      {canCreate && (
        <section className="module-form-card">
          <div>
            <span className="workspace-eyebrow">
              {kind === 'submissions' ? 'INTERN SUBMISSION' : 'CREATE NEW'}
            </span>

            <h2>
              {kind === 'submissions'
                ? 'Submit work and documents'
                : `Add ${meta.item}`}
            </h2>

            {kind === 'submissions' && (
              <p>
                Upload your completed work, certificates or supporting
                documents for HR and your manager to review.
              </p>
            )}
          </div>

          <form onSubmit={createRecord}>
            <label>
              Title

              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                minLength={2}
                maxLength={180}
                placeholder={`Enter ${meta.item} title`}
              />
            </label>

            <label>
              Description / details

              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={5000}
                rows={4}
                placeholder="Add instructions, details or next steps."
              />
            </label>

            {kind === 'submissions' && (
              <>
                <label>
                  Document category

                  <select
                    value={submissionType}
                    onChange={(event) =>
                      setSubmissionType(event.target.value)
                    }
                  >
                    <option value="work_document">
                      Work document
                    </option>

                    <option value="certificate">
                      Certificate
                    </option>
                  </select>
                </label>

                <label>
                  Upload certificate / work document

                  <input
                    type="file"
                    accept={ALLOWED_EXTENSIONS.join(',')}
                    required
                    onChange={(event) =>
                      setSubmissionFile(
                        event.target.files?.[0] || null
                      )
                    }
                  />

                  <small>
                    Accepted: PDF, Word, Excel, PowerPoint, TXT and
                    images. Maximum size: 10 MB.
                  </small>

                  {submissionFile && (
                    <small>
                      Selected: {submissionFile.name}
                      {' · '}
                      {formatFileSize(submissionFile.size)}
                    </small>
                  )}
                </label>
              </>
            )}

            {ownerRequired && (
              <label>
                Assign to intern

                <select
                  value={owner}
                  onChange={(event) => setOwner(event.target.value)}
                  required
                >
                  <option value="">Select an intern</option>

                  {interns.map((intern) => (
                    <option key={intern.user_id} value={intern.user_id}>
                      {intern.full_name}
                      {intern.intern_code
                        ? ` · ${intern.intern_code}`
                        : ''}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {kind === 'leave' && (
              <div className="module-form-row">
                <label>
                  Leave start date

                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    required
                  />
                </label>

                <label>
                  Leave end date

                  <input
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(event) => setEndDate(event.target.value)}
                    required
                  />
                </label>
              </div>
            )}

            {(kind === 'learning' || kind === 'certifications') && (
              <label>
                {kind === 'learning'
                  ? 'Webinar / learning URL (interns can access this link)'
                  : 'Course or certificate URL (optional)'}

                <input
                  type="url"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  maxLength={500}
                  placeholder="https://..."
                  required={kind === 'learning'}
                />

                {kind === 'learning' && (
                  <small>
                    Add the webinar joining link. Interns will see it
                    in Learning & Webinars.
                  </small>
                )}
              </label>
            )}

            {kind !== 'leave' && (
              <label>
                Due date (optional)

                <input
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                />
              </label>
            )}

            <button
              className="workspace-primary-button"
              type="submit"
              disabled={saving}
            >
              {saving
                ? 'Saving…'
                : kind === 'submissions'
                  ? 'Upload work submission'
                  : `Save ${meta.item}`}
            </button>
          </form>
        </section>
      )}

      <section className="module-records">
        <div className="module-records-heading">
          <div>
            <h2>{meta.title}</h2>

            <p>
              Records shown here follow your account permissions.
            </p>
          </div>

          <span>{rows.length} items</span>
        </div>

        {loading ? (
          <div className="workspace-empty">
            <h3>Loading records…</h3>
          </div>
        ) : rows.length === 0 ? (
          <div className="workspace-empty">
            <h3>Nothing here yet</h3>

            <p>
              {canCreate
                ? 'Use the form above to add the first record.'
                : 'Records will appear here when they are assigned, created or submitted.'}
            </p>
          </div>
        ) : (
          <div className="module-record-list">
            {rows.map((record) => {
              const canAcknowledge =
                user.role === 'intern' &&
                Boolean(meta.ackStatuses);

              const canChangeStaffStatus =
                canUpdate &&
                Boolean(meta.staffStatuses?.length) &&
                kind !== 'goals';

              return (
                <article className="module-record" key={record.id}>
                  <div className="module-record-content">
                    <div className="module-record-title">
                      {record.title}
                    </div>

                    <p>
                      {record.description ||
                        'No additional details provided.'}
                    </p>

                    {kind === 'submissions' && (
                      <div className="submission-owner-line">
                        <strong>Intern:</strong>{' '}
                        {record.owner_name || 'Intern details unavailable'}

                        {record.intern_code &&
                          ` · ${record.intern_code}`}

                        {record.owner_email &&
                          ` · ${record.owner_email}`}
                      </div>
                    )}

                    {kind === 'submissions' &&
                      record.attachments?.length > 0 && (
                        <div className="submission-attachments">
                          <strong>Attached documents</strong>

                          {record.attachments.map((attachment) => (
                            <div
                              className="submission-attachment-item"
                              key={attachment.id}
                            >
                              <div>
                                <span className="submission-document-type">
                                  {attachment.document_type === 'certificate'
                                    ? 'Certificate'
                                    : 'Work document'}
                                </span>

                                <span className="submission-filename">
                                  {attachment.filename}
                                </span>

                                {attachment.size_bytes && (
                                  <small>
                                    {formatFileSize(attachment.size_bytes)}
                                  </small>
                                )}
                              </div>

                              <button
                                type="button"
                                className="workspace-primary-button"
                                onClick={() =>
                                  downloadAttachment(attachment)
                                }
                              >
                                Download
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                    {kind === 'submissions' &&
                      (!record.attachments ||
                        record.attachments.length === 0) && (
                        <small>
                          No attachment is available for this submission.
                        </small>
                      )}

                    <div className="module-record-meta">
                      {record.start_date && record.end_date
                        ? `Leave: ${String(record.start_date).slice(0, 10)} – ${String(record.end_date).slice(0, 10)}`
                        : record.due_date
                          ? `Due ${String(record.due_date).slice(0, 10)}`
                          : 'No due date'}

                      {record.value && (
                        <>
                          {' · '}

                          {/^(https?:\/\/)/i.test(record.value) ? (
                            <a
                              href={record.value}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {kind === 'learning'
                                ? 'Join / Open Webinar'
                                : 'Open resource'}
                            </a>
                          ) : (
                            record.value
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="module-record-actions">
                    <span
                      className={`status-pill status-${record.status}`}
                    >
                      {readableStatus(record.status)}
                    </span>

                    {canChangeStaffStatus && (
                      <label>
                        <span className="sr-only">
                          Staff status for {record.title}
                        </span>

                        <select
                          aria-label={`Staff status for ${record.title}`}
                          value={record.status}
                          onChange={(event) =>
                            updateStatus(record, event.target.value)
                          }
                        >
                          {!meta.staffStatuses.includes(record.status) && (
                            <option value={record.status}>
                              {readableStatus(record.status)}
                            </option>
                          )}

                          {meta.staffStatuses.map((status) => (
                            <option key={status} value={status}>
                              {readableStatus(status)}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    {canAcknowledge && (
                      <label>
                        <span>My acknowledgement</span>

                        <select
                          aria-label={`Your acknowledgement for ${record.title}`}
                          value={
                            record.acknowledgement_status || 'pending'
                          }
                          onChange={(event) =>
                            acknowledge(record, event.target.value)
                          }
                        >
                          <option value="pending" disabled>
                            Pending acknowledgement
                          </option>

                          {meta.ackStatuses.map((status) => (
                            <option key={status} value={status}>
                              {readableStatus(status)}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
