import { LucideIcon } from 'lucide-react';

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  icon?: LucideIcon;
  title?: string;
}

export default function BentoCard({
  children,
  className = '',
  icon: Icon,
  title
}: BentoCardProps) {
  return (
    <div className={`bento-item ${className}`}>
      {(Icon || title) && (
        <div className="flex items-center justify-center gap-4 mb-6">
          {Icon && (
            <div className="bg-accent p-3 rounded-xl">
              <Icon className="w-8 h-8 text-background" />
            </div>
          )}
          {title && <h3 className="text-2xl font-bold text-foreground font-heading">{title}</h3>}
        </div>
      )}
      {children}
    </div>
  );
}
