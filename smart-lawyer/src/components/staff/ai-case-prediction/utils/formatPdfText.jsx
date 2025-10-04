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
  const listKey = `ul-${keyRef.current++}`;
  nodes.push(
    <ul
      key={listKey}
      className="mb-3 list-disc list-outside pl-5 space-y-1 text-[13px] text-gray-700"
    >
      {listItems.map((li, i) => (
        <li key={`${listKey}-li-${i}`}>{li}</li>
      ))}
    </ul>
  );
  listItems.length = 0;
}

export default function formatPdfText(raw) {
  if (!raw) return null;
  const cleaned = raw.replace(/^=== FILE:.*?===\s*/i, "").replace(/\r/g, "");
  const lines = cleaned.split(/\n+/);

  const nodes = [];
  const paragraphBuffer = [];
  const listBuffer = [];
  let headingCount = 0;
  const keyRef = { current: 0 };

  function sizeClassFor(level) {
    if (level === "h1") return "text-base";
    if (level === "h2") return "text-sm";
    return "text-xs";
  }

  function pushHeading(line) {
    const level = classifyHeadingLevel(line, headingCount++);
    const Tag = level;
    nodes.push(
      <Tag
        key={`h-${keyRef.current++}`}
        className={`${sizeClassFor(
          level
        )} font-semibold mt-6 mb-2 tracking-wide text-gray-800`}
      >
        {line.replace(/:$/, "")}
      </Tag>
    );
  }

  const isListLine = (ln) => /^(\d+\.|[-•*])\s+/.test(ln);

  for (const originalLine of lines) {
    const line = originalLine.trim();
    if (!line) {
      finalizeParagraph(paragraphBuffer, nodes, keyRef);
      finalizeList(listBuffer, nodes, keyRef);
      continue;
    }

    if (isListLine(line)) {
      finalizeParagraph(paragraphBuffer, nodes, keyRef);
      listBuffer.push(line.replace(/^(\d+\.|[-•*])\s+/, "").trim());
      continue;
    }
    if (listBuffer.length && !isListLine(line)) {
      finalizeList(listBuffer, nodes, keyRef);
    }

    if (looksLikeHeading(line)) {
      finalizeParagraph(paragraphBuffer, nodes, keyRef);
      finalizeList(listBuffer, nodes, keyRef);
      pushHeading(line);
      continue;
    }

    paragraphBuffer.push(line);
  }

  finalizeParagraph(paragraphBuffer, nodes, keyRef);
  finalizeList(listBuffer, nodes, keyRef);
  return nodes;
}
