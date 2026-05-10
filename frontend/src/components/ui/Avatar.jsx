export function Avatar({ src, name, size = 'md' }) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
  };

  const initials = name
    ?.split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover`}
      />
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-primary text-white flex items-center justify-center font-bold`}>
      {initials}
    </div>
  );
}
