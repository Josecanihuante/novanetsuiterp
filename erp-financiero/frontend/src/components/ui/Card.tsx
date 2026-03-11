import React from 'react'

interface CardProps {
  title?: string
  action?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export function Card({ title, action, children, footer, className = '' }: CardProps) {
  return (
    <div
      className={[
        'bg-white border border-gray-200 rounded-lg shadow-sm',
        className,
      ].join(' ')}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          {title && (
            <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          )}
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className="px-5 py-4">{children}</div>
      {footer && (
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-lg">
          {footer}
        </div>
      )}
    </div>
  )
}

export default Card
