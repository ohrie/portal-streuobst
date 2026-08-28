interface HarvestNoticeProps {
  /** When set, a close button is rendered and calls this handler. */
  onClose?: () => void;
  className?: string;
}

export default function HarvestNotice({
  onClose,
  className = "",
}: HarvestNoticeProps) {
  return (
    <div
      className={`relative bg-orange-50 border-2 border-orange-300 rounded-xl p-4 ${className}`}
    >
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Hinweis schließen"
          className="absolute top-2 right-2 p-1.5 rounded-lg text-orange-700 hover:bg-orange-100 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
      <div className="flex items-start gap-3">
        <svg
          className="w-5 h-5 text-orange-600 shrink-0 mt-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div className="text-left">
          <h2 className="text-base font-bold text-orange-900 mb-2">
            Pflücken nicht erlaubt
          </h2>
          <p
            className={`text-sm text-orange-900 leading-relaxed ${onClose ? "pr-6" : ""}`}
          >
            Bitte beachte:{" "}
            Obst von Streuobstwiesen darf nur mit{" "}
            <strong>
               ausdrücklicher Erlaubnis geerntet
              werden!
            </strong>
          </p>
        </div>
      </div>
    </div>
  );
}
