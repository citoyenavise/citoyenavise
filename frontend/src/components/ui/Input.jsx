export function Input({
  label,
  type = 'text',
  error,
  className = '',
  ...props
}) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <input
        type={type}
        className={`
          w-full px-4 py-2 border rounded-lg
          focus:outline-none focus:ring-2 focus:ring-primary
          ${error ? 'border-error' : 'border-gray-300'}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-error text-sm mt-1">{error}</p>
      )}
    </div>
  );
}
