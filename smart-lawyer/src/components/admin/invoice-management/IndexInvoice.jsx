import React, { useMemo, useState } from "react";
import InvoiceTools from "./InvoiceTools";
import InvoiceTable from "./InvoiceTable";
import { useNavigate, useParams } from "react-router-dom";
import {
  useListInvoicesQuery,
  useDeleteInvoiceMutation,
} from "../../../reduxstore/services/InvoicesAPI";

export default function IndexInvoice() {
  const navigate = useNavigate();
  const { username } = useParams();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [deleteInvoice] = useDeleteInvoiceMutation();

  const { data } = useListInvoicesQuery({
    page,
    page_size: pageSize,
    search: search || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  const invoices = useMemo(() => data?.invoices || [], [data]);
  const total = data?.pagination?.total_items || invoices.length;

  // Local helpers (previously from invoiceUtils)
  const statusColors = {
    Unpaid: "bg-yellow-100 text-yellow-800",
    Paid: "bg-green-100 text-green-800",
    Overdue: "bg-red-100 text-red-800",
    "Partially Paid": "bg-blue-100 text-blue-800",
    Cancelled: "bg-gray-100 text-gray-800",
  };
  const formatCurrency = (amount, locale = "en-PK", currency = "PKR") =>
    Number(amount || 0).toLocaleString(locale, { style: "currency", currency });

  const printInvoice = (invoice) => {
    try {
      const escapeHtml = (str = "") =>
        String(str)
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#39;");
      const normalize = (inv = {}) => ({
        id: inv.invoice_no ?? inv.id ?? "",
        contractTitle: inv.contractTitle ?? inv.contract_title ?? "",
        clientName: inv.clientName ?? inv.client_name ?? "",
        amount: inv.amount ?? inv.total_amount ?? 0,
        issuedDate: inv.issuedDate ?? inv.issued_date ?? "",
        dueDate: inv.dueDate ?? inv.due_date ?? "",
        paymentMethod: inv.paymentMethod ?? inv.payment_method ?? "",
        status: inv.status ?? "Unpaid",
        items: inv.items ?? [],
        notes: inv.notes ?? "",
      });
      const inv = normalize(invoice);
      const rows = (inv.items || [])
        .map(
          (it) => `
            <tr>
              <td>${escapeHtml(it.description)}</td>
              <td class="text-right">${formatCurrency(it.amount)}</td>
            </tr>`
        )
        .join("");
      const html = `<!doctype html>
        <html><head><meta charset="utf-8" />
        <style>
          @page { size: A4; margin: 18mm; }
          body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial; color:#111827; }
          .container { max-width: 720px; margin: 0 auto; }
          .header { display:flex; align-items:center; justify-content:space-between; margin-bottom: 24px; }
          .title { font-size: 22px; font-weight: 700; }
          .badge { display:inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight:600; }
          .badge.Unpaid { background:#FEF3C7; color:#92400E; }
          .badge.Paid { background:#DCFCE7; color:#166534; }
          .badge.Overdue { background:#FEE2E2; color:#991B1B; }
          .badge.Partially { background:#DBEAFE; color:#1E40AF; }
          .badge.Cancelled { background:#F3F4F6; color:#374151; }
          .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
          h3 { margin:0 0 6px 0; font-size:12px; text-transform:uppercase; color:#6B7280; letter-spacing: .04em; }
          p { margin:0; font-size:14px; }
          table { width:100%; border-collapse: collapse; margin-top: 8px; }
          thead th { text-align:left; font-size:12px; color:#6B7280; text-transform:uppercase; letter-spacing:.04em; padding: 10px 12px; border-bottom:1px solid #E5E7EB; }
          tbody td { padding: 10px 12px; border-bottom:1px solid #F3F4F6; font-size:14px; }
          .text-right { text-align:right; }
          .total { background:#F9FAFB; font-weight:700; }
          .notes { margin-top:16px; }
          .footer { margin-top:28px; font-size:12px; color:#6B7280; text-align:center; }
        </style></head>
        <body><div class="container">
          <div class="header">
            <div class="title">Invoice #${escapeHtml(inv.id)}</div>
            <span class="badge ${escapeHtml(inv.status)}">${escapeHtml(
        inv.status
      )}</span>
          </div>
          <div style="margin-bottom:14px;">
            <div style="font-size:16px; font-weight:600;">${escapeHtml(
              inv.contractTitle
            )}</div>
            <div style="color:#6B7280;">Billed to: ${escapeHtml(
              inv.clientName
            )}</div>
          </div>
          <div class="grid">
            <div><h3>Issued Date</h3><p>${escapeHtml(inv.issuedDate)}</p></div>
            <div><h3>Due Date</h3><p>${escapeHtml(inv.dueDate)}</p></div>
            <div><h3>Payment Method</h3><p>${escapeHtml(
              inv.paymentMethod || "-"
            )}</p></div>
            <div><h3>Status</h3><p>${escapeHtml(inv.status)}</p></div>
          </div>
          <table><thead><tr><th>Description</th><th class="text-right">Amount</th></tr></thead>
            <tbody>${rows}
              <tr class="total"><td>Total</td><td class="text-right">${formatCurrency(
                inv.amount
              )}</td></tr>
            </tbody>
          </table>
          ${
            inv.notes
              ? `<div class="notes"><h3>Notes</h3><p>${escapeHtml(
                  inv.notes
                )}</p></div>`
              : ""
          }
          <div class="footer">Generated by Smart Lawyer • ${new Date()
            .toISOString()
            .slice(0, 10)}</div>
        </div></body></html>`;
      const iframe = document.createElement("iframe");
      Object.assign(iframe.style, {
        position: "fixed",
        right: "0",
        bottom: "0",
        width: "0",
        height: "0",
        border: "0",
      });
      document.body.appendChild(iframe);
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) throw new Error("Cannot access print document");
      doc.open();
      doc.write(html);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
      }, 250);
    } catch (e) {
      console.error("Failed to print invoice:", e);
    }
  };

  return (
    <div>
      <InvoiceTools
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onAdd={() => navigate(`/admin/${username}/billing/add`)}
      />
      <InvoiceTable
        invoices={invoices}
        formatCurrency={formatCurrency}
        statusColors={statusColors}
        printInvoice={printInvoice}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={(p) => setPage(Math.max(1, p))}
        onPageSizeChange={(n) => {
          setPageSize(n);
          setPage(1);
        }}
        onDelete={async (invoice) => {
          try {
            await deleteInvoice(invoice.id).unwrap();
          } catch (e) {
            console.error("Failed to delete invoice", e);
          }
        }}
        onView={(invoice) =>
          navigate(`/admin/${username}/billing/view/${invoice.id}`)
        }
        onEdit={(invoice) =>
          navigate(`/admin/${username}/billing/edit/${invoice.id}`)
        }
        onDownload={(invoice) => printInvoice(invoice)}
      />
    </div>
  );
}
