"use client";

import { Award, ChevronDown } from "lucide-react";
import { useState } from "react";
import {
  BEST_MAPPED_ORCHARDS,
  BEST_MAPPED_ORCHARDS_DATE,
  type BestMappedOrchard,
} from "@/data/bestMappedOrchards";

interface BestMappedOrchardsProps {
  onSelect: (orchard: BestMappedOrchard) => void;
}

export default function BestMappedOrchards({
  onSelect,
}: BestMappedOrchardsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-xl">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls="best-mapped-orchards-list"
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 rounded-xl transition-colors"
      >
        <Award className="w-5 h-5 text-primary shrink-0" />
        <span className="flex-1 text-base font-bold text-nature">
          Gut kartierte Streuobstwiesen
        </span>
        <span className="text-xs font-semibold text-primary bg-primary/10 rounded-full px-2 py-0.5">
          {BEST_MAPPED_ORCHARDS.length}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div id="best-mapped-orchards-list" className="px-4 pb-4">
          <p className="text-xs text-gray-500 mb-3">
            Flächen mit mehr als 10 Obstbäumen, bei denen in OpenStreetMap die
            Sorte eingetragen ist. Stand:{" "}
            {new Date(BEST_MAPPED_ORCHARDS_DATE).toLocaleDateString("de-DE", {
              month: "long",
              year: "numeric",
            })}
          </p>
          <ol className="max-h-72 overflow-y-auto -mx-2 space-y-0.5">
            {BEST_MAPPED_ORCHARDS.map((orchard, index) => (
              <li key={orchard.osm}>
                <button
                  type="button"
                  onClick={() => onSelect(orchard)}
                  title={`Häufigste Sorten: ${orchard.topCultivars.join(", ")}`}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left hover:bg-gray-100 transition-colors"
                >
                  <span className="w-5 text-xs font-semibold text-gray-400 text-right shrink-0">
                    {index + 1}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-gray-800 truncate">
                      {orchard.name ?? `Obstwiese bei ${orchard.place}`}
                    </span>
                    <span className="block text-xs text-gray-500 truncate">
                      {orchard.name
                        ? `${orchard.place}, ${orchard.state}`
                        : orchard.state}
                    </span>
                  </span>
                  <span className="text-right shrink-0">
                    <span className="block text-sm font-bold text-primary">
                      {orchard.cultivarTrees}
                    </span>
                    <span className="block text-[10px] text-gray-400 leading-tight">
                      mit Sorte
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
