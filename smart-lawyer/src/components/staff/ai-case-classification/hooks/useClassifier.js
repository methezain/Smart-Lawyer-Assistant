import { useCallback } from "react";
import { useSelector } from "react-redux";
import { useClassifyPdfMutation } from "../../../../reduxstore/services/ClassificationAPI";
import { safeFileName, getTypeFromName } from "../utils/file";

export function useClassifier({
  files,
  replaceFileProps,
  processingFiles,
  setProcessingFiles,
}) {
  const [classifyPdf] = useClassifyPdfMutation();
  const user = useSelector((state) => state?.auth?.user);

  const handleClassify = useCallback(
    async (fileId) => {
      if (processingFiles.has(fileId)) return;

      let isMounted = true;
      try {
        setProcessingFiles((prev) => new Set(prev).add(fileId));
        const file = files.find((f) => f.id === fileId);
        if (!file?.fileObject) {
          console.error("File not found or missing file object");
          return;
        }

        // Enforce PDF-only classification
        const fType =
          file.fileObject.type || getTypeFromName(file.fileObject.name);
        if (fType !== "application/pdf") {
          if (isMounted) {
            replaceFileProps(fileId, {
              status: "failed",
              class: "Only PDF allowed",
            });
          }
          return;
        }

        if (isMounted) {
          replaceFileProps(fileId, { status: "processing" });
        }

        const formData = new FormData();
        const cleanFile = new File(
          [file.fileObject],
          safeFileName(file.fileObject.name),
          {
            type: fType,
          }
        );
        formData.append("file", cleanFile);

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), 30000)
        );

        // Pull firm/lawyer context from Redux (authoritative source)
        const firmId = user?.firmId ?? user?.firm_id ?? null;
        const firmName = user?.firmName || user?.userDetails?.firm_name || null;
        const lawyerId = user?.id ?? user?.user_id ?? null;
        const lawyerName =
          [user?.userDetails?.first_name, user?.userDetails?.last_name]
            .filter(Boolean)
            .join(" ") ||
          user?.username ||
          null;

        if (!firmId || !lawyerId) {
          throw new Error("Missing firm or user identity");
        }

        const result = await Promise.race([
          classifyPdf({
            formData,
            firmId,
            lawyerId,
            firmName,
            lawyerName,
          }).unwrap(),
          timeoutPromise,
        ]);

        if (isMounted) {
          replaceFileProps(fileId, {
            class: result?.category || "Unknown",
            status: "completed",
            fileObject: null,
          });
        }
      } catch (error) {
        console.error("Classification error:", error);
        const errorMessage =
          error?.data?.message || error?.error || error?.message || "Error";
        if (isMounted) {
          replaceFileProps(fileId, {
            status: "failed",
            class: errorMessage.length > 20 ? "Error" : errorMessage,
            fileObject: null,
          });
        }
      } finally {
        setProcessingFiles((prev) => {
          const next = new Set(prev);
          next.delete(fileId);
          return next;
        });
      }

      return () => {
        isMounted = false;
      };
    },
    [
      files,
      classifyPdf,
      processingFiles,
      replaceFileProps,
      setProcessingFiles,
      user,
    ]
  );

  return { handleClassify };
}
