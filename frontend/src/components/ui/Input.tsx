import React, { forwardRef } from 'react'

// ── Input ─────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className = '', ...rest }, ref) => {
    const inputId = id ?? `input-${label.toLowerCase().replace(/\s+/g, '-')}`
    const errorId = `${inputId}-error`
    const hintId  = `${inputId}-hint`

    const describedBy = [
      error ? errorId : null,
      hint  ? hintId  : null,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div className="flex flex-col gap-1">
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-gray-700"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-describedby={describedBy || undefined}
          aria-invalid={!!error}
          className={[
            'h-9 rounded-md border bg-white px-3 text-sm transition-colors',
            'placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-offset-1',
            error
              ? 'border-danger focus:ring-danger/40'
              : 'border-gray-300 focus:ring-secondary/40 focus:border-secondary',
            className,
          ].join(' ')}
          {...rest}
        />
        {hint && !error && (
          <p id={hintId} className="text-xs text-gray-500">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="text-xs text-danger">
            {error}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'


// ── Select ────────────────────────────────────────────────────────────────────

interface SelectOption {
  value: string | number
  label: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: SelectOption[]
  error?: string
  hint?: string
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, hint, placeholder, id, className = '', ...rest }, ref) => {
    const selectId = id ?? `select-${label.toLowerCase().replace(/\s+/g, '-')}`
    const errorId  = `${selectId}-error`
    const hintId   = `${selectId}-hint`

    const describedBy = [
      error ? errorId : null,
      hint  ? hintId  : null,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div className="flex flex-col gap-1">
        <label
          htmlFor={selectId}
          className="text-sm font-medium text-gray-700"
        >
          {label}
        </label>
        <select
          ref={ref}
          id={selectId}
          aria-describedby={describedBy || undefined}
          aria-invalid={!!error}
          className={[
            'h-9 rounded-md border bg-white px-3 text-sm transition-colors cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-offset-1',
            error
              ? 'border-danger focus:ring-danger/40'
              : 'border-gray-300 focus:ring-secondary/40 focus:border-secondary',
            className,
          ].join(' ')}
          {...rest}
        >
          {placeholder && (
            <option value="" className="text-gray-400">
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {hint && !error && (
          <p id={hintId} className="text-xs text-gray-500">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="text-xs text-danger">
            {error}
          </p>
        )}
      </div>
    )
  },
)

Select.displayName = 'Select'

export default Input
