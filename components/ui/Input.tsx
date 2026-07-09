"use client";

import {
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  useId,
} from "react";

const fieldClasses =
  "w-full rounded-xl border border-rice-200 bg-white px-3.5 py-2.5 text-base outline-none transition-colors placeholder:text-stone-400 focus:border-rice-400 focus:ring-2 focus:ring-rice-200";

function FieldWrapper({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-stone-700">
          {label}
        </label>
      )}
      {children}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = "", ...props }: InputProps) {
  const id = useId();
  return (
    <FieldWrapper id={id} label={label} error={error}>
      <input id={id} className={`${fieldClasses} ${className}`} {...props} />
    </FieldWrapper>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export function Select({ label, error, className = "", children, ...props }: SelectProps) {
  const id = useId();
  return (
    <FieldWrapper id={id} label={label} error={error}>
      <select id={id} className={`${fieldClasses} ${className}`} {...props}>
        {children}
      </select>
    </FieldWrapper>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = "", ...props }: TextareaProps) {
  const id = useId();
  return (
    <FieldWrapper id={id} label={label} error={error}>
      <textarea id={id} className={`${fieldClasses} ${className}`} {...props} />
    </FieldWrapper>
  );
}
