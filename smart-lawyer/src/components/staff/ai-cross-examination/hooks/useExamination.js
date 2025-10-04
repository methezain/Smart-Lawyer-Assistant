import { useState, useCallback, useRef, useEffect } from "react";

export default function useExamination() {
  const [caseArguments, setCaseArguments] = useState({
    petitioner: "",
    respondent: "",
    caseSummary: "",
    relevantLaws: "",
  });
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSample, setShowSample] = useState(false);
  const [attachments, setAttachments] = useState({}); // { fieldName: File[] }
  const [attachmentErrors, setAttachmentErrors] = useState({});
  const modalRef = useRef(null);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setCaseArguments((prev) => ({ ...prev, [name]: value }));
  }, []);

  const loadSampleData = useCallback(() => {
    setCaseArguments({
      petitioner:
        "The plaintiff argues that the defendant breached the contract by failing to deliver the agreed-upon services by the specified deadline. According to the agreement signed on January 15, 2023, all deliverables were to be completed by March 30, 2023. Despite multiple extensions and accommodations, the defendant failed to meet these obligations.",
      respondent:
        "The defendant contends that while there were delays in service delivery, these were caused by factors outside their control, including supply chain disruptions and the plaintiff's multiple change requests that were not part of the original agreement. The defendant also argues that the plaintiff failed to provide necessary information in a timely manner.",
      caseSummary:
        "Contract dispute regarding service delivery timelines and fulfillment of obligations.",
      relevantLaws:
        "Contract Law, Force Majeure provisions, Commercial Code Section 2-615",
    });
    setShowSample(false);
  }, []);

  const simulateAnalysis = useCallback(() => {
    const petitionerPoints = Math.floor(Math.random() * 4) + 3; // 3-6 points
    const respondentPoints = Math.floor(Math.random() * 4) + 2; // 2-5 points

    const mockAnalysis = {
      strongerParty:
        petitionerPoints > respondentPoints ? "Petitioner" : "Respondent",
      analysis: {
        petitioner: {
          strengthScore: petitionerPoints,
          strengths: [
            "Clear establishment of contractual obligations",
            "Documentation of timeline agreements",
            "Evidence of communication attempts",
            "Adherence to notice requirements",
          ].slice(0, petitionerPoints),
          weaknesses: [
            "Ambiguity in certain contract provisions",
            "Limited documentation of damages",
            "Potential contributory delays",
          ].slice(0, Math.floor(Math.random() * 2) + 1),
        },
        respondent: {
          strengthScore: respondentPoints,
          strengths: [
            "Valid force majeure considerations",
            "Documentation of external factors",
            "Evidence of communication about delays",
          ].slice(0, respondentPoints),
          weaknesses: [
            "Insufficient notice of anticipated delays",
            "Limited evidence supporting claims of external factors",
            "Inconsistent communication",
            "Failure to propose realistic alternative timelines",
          ].slice(0, Math.floor(Math.random() * 2) + 2),
        },
        legalAnalysis:
          "The case primarily involves interpretation of contractual obligations and the application of force majeure principles. There are valid points on both sides regarding the interpretation of the contract terms and the reasonableness of delays.",
        conclusion:
          petitionerPoints > respondentPoints
            ? `Based on the analysis of both parties' arguments, the Petitioner presents a stronger case due to better documentation and clearer establishment of contractual breaches. The Respondent's force majeure defense lacks sufficient supporting evidence.`
            : `Based on the analysis of both parties' arguments, the Respondent presents a stronger position due to well-documented external factors affecting performance. The Petitioner's claims are weakened by ambiguities in the contract and potentially contributory actions.`,
      },
      keyIssues: [
        "Interpretation of contract terms regarding timelines",
        "Applicability of force majeure provisions",
        "Sufficiency of notice regarding delays",
        "Determination of damages resulting from delays",
      ],
    };
    setAnalysis(mockAnalysis);
  }, []);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        // Build a FormData payload including text fields and files.
        const formData = new FormData();
        Object.entries(caseArguments).forEach(([key, val]) => {
          formData.append(key, val || "");
        });
        Object.entries(attachments).forEach(([field, files]) => {
          if (files && files.length > 0) {
            files.forEach((file) => formData.append(`${field}_files`, file));
          }
        });
        // For now we just log keys to verify; replace this with real API call.
        console.log("[CrossExamination] Submitting FormData:");
        for (const pair of formData.entries()) {
          console.log(pair[0], pair[1]);
        }
      } catch (err) {
        console.error("Failed to build submission payload", err);
      }
      // Keep existing simulated analysis to preserve UX until backend wired.
      setTimeout(() => {
        simulateAnalysis();
        setLoading(false);
      }, 1200);
    },
    [simulateAnalysis, caseArguments, attachments]
  );

  // Attachment handler
  const attachFiles = useCallback((fieldName, incomingSource) => {
    const MAX_SIZE_MB = 5;
    const ALLOWED_MIME = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    setAttachmentErrors((prev) => ({ ...prev, [fieldName]: undefined }));
    setAttachments((prev) => {
      const current = prev[fieldName] || [];
      // Normalize to array
      let incoming = [];
      if (Array.isArray(incomingSource)) {
        incoming = incomingSource.filter(Boolean);
      } else if (incomingSource && incomingSource.length) {
        for (let i = 0; i < incomingSource.length; i++) {
          const f = incomingSource.item
            ? incomingSource.item(i)
            : incomingSource[i];
          if (f) incoming.push(f);
        }
      }
      const valid = [];
      let errorMsg;
      for (const f of incoming) {
        const lower = f.name.toLowerCase();
        const typeOk =
          ALLOWED_MIME.includes(f.type) ||
          (!f.type && (lower.endsWith(".pdf") || lower.endsWith(".docx")));
        const sizeOk = f.size <= MAX_SIZE_MB * 1024 * 1024;
        if (typeOk && sizeOk) {
          if (!f._uid) {
            Object.defineProperty(f, "_uid", {
              value: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              enumerable: false,
            });
          }
          valid.push(f);
        } else if (!errorMsg) {
          if (!typeOk) errorMsg = "Only PDF or DOCX allowed.";
          else if (!sizeOk) errorMsg = `File too large (> ${MAX_SIZE_MB}MB).`;
        }
      }
      let combined = [...current, ...valid];
      if (combined.length > 2) {
        combined = combined.slice(0, 2);
        setAttachmentErrors((p) => ({
          ...p,
          [fieldName]: "Max 2 files (pdf/docx). Extra ignored.",
        }));
      } else if (!valid.length && incoming.length) {
        setAttachmentErrors((p) => ({
          ...p,
          [fieldName]: errorMsg || "Invalid files.",
        }));
      } else if (errorMsg) {
        setAttachmentErrors((p) => ({ ...p, [fieldName]: errorMsg }));
      }
      return { ...prev, [fieldName]: combined };
    });
  }, []);

  const removeFile = useCallback((fieldName, index) => {
    setAttachments((prev) => {
      const list = [...(prev[fieldName] || [])];
      list.splice(index, 1);
      return { ...prev, [fieldName]: list };
    });
    setAttachmentErrors((prev) => ({ ...prev, [fieldName]: undefined }));
  }, []);

  const closeModal = useCallback(() => setAnalysis(null), []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        closeModal();
      }
    };
    if (analysis) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [analysis, closeModal]);

  return {
    state: {
      caseArguments,
      analysis,
      loading,
      showSample,
      attachments,
      attachmentErrors,
    },
    actions: {
      handleInputChange,
      loadSampleData,
      handleSubmit,
      closeModal,
      setShowSample,
      handleFileAttach: attachFiles,
      handleFileRemove: removeFile,
    },
    refs: { modalRef },
  };
}
