'use client';

interface MapControlButtonProps {
  isActive?: boolean;
  onClick: () => void;
  title: string;
  label: string;
  isMobile: boolean;
  children: React.ReactNode;
}

export default function MapControlButton({
  isActive = false,
  onClick,
  title,
  label,
  isMobile,
  children,
}: MapControlButtonProps) {
  const size = 'w-[52px] h-[52px]';
  const padding = 'p-1.5';
  const border = isActive ? 'border-primary ring-2 ring-primary/30' : 'border-gray-200';

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={isActive}
      className={`bg-white hover:bg-gray-50 rounded-lg shadow-lg border ${border} transition-all duration-200 hover:shadow-xl flex flex-col items-center justify-center ${padding} gap-1 group cursor-pointer ${size}`}
    >
      {children}
      <span className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-gray-700'}`}>{label}</span>
    </button>
  );
}
