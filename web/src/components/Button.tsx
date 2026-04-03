import { LucideIcon } from 'lucide-react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  className?: string;
  external?: boolean;
}

export default function Button({
  children,
  onClick,
  href,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  className = '',
  external = false
}: ButtonProps) {
  // Build className string step by step
  let finalClasses = 'inline-flex items-center justify-center gap-2 font-semibold rounded-md shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2';

  // Add variant-specific styles with custom CSS properties
  if (variant === 'primary') {
    finalClasses += ' text-white';
  } else if (variant === 'secondary') {
    finalClasses += ' text-white';
  } else if (variant === 'outline') {
    finalClasses += ' bg-transparent border-2 text-white';
  }

  // Add size classes
  if (size === 'sm') {
    finalClasses += ' p-5 text-sm';
  } else if (size === 'md') {
    finalClasses += ' px-3.5 py-2.5 text-sm';
  } else if (size === 'lg') {
    finalClasses += ' p-9 text-base';
  }

  // Add custom className
  if (className) {
    finalClasses += ` ${className}`;
  }

  // Define inline styles for custom colors
  const getButtonStyle = () => {
    const baseStyle: React.CSSProperties = {};

    if (variant === 'primary') {
      baseStyle.backgroundColor = 'var(--color-primary)';
      baseStyle.borderColor = 'var(--color-secondary)';
    } else if (variant === 'secondary') {
      baseStyle.backgroundColor = 'var(--color-light)';
      baseStyle.color = 'var(--color-secondary)';
      baseStyle.borderColor = 'var(--color-light)';
    } else if (variant === 'outline') {
      baseStyle.backgroundColor = 'transparent';
      baseStyle.borderColor = 'var(--color-tertiary)';
      baseStyle.color = 'var(--color-tertiary)';
    }

    return baseStyle;
  };

  const content = (
    <>
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={finalClasses}
        style={getButtonStyle()}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={finalClasses}
      style={getButtonStyle()}
    >
      {content}
    </button>
  );
}
