export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  ...props
}) {
  const baseStyles = 'font-medium rounded-lg transition-colors duration-200 cursor-pointer'

  const variants = {
    primary: 'bg-primary text-white hover:bg-blue-700 disabled:bg-gray-400',
    secondary: 'bg-secondary text-white hover:bg-slate-600 disabled:bg-gray-400',
    outline: 'border border-primary text-primary hover:bg-blue-50 disabled:opacity-50',
    danger: 'bg-error text-white hover:bg-red-700 disabled:bg-gray-400',
  }

  const sizes = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  const buttonClass = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`

  return (
    <button
      disabled={disabled}
      className={buttonClass}
      {...props}
    >
      {children}
    </button>
  )
}
