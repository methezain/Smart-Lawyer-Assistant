import React, { useMemo, useState } from "react";
import { useListAgreementsQuery } from "../../../reduxstore/services/AgreementsAPI";
import { useNavigate, useParams } from "react-router-dom";
import { useCreateInvoiceMutation } from "../../../reduxstore/services/InvoicesAPI";

export default function AddInvoice() {
  const formatCurrency = (amount, locale = "en-PK", currency = "PKR") =>
    Number(amount || 0).toLocaleString(locale, { style: "currency", currency });
  const navigate = useNavigate();
  const { username } = useParams();

  const { data: agreementsResp } = useListAgreementsQuery({
    page: 1,
    page_size: 100,
  });
  const agreements = useMemo(
    () => agreementsResp?.agreements || [],
    [agreementsResp]
  );
  const mkKey = () =>
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const [items, setItems] = useState([
    { description: "", amount: "", _key: mkKey() },
  ]);
  const [formData, setFormData] = useState({
    contractId: "",
    contractTitle: "",
    clientName: "",
    issuedDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    status: "Unpaid",
    paymentMethod: "Bank Transfer",
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [createInvoice, { isLoading: creating }] = useCreateInvoiceMutation();

  const selectedAgreement = useMemo(() => {
    const id = parseInt(formData.contractId);
    return agreements.find((a) => a.id === id);
  }, [agreements, formData.contractId]);

  const previouslyInvoicedTotal = 0; // backend will compute in real system

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleItemChange = (i, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[i][field] = value;
      return next;
    });
  };

  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { description: "", amount: "", _key: mkKey() },
    ]);
  const removeItem = (i) =>
    setItems((prev) =>
      prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i)
    );

  const total = items.reduce((s, it) => s + Number(it.amount || 0), 0);
  const agreementAmount = Number(selectedAgreement?.amount || 0);

  const validate = () => {
    const errs = {};
    if (!formData.contractId) errs.contractId = "Contract is required";
    if (!formData.clientName?.trim())
      errs.clientName = "Client name is required";
    if (!formData.issuedDate) errs.issuedDate = "Issued date is required";
    if (!formData.dueDate) errs.dueDate = "Due date is required";
    if (!formData.status) errs.status = "Status is required";
    const hasValidItem = items.some(
      (it) =>
        it.description && String(it.description).trim() && Number(it.amount) > 0
    );
    if (!hasValidItem)
      errs.items = "Add at least one item with description and positive amount";
    if (total <= 0) errs.total = "Total must be greater than 0";
    if (
      selectedAgreement &&
      previouslyInvoicedTotal + total > agreementAmount
    ) {
      const remaining = Math.max(0, agreementAmount - previouslyInvoicedTotal);
      errs.limit = `Invoice exceeds agreement amount. Remaining: ${formatCurrency(
        remaining
      )} of ${formatCurrency(agreementAmount)}`;
    }
    return errs;
  };

  const save = async (e) => {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    const payload = {
      agreement_id: parseInt(formData.contractId),
      client_name: formData.clientName,
      contract_title: formData.contractTitle,
      issued_date: formData.issuedDate,
      due_date: formData.dueDate,
      status: formData.status,
      payment_method: formData.paymentMethod,
      notes: formData.notes,
      items: items
        .filter((it) => it.description && Number(it.amount) > 0)
        .map((it) => ({
          description: it.description,
          amount: Number(it.amount),
        })),
    };
    try {
      await createInvoice(payload).unwrap();
      navigate(`/admin/${username}/billing`, {
        state: { toast: "Invoice created" },
      });
    } catch (err) {
      setErrors({ api: err?.data?.detail || "Failed to create invoice" });
    }
  };

  return (
    <div className="space-y-4">
      {/* Error summary */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl shadow-sm">
          <p className="font-medium flex items-center">
            <i className="ri-error-warning-line mr-2" aria-hidden="true"></i>
            <span>Please fix the following errors:</span>
          </p>
          <ul className="list-disc ml-5 mt-1 text-xs">
            {Object.values(errors).map((err) => (
              <li key={String(err)}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Form */}
        <form onSubmit={save} className="lg:col-span-2 space-y-4">
          {/* Gradient header like AddAgreement */}
          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-3">
            <h1 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
              <i className="ri-bill-line" aria-hidden="true"></i>
              <span>Create New Invoice</span>
            </h1>
          </div>

          {/* Basic Invoice Details */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <i
                className="ri-file-text-line text-emerald-600"
                aria-hidden="true"
              ></i>
              <h3 className="font-semibold">Basic Invoice Details</h3>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label
                  htmlFor="contractId"
                  className="block text-xs font-medium text-gray-700"
                >
                  Contract <span className="text-red-500">*</span>
                </label>
                <select
                  name="contractId"
                  id="contractId"
                  value={formData.contractId}
                  onChange={(e) => {
                    const selected = e.target.value;
                    const ag = agreements.find(
                      (a) => a.id === parseInt(selected)
                    );
                    setFormData((prev) => ({
                      ...prev,
                      contractId: selected,
                      contractTitle: ag?.title || "",
                      clientName: ag?.client || "",
                    }));
                  }}
                  className={`w-full border ${
                    errors.contractId ? "border-red-300" : "border-gray-300"
                  } rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm`}
                >
                  <option value="">Select Contract</option>
                  {agreements.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title}
                    </option>
                  ))}
                </select>
                {errors.contractId && (
                  <p className="text-xs text-red-600">{errors.contractId}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="clientName"
                  className="block text-xs font-medium text-gray-700"
                >
                  Client Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="clientName"
                  id="clientName"
                  value={formData.clientName}
                  onChange={handleChange}
                  className={`w-full border ${
                    errors.clientName ? "border-red-300" : "border-gray-300"
                  } rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm`}
                  placeholder="Client name"
                />
                {errors.clientName && (
                  <p className="text-xs text-red-600">{errors.clientName}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="issuedDate"
                  className="block text-xs font-medium text-gray-700"
                >
                  Issued Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="issuedDate"
                  id="issuedDate"
                  value={formData.issuedDate}
                  onChange={handleChange}
                  className={`w-full border ${
                    errors.issuedDate ? "border-red-300" : "border-gray-300"
                  } rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm`}
                />
                {errors.issuedDate && (
                  <p className="text-xs text-red-600">{errors.issuedDate}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="dueDate"
                  className="block text-xs font-medium text-gray-700"
                >
                  Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="dueDate"
                  id="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className={`w-full border ${
                    errors.dueDate ? "border-red-300" : "border-gray-300"
                  } rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm`}
                />
                {errors.dueDate && (
                  <p className="text-xs text-red-600">{errors.dueDate}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="status"
                  className="block text-xs font-medium text-gray-700"
                >
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  id="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={`w-full border ${
                    errors.status ? "border-red-300" : "border-gray-300"
                  } rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm`}
                >
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                {errors.status && (
                  <p className="text-xs text-red-600">{errors.status}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="paymentMethod"
                  className="block text-xs font-medium text-gray-700"
                >
                  Payment Method
                </label>
                <select
                  name="paymentMethod"
                  id="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Online">Online Payment</option>
                </select>
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <i
                  className="ri-price-tag-3-line text-emerald-600"
                  aria-hidden="true"
                ></i>
                <h3 className="font-semibold">Invoice Items</h3>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="text-xs text-emerald-600 hover:text-emerald-800"
              >
                <i className="ri-add-line" aria-hidden="true"></i>{" "}
                <span>Add Item</span>
              </button>
            </div>
            <div className="p-0">
              <div className="border-t">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-2 text-left text-[11px] font-medium text-gray-500 uppercase">
                        Description
                      </th>
                      <th className="px-6 py-2 text-left text-[11px] font-medium text-gray-500 uppercase">
                        Amount (PKR)
                      </th>
                      <th className="px-6 py-2 text-left text-[11px] font-medium text-gray-500 uppercase w-10">
                        Delete
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-xs">
                    {items.map((item) => (
                      <tr key={item._key}>
                        <td className="px-6 py-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) =>
                              handleItemChange(
                                items.findIndex((it) => it._key === item._key),
                                "description",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border-0 rounded-lg focus:ring-0"
                            placeholder="Item description"
                          />
                        </td>
                        <td className="px-6 py-2">
                          <input
                            type="number"
                            value={item.amount}
                            onChange={(e) =>
                              handleItemChange(
                                items.findIndex((it) => it._key === item._key),
                                "amount",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border-0 rounded-lg focus:ring-0"
                            placeholder="Amount"
                          />
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              removeItem(
                                items.findIndex((it) => it._key === item._key)
                              )
                            }
                            className="text-red-500 hover:text-red-700"
                            disabled={items.length === 1}
                            title="Remove"
                          >
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-semibold">
                      <td className="px-6 py-3 text-right">Total:</td>
                      <td className="px-6 py-3">{formatCurrency(total)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {(errors.items || errors.total || errors.limit) && (
                <div className="px-4 py-2">
                  {errors.items && (
                    <p className="text-xs text-red-600">{errors.items}</p>
                  )}
                  {errors.total && (
                    <p className="text-xs text-red-600">{errors.total}</p>
                  )}
                  {errors.limit && (
                    <p className="text-xs text-red-600">{errors.limit}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <i
                className="ri-file-text-line text-emerald-600"
                aria-hidden="true"
              ></i>
              <h3 className="font-semibold">Notes</h3>
            </div>
            <div className="p-4">
              <label
                htmlFor="notes"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                Notes
              </label>
              <textarea
                name="notes"
                id="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                placeholder="Add any notes or payment instructions..."
              ></textarea>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-2 bg-white/80 backdrop-blur rounded-xl border border-gray-200 p-3 flex items-center justify-end gap-3 shadow-sm">
            <button
              type="button"
              onClick={() => navigate(`/admin/${username}/billing`)}
              className="px-4 py-2 text-xs border border-gray-300 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors flex items-center"
            >
              <i className="ri-close-line mr-1" aria-hidden="true"></i>
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              disabled={creating}
              className={`px-4 py-2 text-xs text-white rounded-lg shadow-sm transition-colors flex items-center ${
                creating
                  ? "bg-emerald-400 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              <i className="ri-file-add-line mr-1" aria-hidden="true"></i>
              <span>{creating ? "Creating..." : "Create Invoice"}</span>
            </button>
          </div>
        </form>

        {/* Aside */}
        <aside className="space-y-4 lg:sticky lg:top-0 lg:self-start">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <i
                className="ri-information-line text-emerald-600"
                aria-hidden="true"
              ></i>
              <h3 className="font-semibold">Guidelines</h3>
            </div>
            <div className="p-4 text-xs text-gray-700 space-y-2">
              <div className="flex items-start gap-2">
                <i
                  className="ri-asterisk text-gray-400 mt-0.5"
                  aria-hidden="true"
                ></i>
                <span>
                  Required: Contract, Client name, Issued/Due dates, Status, and
                  at least one item with amount.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <i
                  className="ri-calendar-line text-gray-400 mt-0.5"
                  aria-hidden="true"
                ></i>
                <span>
                  Due Date is the last date for payment; update Status
                  accordingly (e.g., Unpaid, Paid).
                </span>
              </div>
              <div className="flex items-start gap-2">
                <i
                  className="ri-price-tag-3-line text-gray-400 mt-0.5"
                  aria-hidden="true"
                ></i>
                <span>
                  Keep items clear and granular; the total updates
                  automatically.
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <i
                className="ri-eye-line text-emerald-600"
                aria-hidden="true"
              ></i>
              <h3 className="font-semibold">Quick Preview</h3>
            </div>
            <div className="p-4 pb-2.5 text-xs text-gray-700 space-y-2">
              <div className="flex items-center gap-2">
                <i
                  className="ri-file-text-line text-gray-400"
                  aria-hidden="true"
                ></i>
                <span className="font-medium truncate">
                  {formData.contractTitle || "Contract Title"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <i
                  className="ri-user-line text-gray-400"
                  aria-hidden="true"
                ></i>
                <span className="truncate">
                  {formData.clientName || "Client"}
                </span>
              </div>
              {selectedAgreement && (
                <div className="flex items-center gap-2">
                  <i
                    className="ri-scales-line text-gray-400"
                    aria-hidden="true"
                  ></i>
                  <span className="truncate">
                    {formatCurrency(agreementAmount)} (Agreement Total)
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <i
                  className="ri-price-tag-3-line text-gray-400"
                  aria-hidden="true"
                ></i>
                <span>
                  {total ? `${formatCurrency(total)}` : "Total Amount"}
                </span>
              </div>
              {selectedAgreement && (
                <div className="flex items-center gap-2 text-[11px] text-emerald-700">
                  <i
                    className="ri-scales-line text-emerald-600"
                    aria-hidden="true"
                  ></i>
                  <span>
                    Remaining after save:{" "}
                    {formatCurrency(
                      Math.max(
                        0,
                        agreementAmount - previouslyInvoicedTotal - total
                      )
                    )}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <i
                  className="ri-timer-line text-gray-400"
                  aria-hidden="true"
                ></i>
                <span>{formData.status || "Status"}</span>
              </div>
              {(formData.issuedDate || formData.dueDate) && (
                <div className="flex items-center gap-2">
                  <i
                    className="ri-calendar-line text-gray-400"
                    aria-hidden="true"
                  ></i>
                  <span className="truncate">
                    {formData.issuedDate || "—"} → {formData.dueDate || "—"}
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-gray-100 text-xs text-gray-500">
                This is a quick glance of the invoice details before saving.
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
