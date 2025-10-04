import React, { useMemo, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import AgreementList from "./AgreementList";
import Tools from "./Tools";
// Inlined from constants.js
const statusColors = {
  "Pending Signature": "bg-yellow-100 text-yellow-800",
  Signed: "bg-green-100 text-green-800",
  "In Review": "bg-blue-100 text-blue-800",
  Completed: "bg-emerald-100 text-emerald-800",
  Rejected: "bg-red-100 text-red-800",
};
import { useListAgreementsQuery } from "../../../reduxstore/services/AgreementsAPI";

// Adapter to map API agreement (snake_case) to UI contract shape (camelCase)
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

const IndexAgreement = () => {
  const { data, isLoading, isError } = useListAgreementsQuery({
    page: 1,
    page_size: 100,
  });
  const contracts = useMemo(
    () => (data?.agreements || []).map(adaptAgreement),
    [data]
  );
  const navigate = useNavigate();
  const location = useLocation();
  const { username } = useParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  // remove modal in favor of route navigation
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("recent"); // recent | oldest | amount-desc | amount-asc | status
  const [caseTypeFilter, setCaseTypeFilter] = useState("all");
  const [advancedFilters, setAdvancedFilters] = useState({
    minAmount: "",
    maxAmount: "",
    hasDocuments: false,
    hasContent: false,
    hasTerms: false,
  });

  const filteredContracts = useMemo(() => {
    const s = search.trim().toLowerCase();
    let arr = contracts.filter((c) => {
      const matchesSearch =
        c.title.toLowerCase().includes(s) ||
        c.client.toLowerCase().includes(s) ||
        c.lawFirm.toLowerCase().includes(s);
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      const matchesType =
        caseTypeFilter === "all" || c.caseType === caseTypeFilter;
      const dateValue = c.effectiveDate || c.filedDate;
      const inFrom =
        !dateFrom || (dateValue && new Date(dateValue) >= new Date(dateFrom));
      const inTo =
        !dateTo || (dateValue && new Date(dateValue) <= new Date(dateTo));
      // amount range
      const amt = Number(c?.amount ?? 0);
      const minOk =
        advancedFilters.minAmount === "" ||
        amt >= Number(advancedFilters.minAmount);
      const maxOk =
        advancedFilters.maxAmount === "" ||
        amt <= Number(advancedFilters.maxAmount);
      // content/docs/terms
      const hasDocs = Array.isArray(c.documents) && c.documents.length > 0;
      const hasCnt =
        typeof c.contractContent === "string" &&
        c.contractContent.trim().length > 0;
      const hasTrm = Array.isArray(c.terms) && c.terms.length > 0;
      const docsOk = !advancedFilters.hasDocuments || hasDocs;
      const contentOk = !advancedFilters.hasContent || hasCnt;
      const termsOk = !advancedFilters.hasTerms || hasTrm;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType &&
        inFrom &&
        inTo &&
        minOk &&
        maxOk &&
        docsOk &&
        contentOk &&
        termsOk
      );
    });
    const getAmount = (x) => Number(x?.amount ?? 0);
    arr.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return (
            new Date(a.filedDate || a.effectiveDate || 0) -
            new Date(b.filedDate || b.effectiveDate || 0)
          );
        case "amount-desc":
          return getAmount(b) - getAmount(a);
        case "amount-asc":
          return getAmount(a) - getAmount(b);
        case "status":
          return (a.status || "").localeCompare(b.status || "");
        case "recent":
        default:
          return (
            new Date(b.filedDate || b.effectiveDate || 0) -
            new Date(a.filedDate || a.effectiveDate || 0)
          );
      }
    });
    return arr;
  }, [
    contracts,
    search,
    statusFilter,
    caseTypeFilter,
    dateFrom,
    dateTo,
    sortBy,
    advancedFilters,
  ]);

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setCaseTypeFilter("all");
    setDateFrom("");
    setDateTo("");
    setSortBy("recent");
    setAdvancedFilters({
      minAmount: "",
      maxAmount: "",
      hasDocuments: false,
      hasContent: false,
      hasTerms: false,
    });
  };

  // KPI metrics
  const kpis = useMemo(() => {
    const total = contracts.length;
    const pending = contracts.filter(
      (c) => c.status === "Pending Signature"
    ).length;
    const signed = contracts.filter((c) => c.status === "Signed").length;
    const upcoming = contracts.filter((c) => {
      const t = c.terminationDate;
      if (!t) return false;
      const diff = (new Date(t).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 30;
    }).length;
    const totalValue = contracts.reduce(
      (sum, c) => sum + (Number(c.amount) || 0),
      0
    );
    return { total, pending, signed, upcoming, totalValue };
  }, [contracts]);

  const handleExportCsv = () => {
    const headers = [
      "id",
      "title",
      "status",
      "client",
      "lawFirm",
      "caseType",
      "amount",
      "currency",
      "effectiveDate",
      "terminationDate",
    ];
    const rows = filteredContracts.map((c) => [
      c.id,
      c.title,
      c.status,
      c.client,
      c.lawFirm,
      c.caseType,
      c.amount ?? "",
      c.currency ?? "",
      c.effectiveDate ?? "",
      c.terminationDate ?? "",
    ]);
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agreements_export_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* const handleAddContract = (formData) => {
    // Construct new contract entity using formData from EditAgreement
    const nextId = contracts.length
      ? Math.max(...contracts.map((c) => c.id)) + 1
      : 1;
    const now = new Date().toISOString();

    const parties = [formData.client, formData.lawFirm].filter(Boolean);
    const termsArr = (formData.terms || "")
      .split("\n")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    const documents = Array.from(formData.documents || []).map((file) => ({
      name: file.name,
      url: "#",
    }));

    const newContract = {
      id: nextId,
      title: formData.title,
      caseType:
        formData.caseType === "Other"
          ? formData.customCaseType
          : formData.caseType,
      filedDate: formData.filedDate || now,
      effectiveDate: formData.effectiveDate || formData.filedDate || now,
      expectedFileDate: formData.expectedFileDate || now,
      lawFirm: formData.lawFirm,
      caseStage: "Drafting",
      client: formData.client,
      clientCNIC: formData.clientCNIC,
      clientAddress: formData.clientAddress,
      contractDuration: formData.contractDuration,
      terminationDate: formData.terminationDate,
      type: formData.caseType,
      status: formData.status,
      amount: Number(formData.amount || 0),
      currency: formData.currency || "PKR",
  // description removed
      parties,
      terms: termsArr,
      documents,
      history: [{ action: "Created", by: "Admin", at: now }],
      contractContent: formData.contractContent,
    };

    setContracts((prev) => [newContract, ...prev]);

    // Notification for client in localStorage (same behavior)
    const notification = {
      id: Date.now(),
      type: "contract",
      title: "New Contract Created",
      message: `A new contract ('${formData.title}') has been created for ${formData.client}.`,
      contractTitle: formData.title,
      lawFirm: formData.lawFirm,
      status: formData.status,
      timestamp: now,
      isRead: false,
      actionRequired: true,
      actionType: "review",
      contractId: `CONT-${Date.now()}`,
    };
    const clientKey = `client_notifications_${(formData.client || "")
      .replace(/\s+/g, "_")
      .toLowerCase()}`;
    try {
      const existing = JSON.parse(localStorage.getItem(clientKey) || "[]");
      localStorage.setItem(
        clientKey,
        JSON.stringify([notification, ...existing])
      );
    } catch {
      // ignore storage issues
    }

  }; */

  return (
    <div>
      {isLoading && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-4">
          Loading agreements…
        </div>
      )}
      {isError && (
        <div className="bg-red-50 rounded-xl p-6 shadow-sm border border-red-100 text-red-700 mb-4">
          Failed to load agreements.
        </div>
      )}
      {/* KPI summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
          <p className="text-xs mb-0.5 text-gray-500">Total Agreements</p>
          <p className="text-xl font-semibold">{kpis.total}</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
          <p className="text-xs mb-0.5 text-gray-500">Pending Signature</p>
          <p className="text-xl font-semibold text-yellow-700">
            {kpis.pending}
          </p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
          <p className="text-xs mb-0.5 text-gray-500">Signed</p>
          <p className="text-xl font-semibold text-green-700">{kpis.signed}</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
          <p className="text-xs mb-0.5 text-gray-500">Expiring in 30d</p>
          <p className="text-xl font-semibold text-blue-700">{kpis.upcoming}</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
          <p className="text-xs mb-0.5 text-gray-500">Total Value</p>
          <p className="text-xl font-semibold">
            {new Intl.NumberFormat("en-PK", {
              style: "currency",
              currency: "PKR",
            }).format(kpis.totalValue)}
          </p>
        </div>
      </div>

      <Tools
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        onAddNew={() => {
          const isUsernameRoute = location.pathname.startsWith("/admin/");
          const baseRoute = isUsernameRoute
            ? `/admin/${username}`
            : "/auth/admin/profile";
          navigate(`${baseRoute}/add-agreement`);
        }}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        caseTypeFilter={caseTypeFilter}
        onCaseTypeChange={setCaseTypeFilter}
        onExport={handleExportCsv}
        onClearFilters={handleClearFilters}
        onAdvancedFiltersChange={setAdvancedFilters}
      />

      <AgreementList
        contracts={filteredContracts}
        onSelect={(contract) => {
          const isUsernameRoute = location.pathname.startsWith("/admin/");
          const baseRoute = isUsernameRoute
            ? `/admin/${username}`
            : "/auth/admin/profile";
          navigate(`${baseRoute}/view-agreement`, { state: { contract } });
        }}
        onEdit={(contract) => {
          const isUsernameRoute = location.pathname.startsWith("/admin/");
          const baseRoute = isUsernameRoute
            ? `/admin/${username}`
            : "/auth/admin/profile";
          navigate(`${baseRoute}/edit-agreement`, { state: { contract } });
        }}
        statusColors={statusColors}
      />

      {/* Creation is now handled by AddAgreement route */}
    </div>
  );
};

export default IndexAgreement;
