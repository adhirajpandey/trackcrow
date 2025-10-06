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

    if (hasCategory && !hasSubcategory) {
      return [
        ...fields,
        {
          name: "subcategory",
          label: "Subcategory",
          type: "text",
          required: true,
        },
      ];
    }
    return fields;
  }, [fields]);

  const [formData, setFormData] = useState(
    Object.fromEntries(normalizedFields.map((f) => [f.name, ""]))
  );

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmit({ ...formData, __resume: true, resumeState });
  };

  const getInputType = (f) =>
    f.name.toLowerCase().includes("date") ? "date" : f.type;

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
              categories.find((c) => c.name === selectedCategory)
                ?.subcategories || [];

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

          return (
            <div key={field.name} className="flex flex-col space-y-1">
              <label className="text-xs text-gray-300">{field.label}</label>
              <input
                name={field.name}
                type={type}
                required={field.required}
                value={
                  isDate
                    ? (() => {
                        const val = formData[field.name];
                        if (!val) return "";
                        const [dd, mm, yyyy] = val.split("-");
                        return yyyy && mm && dd ? `${yyyy}-${mm}-${dd}` : "";
                      })()
                    : formData[field.name]
                }
                onChange={handleChange}
                disabled={isSubmitting}
                className={sharedInputClass}
                style={{ colorScheme: "dark", accentColor: "#75378d" }}
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
