// Heuristic PDF text formatter
// Attempts to reconstruct basic structure (headings, paragraphs, lists) from raw OCR text.
// NOTE: This is best-effort and may not perfectly reflect original layout.

import React from "react";

function isAllCaps(line) {
  const letters = line.replace(/[^A-Za-z]/g, "");
  if (letters.length < 3) return false;
  return letters === letters.toUpperCase();
}

function looksLikeHeading(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (isAllCaps(trimmed)) return true;
  if (/^(Section|Article|Chapter)\b/i.test(trimmed)) return true;
  if (
    /^[A-Z][A-Za-z0-9 ,.()-]{0,60}$/.test(trimmed) &&
    /:\s*$/.test(trimmed) === false &&
    trimmed.split(" ").length <= 10
  )
    return true;
  return false;
}

function classifyHeadingLevel(line, headingIndex) {
  if (headingIndex === 0) return "h1";
  if (/^(Chapter|Article)\b/i.test(line)) return "h2";
  if (line.length < 25) return "h2";
  return "h3";
}

function finalizeParagraph(buffer, nodes, keyRef) {
  if (!buffer.length) return;
  const text = buffer.join(" ").replace(/\s+/g, " ").trim();
  if (text) {
    nodes.push(
      <p
        key={`p-${keyRef.current++}`}
        className="mb-3 leading-relaxed text-[13px] text-gray-700"
      >
        {text}
      </p>
    );
  }
  buffer.length = 0;
}

function finalizeList(listItems, nodes, keyRef) {
  if (!listItems.length) return;
  nodes.push(
    <ul
      key={`ul-${keyRef.current++}`}
      className="mb-3 list-disc list-outside pl-5 space-y-1 text-[13px] text-gray-700"
    >
      {listItems.map((li, i) => (
        <li key={`li-${keyRef.current}-${i}`}>{li}</li>
      ))}
    </ul>
  );
  listItems.length = 0;
}

export default function formatPdfText(raw) {
  if (!raw) return null;
  // Remove file marker lines like === FILE: name ===
  const cleaned = raw.replace(/^=== FILE:.*?===\s*/i, "").replace(/\r/g, "");
  const lines = cleaned.split(/\n+/);

  const nodes = [];
  const paragraphBuffer = [];
  const listBuffer = [];
  let headingCount = 0;
  const keyRef = { current: 0 };

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) {
      finalizeParagraph(paragraphBuffer, nodes, keyRef);
      finalizeList(listBuffer, nodes, keyRef);
      continue;
    }

    // List detection
    if (/^(\d+\.|[-•*])\s+/.test(line)) {
      finalizeParagraph(paragraphBuffer, nodes, keyRef);
      const item = line.replace(/^(\d+\.|[-•*])\s+/, "").trim();
      listBuffer.push(item);
      continue;
    } else if (listBuffer.length) {
      // Close list if sequence ended
      finalizeList(listBuffer, nodes, keyRef);
    }

    // Heading detection
    if (looksLikeHeading(line)) {
      finalizeParagraph(paragraphBuffer, nodes, keyRef);
      finalizeList(listBuffer, nodes, keyRef);
      const level = classifyHeadingLevel(line, headingCount++);
      const Tag = level;
      nodes.push(
        <Tag
          key={`h-${keyRef.current++}`}
          className={`${
            level === "h1"
              ? "text-base"
              : level === "h2"
              ? "text-sm"
              : "text-xs"
          } font-semibold mt-6 mb-2 tracking-wide text-gray-800`}
        >
          {line.replace(/:$/, "")}
        </Tag>
      );
      continue;
    }

    // Accumulate paragraph lines, attempt to detect hard-wrapped lines: join if no sentence end
    paragraphBuffer.push(line);
  }

  finalizeParagraph(paragraphBuffer, nodes, keyRef);
  finalizeList(listBuffer, nodes, keyRef);

  return nodes;
}
