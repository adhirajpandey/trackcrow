"use client";
import { useState } from "react";

export function MissingFieldsForm({ fields, resumeState, onSubmit }) {
  const [formData, setFormData] = useState(
    Object.fromEntries(fields.map((f) => [f.name, ""]))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    if (type === "date" || name.toLowerCase().includes("date")) {
      if (value) {
        const d = new Date(value);
        if (!isNaN(d.getTime())) {
          const formatted = `${String(d.getDate()).padStart(2, "0")}-${String(
            d.getMonth() + 1
          ).padStart(2, "0")}-${d.getFullYear()}`;
          setFormData((p) => ({ ...p, [name]: formatted }));
        }
      } else setFormData((p) => ({ ...p, [name]: "" }));
      return;
    }
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmit({ ...formData, __resume: true, resumeState });
  };

  const getInputType = (f: { name: string; type: string }) =>
    f.name.toLowerCase().includes("date") ? "date" : f.type;

  return (
    <form
      onSubmit={handleSubmit}
      className={`border border-zinc-700 rounded-lg bg-zinc-900 p-3 space-y-3 ${
        isSubmitting ? "opacity-60 pointer-events-none" : ""
      }`}
    >
      {fields.map((field) => {
        const type = getInputType(field);
        const isDate = type === "date";

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
              className={`bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 text-sm text-white
                focus:ring-1 focus:ring-[#75378d]
                disabled:opacity-60 disabled:cursor-not-allowed
                ${isDate ? "custom-date-icon" : ""}`}
              style={{
                colorScheme: "dark",
                accentColor: "#75378d",
              }}
            />
          </div>
        );
      })}

      {!isSubmitting && (
        <button
          type="submit"
          className="text-white text-sm px-3 py-1 rounded-md hover:opacity-90"
          style={{ backgroundColor: "#75378d" }}
        >
          Submit
        </button>
      )}
    </form>
  );
}
