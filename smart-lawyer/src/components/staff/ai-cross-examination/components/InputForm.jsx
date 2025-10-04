import React from "react";
import PropTypes from "prop-types";

const fieldConfigs = [
  {
    name: "caseSummary",
    label: "Case Summary",
    placeholder: "Briefly describe the nature of the case",
    rows: 6,
    optional: true,
    max: 600,
  },
  {
    name: "relevantLaws",
    label: "Relevant Laws / Statutes",
    placeholder: "List applicable laws, statutes, or regulations",
    rows: 6,
    optional: true,
    max: 400,
  },
  {
    name: "petitioner",
    label: "Petitioner's Arguments *",
    placeholder:
      "Enter petitioner's arguments, claims, and supporting evidence...",
    rows: 12,
    required: true,
    max: 1500,
  },
  {
    name: "respondent",
    label: "Respondent's Arguments *",
    placeholder:
      "Enter respondent's rebuttals, defenses, and counter-evidence...",
    rows: 12,
    required: true,
    max: 1500,
  },
];

function TextAreaField({
  cfg,
  value,
  onChange,
  attachments,
  onFileAttach,
  onFileRemove,
  error,
}) {
  const length = value.length;
  const limit = cfg.max;
  const nearLimit = length > limit * 0.85;
  return (
    <div className="space-y-1">
      <div
        htmlFor={cfg.name}
        className="text-xs font-semibold tracking-wide text-gray-700 "
      >
        {cfg.label.replace(/ \*$/, "")}{" "}
        {cfg.required && <span className="text-rose-600">*</span>}
      </div>
      {/** Chips directly under label (render only when attachments exist to avoid blank space) */}
      {attachments?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-1.5">
          {attachments.map((f, idxInternal) => {
            const ext = f.name.split(".").pop()?.toLowerCase();
            const isPdf = ext === "pdf";
            return (
              <span
                key={f._uid || `${f.name}-${f.size}-${f.lastModified}`}
                className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-medium text-gray-700 shadow-sm"
                title={f.name}
              >
                <span
                  className={
                    "text-[12px] " +
                    (isPdf ? "text-red-500" : "text-indigo-500")
                  }
                >
                  {isPdf ? "📄" : "📝"}
                </span>
                <span
                  className="max-w-[110px] truncate"
                  aria-label="Attached file name"
                >
                  {f.name}
                </span>
                <button
                  type="button"
                  onClick={() => onFileRemove(cfg.name, idxInternal)}
                  className="inline-flex h-4 w-4 items-center justify-center rounded-md hover:bg-red-200 text-red-500 hover:text-red-700 focus:outline-none focus:ring-1 focus:ring-red-400/40"
                  aria-label={`Remove file ${f.name}`}
                >
                  <i className="ri-close-line text-[11px] mt-[1px]" />
                </button>
              </span>
            );
          })}
        </div>
      )}
      <div className="relative">
        <textarea
          id={cfg.name}
          name={cfg.name}
          value={value}
          onChange={onChange}
          placeholder={cfg.placeholder}
          required={cfg.required}
          maxLength={cfg.max}
          rows={cfg.rows}
          className="w-full rounded-xl border border-gray-300/70 bg-white px-4 pt-3 pb-7 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500 transition disabled:opacity-60 disabled:cursor-not-allowed placeholder:text-gray-400 resize-none"
          aria-label={cfg.label}
        />
        <div className="absolute bottom-3 left-3 flex items-end gap-2">
          <input
            id={`${cfg.name}-file-input`}
            type="file"
            className="hidden"
            accept="application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
            onChange={(e) => {
              const fl = e.target.files;
              if (fl && fl.length) {
                const arr = [];
                for (let i = 0; i < fl.length; i++) arr.push(fl.item(i));
                // Pass normalized array
                onFileAttach(cfg.name, arr);
                e.target.value = ""; // allow reselect same file
              }
            }}
          />
          <button
            type="button"
            onClick={() =>
              document.getElementById(`${cfg.name}-file-input`).click()
            }
            disabled={attachments?.length >= 2}
            // className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 disabled:opacity-50"
            aria-label={`Attach file to ${cfg.label}`}
          >
            <i className="ri-attachment-2 text-gray-600 text-[14px]" />
          </button>
          <span className="text-[10px] text-gray-400 ">
            {attachments?.length || 0}/2
          </span>
        </div>
        <div
          className={`absolute bottom-3 right-3 text-[10px] font-mono ${
            nearLimit ? "text-amber-600" : "text-gray-400"
          }`}
        >
          {length}/{limit}
        </div>
        {error && (
          <div className="absolute -bottom-5 left-0 text-[10px] text-rose-600 font-medium">
            {error}
          </div>
        )}
      </div>
      {/* debug line removed */}
    </div>
  );
}
TextAreaField.propTypes = {
  cfg: PropTypes.shape({
    name: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    rows: PropTypes.number,
    optional: PropTypes.bool,
    max: PropTypes.number.isRequired,
    required: PropTypes.bool,
  }).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  attachments: PropTypes.array,
  onFileAttach: PropTypes.func,
  onFileRemove: PropTypes.func,
  error: PropTypes.string,
};
export default function InputForm({
  caseArguments,
  loading,
  actions,
  attachments,
  attachmentErrors,
}) {
  return (
    <form onSubmit={actions.handleSubmit}>
      <header className="flex items-start justify-between flex-wrap gap-4 bg-white p-2.5 mb-5 rounded-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex w-9 h-9 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 items-center justify-center text-lg shadow-inner ring-1 ring-white/50">
              <i className="ri-shake-hands-line" />
            </span>
            <div>
              <h2 className="font-semibold text-sm text-gray-800 tracking-tight">
                Cross-Examination Analysis
              </h2>
              <p className="text-xs text-gray-500">
                Evaluate adversarial argument strength
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={actions.loadSampleData}
            className="inline-flex items-center gap-1.5  rounded-xl border border-blue-200 bg-blue-50/60 px-6 py-2.5 text-xs font-medium text-blue-700 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:ring-offset-1 transition"
          >
            <i className="ri-file-copy-line" /> Load Sample Data
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-6 py-2.5 text-xs font-medium text-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:ring-offset-1 transition disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Analyze arguments"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-white/90"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-30"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-80"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                <output
                  className="text-xs font-medium tracking-wide"
                  aria-live="polite"
                >
                  Analyzing...
                </output>
                <span className="sr-only" aria-hidden="false">
                  Analyzing arguments
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <i className="ri-scales-3-line" /> Analyze Arguments
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="space-y-3">
        <div className="grid md:grid-cols-2 gap-2">
          {fieldConfigs.slice(0, 2).map((cfg) => (
            <TextAreaField
              key={cfg.name}
              cfg={cfg}
              value={caseArguments[cfg.name]}
              onChange={actions.handleInputChange}
              attachments={attachments?.[cfg.name]}
              onFileAttach={actions.handleFileAttach}
              onFileRemove={actions.handleFileRemove}
              error={attachmentErrors?.[cfg.name]}
            />
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-2">
          {fieldConfigs.slice(2).map((cfg) => (
            <TextAreaField
              key={cfg.name}
              cfg={cfg}
              value={caseArguments[cfg.name]}
              onChange={actions.handleInputChange}
              attachments={attachments?.[cfg.name]}
              onFileAttach={actions.handleFileAttach}
              onFileRemove={actions.handleFileRemove}
              error={attachmentErrors?.[cfg.name]}
            />
          ))}
        </div>
      </div>
    </form>
  );
}

InputForm.propTypes = {
  caseArguments: PropTypes.object.isRequired,
  loading: PropTypes.bool.isRequired,
  actions: PropTypes.shape({
    loadSampleData: PropTypes.func.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    handleInputChange: PropTypes.func.isRequired,
    handleFileAttach: PropTypes.func.isRequired,
    handleFileRemove: PropTypes.func.isRequired,
  }).isRequired,
  attachments: PropTypes.object,
  attachmentErrors: PropTypes.object,
};
