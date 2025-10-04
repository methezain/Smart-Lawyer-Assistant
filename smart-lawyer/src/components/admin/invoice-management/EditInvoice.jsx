import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useGetInvoiceQuery,
  useUpdateInvoiceMutation,
} from "../../../reduxstore/services/InvoicesAPI";

export default function EditInvoice() {
  const formatCurrency = (amount, locale = "en-PK", currency = "PKR") =>
    Number(amount || 0).toLocaleString(locale, { style: "currency", currency });
  const navigate = useNavigate();
  const { username, id } = useParams();
  const { data: invoice, isFetching } = useGetInvoiceQuery(id);
  const [updateInvoice, { isLoading: saving }] = useUpdateInvoiceMutation();
  const mkKey = useCallback(
    () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
    []
  );
  const withKeys = useCallback(
    (arr) => arr.map((it) => ({ ...it, _key: it._key || mkKey() })),
    [mkKey]
  );
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({
    id: "",
    contractId: "",
    contractTitle: "",
    clientName: "",
    issuedDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    status: "Unpaid",
    paymentMethod: "Bank Transfer",
    notes: "",
  });

  useEffect(() => {
    if (invoice) {
      setFormData({
        id: invoice.id,
        contractId: invoice.agreement_id || "",
        contractTitle: invoice.contract_title || invoice.contractTitle || "",
        clientName: invoice.client_name || invoice.clientName || "",
        issuedDate: invoice.issued_date || invoice.issuedDate || "",
        dueDate: invoice.due_date || invoice.dueDate || "",
        status: invoice.status || "Unpaid",
        paymentMethod:
          invoice.payment_method || invoice.paymentMethod || "Bank Transfer",
        notes: invoice.notes || "",
      });
      setItems(withKeys(invoice.items || []));
    }
  }, [invoice, withKeys]);

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

  const save = async (e) => {
    e.preventDefault();
    try {
      await updateInvoice({
        id,
        client_name: formData.clientName,
        contract_title: formData.contractTitle,
        issued_date: formData.issuedDate,
        due_date: formData.dueDate,
        status: formData.status,
        payment_method: formData.paymentMethod,
        notes: formData.notes,
        items: items.map((it) => ({
          description: it.description,
          amount: Number(it.amount || 0),
        })),
      }).unwrap();
      navigate(`/admin/${username}/billing`, {
        state: { toast: "Invoice updated" },
      });
    } catch (err) {
      console.error("Failed to update invoice", err);
    }
  };

  if (isFetching || !invoice)
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-3 text-gray-600">
        Loading invoice…
      </div>
    );

  return (
    <div className="space-y-4">
      {/* Gradient header */}
      <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
          <i className="ri-pencil-line"></i>
          Edit Invoice #{formData.id}
        </h1>
        <button
          onClick={() => navigate(`/admin/${username}/billing`)}
          className="px-3 py-1.5 text-xs border border-gray-300 bg-white rounded-lg shadow-sm hover:bg-gray-50"
        >
          Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Form */}
        <form onSubmit={save} className="lg:col-span-2 space-y-4">
          {/* Basic Invoice Details */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <i className="ri-file-text-line text-emerald-600"></i>
              <h3 className="font-semibold">Basic Invoice Details</h3>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label
                  htmlFor="contractTitle"
                  className="block text-xs font-medium text-gray-700"
                >
                  Contract
                </label>
                <input
                  type="text"
                  id="contractTitle"
                  value={formData.contractTitle}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      contractTitle: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                  placeholder="Contract title"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="clientName"
                  className="block text-xs font-medium text-gray-700"
                >
                  Client Name
                </label>
                <input
                  type="text"
                  name="clientName"
                  id="clientName"
                  value={formData.clientName}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                  placeholder="Client name"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="issuedDate"
                  className="block text-xs font-medium text-gray-700"
                >
                  Issued Date
                </label>
                <input
                  type="date"
                  name="issuedDate"
                  id="issuedDate"
                  value={formData.issuedDate}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="dueDate"
                  className="block text-xs font-medium text-gray-700"
                >
                  Due Date
                </label>
                <input
                  type="date"
                  name="dueDate"
                  id="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="status"
                  className="block text-xs font-medium text-gray-700"
                >
                  Status
                </label>
                <select
                  name="status"
                  id="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                >
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
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
                <i className="ri-price-tag-3-line text-emerald-600"></i>
                <h3 className="font-semibold">Invoice Items</h3>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="text-xs text-emerald-600 hover:text-emerald-800"
              >
                <i className="ri-add-line"></i> Add Item
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
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <i className="ri-file-text-line text-emerald-600"></i>
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
              <i className="ri-close-line mr-1" aria-hidden="true"></i>{" "}
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`px-4 py-2 text-xs text-white rounded-lg shadow-sm transition-colors flex items-center ${
                saving
                  ? "bg-emerald-400 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              <i className="ri-save-3-line mr-1" aria-hidden="true"></i>
              <span>{saving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </form>

        {/* Aside */}
        <aside className="space-y-4 lg:sticky lg:top-0 lg:self-start">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <i className="ri-information-line text-emerald-600"></i>
              <h3 className="font-semibold">Guidelines</h3>
            </div>
            <div className="p-4 text-xs text-gray-700 space-y-2">
              <div className="flex items-start gap-2">
                <i className="ri-edit-line text-gray-400 mt-0.5"></i>
                <span>
                  Edit basic fields like client, dates, status and notes. Items
                  update the total automatically.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <i className="ri-arrow-left-right-line text-gray-400 mt-0.5"></i>
                <span>
                  Use the status to reflect payment progress (Unpaid, Paid,
                  Partially Paid, Cancelled).
                </span>
              </div>
              <div className="flex items-start gap-2">
                <i className="ri-shield-keyhole-line text-gray-400 mt-0.5"></i>
                <span>
                  Changes are saved locally for now. Connect to backend later to
                  persist to server.
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <i className="ri-eye-line text-emerald-600"></i>
              <h3 className="font-semibold">Quick Preview</h3>
            </div>
            <div className="p-4 pb-2.5 text-xs text-gray-700 space-y-2">
              <div className="flex items-center gap-2">
                <i className="ri-hashtag text-gray-400"></i>
                <span className="truncate">{formData.id || "Invoice ID"}</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="ri-file-text-line text-gray-400"></i>
                <span className="font-medium truncate">
                  {formData.contractTitle || "Contract Title"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <i className="ri-user-line text-gray-400"></i>
                <span className="truncate">
                  {formData.clientName || "Client"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <i className="ri-price-tag-3-line text-gray-400"></i>
                <span>
                  {total ? `${formatCurrency(total)}` : "Total Amount"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <i className="ri-timer-line text-gray-400"></i>
                <span>{formData.status || "Status"}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
