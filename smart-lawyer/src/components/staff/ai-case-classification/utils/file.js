// Utility helpers for file handling and lightweight PDF page estimation

export function getTypeFromName(name) {
  const ext = name.split(".").pop().toLowerCase();
  if (ext === "pdf") return "application/pdf";
  // For this feature, only PDFs are allowed. Everything else is unknown.
  return "unknown";
}

export function safeFileName(name) {
  return name.split("/").pop().split("\\").pop();
}

// Helper to get PDF page count - simplified estimation without PDF.js
export async function estimatePdfPageCount(file) {
  try {
    const fileSizeKB = file.size / 1024;
    // Rough estimation: ~100KB per page
    return Math.max(1, Math.round(fileSizeKB / 100));
  } catch (error) {
    console.warn("Error estimating PDF pages:", error?.message || error);
    return 1;
  }
}
