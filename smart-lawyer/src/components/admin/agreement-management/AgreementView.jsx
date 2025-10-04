import React, { useMemo, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useGetAgreementQuery } from "../../../reduxstore/services/AgreementsAPI";

const formatDate = (date, locale = "en-PK") =>
  new Date(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const adaptAgreement = (a) => ({
  id: a.id,
  title: a.title,
  caseType: a.case_type,
  filedDate: a.filed_date,
  expectedFileDate: a.expected_file_date,
  effectiveDate: a.effective_date,
  lawFirm: a.law_firm,
  client: a.client,
  clientCNIC: a.client_cnic,
  clientAddress: a.client_address,
  status: a.status,
  amount: a.amount,
  currency: a.currency,
  contractContent: a.contract_content,
  contractDuration: a.contract_duration,
  terminationDate: a.termination_date,
  terms: a.terms || [],
  documents: a.documents || [],
});

const AgreementView = ({ contract: propContract }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { username } = useParams();
  const navContract = location.state?.contract;
  const idFromState = navContract?.id;
  const idFromQuery = location.state?.id;
  const idGuess = idFromState || idFromQuery || null;
  const { data: agreementData } = useGetAgreementQuery(idGuess, {
    skip: !!navContract || !idGuess,
  });
  const contract = useMemo(() => {
    if (propContract) return propContract;
    if (navContract) return navContract;
    if (agreementData) return adaptAgreement(agreementData);
    return null;
  }, [propContract, navContract, agreementData]);

  // Helpers
  const docRef = useRef(null);
  const handlePrint = () => {
    try {
      const node = docRef.current;
      if (!node) {
        window.print();
        return;
      }
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      const headStyles = Array.from(
        document.querySelectorAll('link[rel="stylesheet"], style')
      )
        .map((el) => el.outerHTML)
        .join("\n");
      const printCss = `
        <style>
          @page { size: A4; margin: 20mm; }
          html, body { background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-hidden { display: none !important; }
        </style>
      `;
      doc.open();
      doc.write(
        `<!doctype html><html><head><meta charset="utf-8">${headStyles}${printCss}</head><body>${node.outerHTML}</body></html>`
      );
      doc.close();
      const finish = () => {
        setTimeout(() => {
          if (iframe && iframe.parentNode)
            iframe.parentNode.removeChild(iframe);
        }, 200);
      };
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          // Try to remove after printing
          iframe.contentWindow.addEventListener("afterprint", finish);
          setTimeout(finish, 1500);
        }, 100);
      };
    } catch {
      // Fallback
      window.print();
    }
  };
  const caseTypeDisplay =
    contract?.caseType === "Other" && contract?.customCaseType
      ? contract.customCaseType
      : contract?.caseType;
  const amountFormatted =
    contract && (contract.amount || contract.amount === 0)
      ? new Intl.NumberFormat("en-PK", {
          style: "currency",
          currency: contract.currency || "PKR",
        }).format(Number(contract.amount || 0))
      : "N/A";

  // Opening paragraph helpers
  const locale = contract?.locale || "en-PK";
  const effectiveOrFiledDate = contract?.effectiveDate || contract?.filedDate;
  const dateText = effectiveOrFiledDate
    ? ` on ${formatDate(effectiveOrFiledDate, locale)}`
    : "";
  const firmName = contract?.lawFirm || "N/A";
  const firmRegNo =
    contract?.firmRegNo ||
    contract?.registrationNo ||
    contract?.lawFirmRegNo ||
    contract?.barRegNo ||
    "";
  const barAssoc =
    contract?.barAssociation ||
    contract?.barCouncil ||
    contract?.associatedBar ||
    contract?.bar ||
    "";
  const firmAddress = contract?.lawFirmAddress || "";
  const clientName = contract?.client || "N/A";
  const clientCNIC = contract?.clientCNIC || "";
  const clientAddress = contract?.clientAddress || "";
  const titleText = contract?.title || "Agreement";
  const invocationText = (
    contract?.invocationText ??
    "In the name of Allah, the Most Beneficent, the Most Merciful"
  ).trim();
  const showInvocation =
    contract?.invocationEnabled !== false && invocationText.length > 0;
  const firmParts = [
    firmName,
    firmRegNo ? `bearing Registration No. ${firmRegNo}` : null,
    barAssoc ? `associated with ${barAssoc}` : null,
    firmAddress ? `having its office at ${firmAddress}` : null,
  ].filter(Boolean);
  const clientParts = [
    clientName,
    clientCNIC ? `CNIC ${clientCNIC}` : null,
    clientAddress ? `residing at ${clientAddress}` : null,
  ].filter(Boolean);
  const openingText = `This ${titleText} (the "Agreement") is made and entered into${dateText} by and between ${firmParts.join(
    ", "
  )} (the "Firm") and ${clientParts.join(", ")} (the "Client").`;
  // Additional clause helpers
  const governingLaw = contract?.governingLaw || "laws of Pakistan";
  const jurisdictionText =
    contract?.jurisdiction || contract?.jurisdictionCity || "";
  const jurisdictionClause = jurisdictionText
    ? `the courts at ${jurisdictionText}, Pakistan`
    : "the courts of Pakistan";
  const noticePeriodDays = Number(contract?.noticePeriodDays || 30);

  const goBackToList = () => {
    const isUsernameRoute = location.pathname.startsWith("/admin/");
    const baseRoute = isUsernameRoute
      ? `/admin/${username}`
      : "/auth/admin/profile";
    navigate(`${baseRoute}/contracts`);
  };

  if (!contract) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-amber-800">
          <div className="flex items-center gap-2 font-medium">
            <i className="ri-alert-line"></i>
            No agreement data to display.
          </div>
        </div>
        <button
          onClick={goBackToList}
          className="px-4 py-2 text-xs border border-gray-300 bg-white rounded-lg shadow-sm hover:bg-gray-50"
        >
          Back to Agreements
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <i className="ri-file-text-line"></i>
            Agreement
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={goBackToList}
              className="px-3 py-1.5 text-xs border border-gray-300 bg-white rounded-lg shadow-sm hover:bg-gray-50"
            >
              <i className="ri-arrow-left-line mr-1"></i>
              Back
            </button>
            <button
              onClick={() =>
                navigate(
                  location.pathname.replace(
                    "/view-agreement",
                    "/edit-agreement"
                  ),
                  { state: { contract } }
                )
              }
              className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm"
            >
              <i className="ri-edit-2-line mr-1"></i>
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Document (word-like) */}
      <div
        ref={docRef}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm print:shadow-none print:border-0 print:rounded-none"
      >
        <div className="max-w-3xl mx-auto px-8 py-10 print:p-8 relative">
          {/* Realistic corner brand seal (PNG center + circular text) */}

          {/* Light diagonal watermark */}
          <div className="pointer-events-none select-none absolute inset-0 flex items-center justify-center z-0">
            <div className="text-6xl md:text-7xl font-black tracking-widest text-gray-900/5 print:text-gray-900/10 rotate-[-30deg]">
              SMARTLAWYER.AI
            </div>
          </div>

          <div className="relative z-10">
            <div className=" flex items-center justify-center">
              <div className="mb-6" title="SmartLawyer">
                <div className="rotate-[-12deg]" aria-hidden="true">
                  <svg
                    width="120"
                    height="120"
                    viewBox="0 0 140 140"
                    xmlns="http://www.w3.org/2000/svg"
                    className="opacity-90"
                  >
                    <defs>
                      {/* Path for the circular text */}
                      <path
                        id="sl-textpath"
                        d="M70,70 m-52,0 a52,52 0 1,1 104,0 a52,52 0 1,1 -104,0"
                      />
                      {/* Clip for the center image */}
                      <clipPath id="sl-img-clip">
                        <circle cx="70" cy="70" r="26" />
                      </clipPath>
                      {/* Roughen filter for stamp edges */}
                      <filter
                        id="sl-rough"
                        x="-20%"
                        y="-20%"
                        width="140%"
                        height="140%"
                      >
                        <feTurbulence
                          type="fractalNoise"
                          baseFrequency="0.9"
                          numOctaves="2"
                          seed="3"
                          result="noise"
                        />
                        <feDisplacementMap
                          in="SourceGraphic"
                          in2="noise"
                          scale="1.2"
                          xChannelSelector="R"
                          yChannelSelector="G"
                        />
                      </filter>
                    </defs>
                    {/* Faint outer rings */}
                    <g stroke="#065f46" fill="none" filter="url(#sl-rough)">
                      <circle
                        cx="70"
                        cy="70"
                        r="60"
                        strokeWidth="3"
                        opacity="0.25"
                      />
                      <circle
                        cx="70"
                        cy="70"
                        r="60"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                        opacity="0.35"
                      />
                    </g>
                    {/* Circular text */}
                    <g
                      fill="#065f46"
                      fontSize="10"
                      fontWeight="700"
                      letterSpacing="1"
                      filter="url(#sl-rough)"
                    >
                      <text>
                        <textPath
                          xlinkHref="#sl-textpath"
                          startOffset="0%"
                          textAnchor="start"
                          dominantBaseline="middle"
                        >
                          VERIFIED • SMARTLAWYER • VERIFIED • SMARTLAWYER •
                        </textPath>
                      </text>
                    </g>
                    {/* Center tint */}
                    <circle
                      cx="70"
                      cy="70"
                      r="32"
                      fill="#05966911"
                      stroke="#059669"
                      strokeWidth="0.5"
                      opacity="0.8"
                    />
                    {/* Center image (dummy PNG) */}
                    <image
                      href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
                      x="44"
                      y="44"
                      width="52"
                      height="52"
                      clipPath="url(#sl-img-clip)"
                      preserveAspectRatio="xMidYMid slice"
                      style={{ filter: "grayscale(1) contrast(1.1)" }}
                    />
                  </svg>
                </div>
              </div>
            </div>
            {/* Title */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
                {contract.title || "Agreement"}
              </h2>
            </div>

            {/* Opening / Preamble */}
            <section className="mb-8">
              {/* <h3 className="text-sm font-semibold text-gray-800 mb-3">
                Preamble
              </h3> */}
              <div>
                {showInvocation && (
                  <p className="text-center text-[12px] text-gray-500 italic mb-3">
                    {invocationText}
                  </p>
                )}
                <p className="text-sm text-gray-700 leading-relaxed text-center">
                  {openingText}
                </p>
              </div>
            </section>

            {/* Parties */}
            <section className="mb-8">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Parties
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                {/* Firm details */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                    Firm
                  </h4>
                  <div className="space-y-1.5">
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Name</span>
                      <span className="font-medium text-right">
                        {firmName || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Registration No.</span>
                      <span className="font-medium text-right">
                        {firmRegNo || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Bar Association</span>
                      <span className="font-medium text-right">
                        {barAssoc || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Client details */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                    Client
                  </h4>
                  <div className="space-y-1.5">
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Name</span>
                      <span className="font-medium text-right">
                        {clientName || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">CNIC</span>
                      <span className="font-medium text-right">
                        {clientCNIC || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Address</span>
                      <span
                        className="font-medium text-right max-w-[60%] truncate"
                        title={clientAddress || "N/A"}
                      >
                        {clientAddress || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Agreement Details (time & duration) */}
            <section className="mb-8">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Agreement Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Effective Date</span>
                  <span className="font-medium">
                    {contract.effectiveDate
                      ? formatDate(contract.effectiveDate)
                      : contract.filedDate
                      ? formatDate(contract.filedDate)
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Termination Date</span>
                  <span className="font-medium">
                    {contract.terminationDate
                      ? formatDate(contract.terminationDate)
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Duration</span>
                  <span className="font-medium">
                    {contract.contractDuration
                      ? `${contract.contractDuration} months`
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-medium">{amountFormatted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Case Type</span>
                  <span className="font-medium">
                    {caseTypeDisplay || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className="font-medium">
                    {contract.status || "N/A"}
                  </span>
                </div>
                {contract.reference ? (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Reference No.</span>
                    <span className="font-medium">{contract.reference}</span>
                  </div>
                ) : null}
              </div>
            </section>

            {/* Contract Content (replaces removed Description) */}
            <section className="mb-8">
              <h3 className="text-sm mb-2 font-semibold text-gray-900">
                Contract Content
              </h3>
              {contract.contractContent && contract.contractContent.trim() ? (
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {contract.contractContent}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  No contract content provided.
                </p>
              )}
            </section>

            {/* Terms & Conditions */}
            <section>
              <h3 className="text-sm mb-2 font-semibold text-gray-900">
                Terms & Conditions
              </h3>
              {contract.terms && contract.terms.length > 0 ? (
                <ol className="list-decimal ml-5 space-y-1.5 text-sm text-gray-700">
                  {contract.terms.map((term, idx) => (
                    <li key={idx}>{term}</li>
                  ))}
                </ol>
              ) : (
                <p className="text-gray-500 text-sm">
                  No terms and conditions specified.
                </p>
              )}
            </section>

            {/* Standard Clauses */}
            <section className="my-8">
              <h3 className="text-sm mb-2 font-semibold text-gray-900">
                Standard Clauses
              </h3>
              <ol className="list-decimal ml-5 space-y-1.5 text-sm text-gray-700">
                <li>
                  Scope of Services: The Firm will provide legal services
                  related to {caseTypeDisplay || "the matter"} as mutually
                  agreed in writing.
                </li>
                <li>
                  Fees: Unless otherwise agreed, the Client shall pay{" "}
                  {amountFormatted !== "N/A"
                    ? amountFormatted
                    : "the agreed amount"}{" "}
                  for professional services. Out-of-pocket expenses (e.g., court
                  fees, stamp duties, notarization, courier) will be billed
                  separately.
                </li>
                <li>
                  Confidentiality: Both parties shall keep confidential all
                  non-public information disclosed in connection with this
                  engagement, except as required by law or with prior written
                  consent.
                </li>
                <li>
                  Client Cooperation: The Client agrees to provide accurate and
                  complete information and to respond promptly to reasonable
                  requests necessary for the Firm to perform the services.
                </li>
                <li>
                  Notices: All notices must be in writing and shall be deemed
                  given when delivered to the following addresses, or to updated
                  addresses notified in writing: Firm Address:{" "}
                  {firmAddress || "N/A"}; Client Address:{" "}
                  {clientAddress || "N/A"}. Where required, the parties shall
                  provide at least {noticePeriodDays} days’ prior written
                  notice.
                </li>
                <li>
                  Termination: Either party may terminate this Agreement by
                  giving {noticePeriodDays}-day written notice. Fees and
                  expenses incurred up to the effective date of termination
                  shall remain payable.
                </li>
                <li>
                  Governing Law & Jurisdiction: This Agreement shall be governed
                  by the {governingLaw}. The parties submit to the exclusive
                  jurisdiction of {jurisdictionClause}.
                </li>
                <li>
                  Entire Agreement; Amendments: This document constitutes the
                  entire agreement between the parties concerning the subject
                  matter and supersedes all prior discussions and
                  understandings. Any amendment must be in writing and signed by
                  both parties.
                </li>
              </ol>
            </section>

            {/* Signatures */}
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Signatures
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Please sign inside the boxes. Fill in the date and CNIC/ID.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Firm */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-[1fr_auto] gap-4 items-end">
                    {/* Sign area */}
                    <div>
                      <div className="h-24 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center bg-white">
                        <span className="text-[11px] text-gray-400">
                          Sign here
                        </span>
                      </div>
                      <div className="mt-2 border-b border-gray-400"></div>
                      <p className="text-[11px] text-gray-500">Signature</p>
                    </div>
                    {/* Stamp area */}
                    <div className="w-28 h-20 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center">
                      <span className="text-[10px] uppercase tracking-wide text-gray-400">
                        Stamp
                      </span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-900">
                      For: {contract.lawFirm || "N/A"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Authorized Signatory
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-4 text-xs text-gray-700">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Date:</span>
                        <span className="flex-1 border-b border-gray-400 block"></span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Reg No:</span>
                        <span className="flex-1 border-b border-gray-400 block"></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Client */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div>
                    <div className="h-24 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center bg-white">
                      <span className="text-[11px] text-gray-400">
                        Sign here
                      </span>
                    </div>
                    <div className="mt-2 border-b border-gray-400"></div>
                    <p className="text-[11px] text-gray-500">Signature</p>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-900">
                      For: {contract.client || "N/A"}
                    </p>
                    <p className="text-xs text-gray-500">Client</p>
                    <div className="mt-3 grid grid-cols-2 gap-4 text-xs text-gray-700">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Date:</span>
                        <span className="flex-1 border-b border-gray-400 block"></span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">CNIC:</span>
                        <span className="flex-1 border-b border-gray-400 block">
                          {contract.clientCNIC ? "" : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            {/* Footer brand line */}
            <div className="mt-10 pt-4 border-t border-gray-100 text-center space-y-1">
              <p className="text-[11px] text-gray-600">
                Prepared by {firmName || "N/A"} • For {clientName || "N/A"}
              </p>
              <p className="text-[11px] text-gray-500">
                {contract.reference
                  ? `Reference: ${contract.reference} • `
                  : ""}
                Generated on {formatDate(Date.now(), locale)} • smartlawyer.ai
              </p>
              <p className="text-[10px] text-gray-400">
                Confidential: This document is intended solely for the parties
                named above and may contain privileged information.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white/80 backdrop-blur rounded-xl border border-gray-200 p-3 flex items-center justify-between gap-3 shadow-sm print:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="text-gray-600 hover:text-gray-800 px-3 py-1.5 rounded flex items-center gap-2 text-xs"
          >
            <i className="ri-printer-line"></i> Print
          </button>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm">
            <i className="ri-quill-pen-line mr-1"></i>
            Sign as Firm
          </button>
          <button className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm">
            <i className="ri-send-plane-line mr-1"></i>
            Send to Client for Signature
          </button>
          <button
            className="px-3 py-1.5 text-xs border border-gray-300 bg-white rounded-lg shadow-sm hover:bg-gray-50"
            onClick={goBackToList}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgreementView;
