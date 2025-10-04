import React from "react";
import useExamination from "./hooks/useExamination";
import InputForm from "./components/InputForm";
import AnalysisModal from "./components/AnalysisModal";

export default function ExaminationContainer() {
  const { state, actions, refs } = useExamination();
  const { caseArguments, analysis, loading, attachments, attachmentErrors } =
    state;
  return (
    <>
      <InputForm
        caseArguments={caseArguments}
        loading={loading}
        actions={actions}
        attachments={attachments}
        attachmentErrors={attachmentErrors}
      />
      {analysis && (
        <AnalysisModal
          ref={refs.modalRef}
          analysis={analysis}
          caseArguments={caseArguments}
          onClose={actions.closeModal}
        />
      )}
    </>
  );
}
