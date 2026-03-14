import React, { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  isLoading?: boolean
  isDisabled?: boolean
  children: React.ReactNode
  type?: 'button' | 'submit' | 'reset'
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary/90 focus-visible:ring-primary',
  secondary:
    'bg-secondary text-white hover:bg-secondary/90 focus-visible:ring-secondary',
  ghost:
    'bg-transparent text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-300 border border-gray-300',
  danger:
    'bg-danger text-white hover:bg-danger/90 focus-visible:ring-danger',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-6 text-base gap-2.5',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      isDisabled = false,
      children,
      className = '',
      type = 'button',
      onClick,
      ...rest
    },
    ref,
  ) => {
    const disabled = isLoading || isDisabled

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        aria-busy={isLoading}
        onClick={onClick}
        className={[
          'inline-flex items-center justify-center rounded-md font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:pointer-events-none',
          variantClasses[variant],
          sizeClasses[size],
          className,
        ].join(' ')}
        {...rest}
      >
        {isLoading && <Loader2 className="animate-spin shrink-0" size={14} />}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
export default Button
