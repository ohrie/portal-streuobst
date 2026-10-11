import { MonitorX } from "lucide-react";

export type UnsupportedReason = "javascript" | "webgl";

interface UnsupportedBrowserNoticeProps {
  reason: UnsupportedReason;
  /** Extra classes, e.g. a delayed reveal animation for the legacy fallback. */
  className?: string;
}

const MESSAGES: Record<UnsupportedReason, { title: string; text: string }> = {
  javascript: {
    title: "Karte kann nicht geladen werden",
    text: "Die interaktive Karte benötigt JavaScript. Bitte aktiviere JavaScript in deinem Browser oder nutze einen aktuellen Browser – dein Browser ist möglicherweise zu alt.",
  },
  webgl: {
    title: "Browser wird nicht unterstützt",
    text: "Die interaktive Karte benötigt WebGL 2, das dein Browser oder Gerät nicht unterstützt oder das deaktiviert ist. Bitte aktualisiere deinen Browser, aktiviere die Hardwarebeschleunigung oder nutze ein anderes Gerät. Auch Erweiterungen, die den Canvas-Zugriff blockieren, können die Karte verhindern.",
  },
};

export default function UnsupportedBrowserNotice({
  reason,
  className = "",
}: UnsupportedBrowserNoticeProps) {
  const { title, text } = MESSAGES[reason];

  return (
    <div
      role="alert"
      className={`absolute inset-0 z-50 flex items-center justify-center bg-background p-4 ${className}`}
    >
      <div className="max-w-md bg-white border-2 border-orange-300 rounded-xl p-6 shadow-lg text-center">
        <MonitorX
          className="w-10 h-10 text-orange-600 mx-auto mb-3"
          aria-hidden="true"
        />
        <h1 className="text-xl font-heading font-bold text-orange-900 mb-2">
          {title}
        </h1>
        <p className="text-sm text-orange-900 leading-relaxed mb-4">{text}</p>
        <p className="text-sm text-gray-700">
          Empfohlen: aktuelle Versionen von{" "}
          <a
            href="https://www.mozilla.org/de/firefox/new/"
            className="text-primary underline"
          >
            Firefox
          </a>
          ,{" "}
          <a
            href="https://www.google.com/intl/de/chrome/"
            className="text-primary underline"
          >
            Chrome
          </a>{" "}
          oder Safari.
        </p>
      </div>
    </div>
  );
}
