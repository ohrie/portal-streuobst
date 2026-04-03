'use client';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  backgroundImage?: string;
}

export default function Section({
  children,
  className = '',
  backgroundImage
}: SectionProps) {
  return (
    <section
      className={`relative overflow-hidden ${className}`}
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover'
      }}
    >
      {backgroundImage && (
        <div className="absolute inset-0 bg-background bg-opacity-80" />
      )}
      <div className="relative z-10 centered-content">
        {children}
      </div>
    </section>
  );
}
