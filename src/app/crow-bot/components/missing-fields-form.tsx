"use client";
import { useState, useMemo, useEffect } from "react";

export function MissingFieldsForm({
  fields,
  resumeState,
  onSubmit,
  categories = [],
}) {
  const normalizedFields = useMemo(() => {
    const hasCategory = fields.some((f) => f.name === "category");
    const hasSubcategory = fields.some((f) => f.name === "subcategory");

    const onlyCategory =
      hasCategory && fields.length === 1 && fields[0].name === "category";

    const resultFields = [...fields];
    if (hasCategory && !hasSubcategory && !onlyCategory) {
      resultFields.push({
        name: "subcategory",
        label: "Subcategory",
        type: "text",
        required: true,
      });
    }

    const hasStart = resultFields.some((f) => f.name === "startDate");
    const hasEnd = resultFields.some((f) => f.name === "endDate");

    if (hasStart && !hasEnd) {
      resultFields.push({
        name: "endDate",
        label: "End Date",
        type: "date",
        required: true,
      });
    } else if (!hasStart && hasEnd) {
      resultFields.push({
        name: "startDate",
        label: "Start Date",
        type: "date",
        required: true,
      });
    }

    return resultFields;
  }, [fields]);

  const defaultValues = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16); // YYYY-MM-DDTHH:mm

    return Object.fromEntries(
      normalizedFields.map((f) => {
        if (f.name === "type") return [f.name, "UPI"];
        if (f.name === "timestamp") return [f.name, localISO];
        if (f.name === "startDate" || f.name === "endDate")
          return [f.name, today];
        return [f.name, ""];
      })
    );
  }, [normalizedFields]);

  const [formData, setFormData] = useState(defaultValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    const prefilledCategory = resumeState?.context?.partialData?.category;
    if (prefilledCategory) {
      setSelectedCategory(prefilledCategory);
      setFormData((prev) => ({
        ...prev,
        category: prefilledCategory,
        subcategory:
          prev.subcategory ||
          resumeState?.context?.partialData?.subcategory ||
          "",
      }));
    }
  }, [resumeState]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;

    if (name === "category") {
      setSelectedCategory(value);
      setFormData((p) => ({ ...p, category: value, subcategory: "" }));
      return;
    }

    if (name === "subcategory") {
      setFormData((p) => ({ ...p, subcategory: value }));
      return;
    }

    if (type === "date" || name.toLowerCase().includes("date")) {
      setFormData((p) => ({ ...p, [name]: value }));
      return;
    }

    setFormData((p) => ({ ...p, [name]: value }));
  };

  useEffect(() => {
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    if (formData.startDate && formData.endDate && end < start) {
      setFormData((prev) => ({ ...prev, endDate: "" }));
      alert("End date cannot be earlier than start date.");
    }
  }, [formData.startDate, formData.endDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmit({ ...formData, __resume: true, resumeState });
  };

  const getInputType = (f) =>
    f.name === "startDate" || f.name === "endDate"
      ? "date"
      : f.name.toLowerCase().includes("date")
        ? "date"
        : f.type;

  return (
    <div
      className="flex flex-col mx-auto"
      style={{
        width: "100%",
        maxWidth: "600px",
        minWidth: "360px",
      }}
    >
      <p className="text-gray-300 text-sm mb-3 text-left font-medium">
        Please provide the following details to proceed:
      </p>

      <form
        onSubmit={handleSubmit}
        className={`border border-zinc-700 rounded-lg bg-zinc-900 p-5 space-y-3 w-full ${
          isSubmitting ? "opacity-60 pointer-events-none" : ""
        }`}
      >
        {normalizedFields.map((field) => {
          const type = getInputType(field);
          const isDate = type === "date";

          const sharedInputClass =
            "bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white focus:ring-1 focus:ring-[#75378d]";
          const sharedSelectStyle = {
            textIndent: "-1px",
            paddingRight: "1.9rem",
            colorScheme: "dark",
            accentColor: "#75378d",
          };

          if (field.name === "category") {
            return (
              <div key="category" className="flex flex-col space-y-1">
                <label className="text-xs text-gray-300">{field.label}</label>
                <select
                  name="category"
                  value={formData.category || ""}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting || categories.length === 0}
                  className={sharedInputClass}
                  style={sharedSelectStyle}
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          if (field.name === "subcategory") {
            const subcats =
              categories.find(
                (c) =>
                  c.name.toLowerCase() ===
                  (selectedCategory || "").toLowerCase()
              )?.subcategories || [];
            if (!selectedCategory) return null;

            return (
              <div key="subcategory" className="flex flex-col space-y-1">
                <label className="text-xs text-gray-300">{field.label}</label>
                <select
                  name="subcategory"
                  value={formData.subcategory || ""}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting || subcats.length === 0}
                  className={sharedInputClass}
                  style={sharedSelectStyle}
                >
                  <option value="">Select subcategory</option>
                  {subcats.map((s, idx) => (
                    <option key={`${selectedCategory}-${s}-${idx}`} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          if (field.name === "type") {
            const paymentModes = ["UPI", "NETBANKING", "CARD", "CASH", "OTHER"];
            return (
              <div key="type" className="flex flex-col space-y-2">
                <label className="text-xs text-gray-300">Payment Mode</label>
                <div className="flex flex-wrap gap-2">
                  {paymentModes.map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, type: mode }))}
                      className={`px-4 py-2 rounded-md text-sm border transition-all duration-200 ${
                        formData.type === mode
                          ? "border-[#75378d] text-[#75378d]"
                          : "border-zinc-700 text-gray-300 hover:border-[#75378d] hover:text-[#75378d]"
                      } bg-zinc-900`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            );
          }

          return (
            <div key={field.name} className="flex flex-col space-y-1">
              <label className="text-xs text-gray-300">{field.label}</label>
              <input
                name={field.name}
                type={type}
                required={field.required}
                min={
                  field.name === "endDate"
                    ? formData.startDate || undefined
                    : undefined
                }
                max={
                  field.name === "startDate"
                    ? formData.endDate || undefined
                    : undefined
                }
                value={
                  isDate
                    ? (() => {
                        const val = formData[field.name];
                        if (!val) return "";
                        return val.length > 10 ? val.slice(0, 16) : val;
                      })()
                    : formData[field.name]
                }
                onChange={handleChange}
                disabled={isSubmitting}
                className={sharedInputClass}
                style={{ colorScheme: "dark", accentColor: "#75378d" }}
                placeholder={field.name === "type" ? "Payment Mode" : ""}
              />
            </div>
          );
        })}

        {!isSubmitting && (
          <button
            type="submit"
            className="text-white text-sm px-3 py-2 rounded-md hover:opacity-90 w-full"
            style={{ backgroundColor: "#75378d" }}
          >
            Submit
          </button>
        )}
      </form>
    </div>
  );
}
