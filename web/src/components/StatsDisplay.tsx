'use client';

import { useEffect, useState } from 'react';
import { Map, Database } from 'lucide-react';
import Link from 'next/link';

interface Stats {
  date: string;
  orchards_count: number;
  total_area_ha: number;
}

const FALLBACK: Stats = {
  date: '',
  orchards_count: 102150,
  total_area_ha: 202250.53,
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function Skeleton() {
  return <div className="h-12 w-32 bg-gray-200 animate-pulse rounded-lg" />;
}

export default function StatsDisplay() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [date, setDate] = useState('');

  useEffect(() => {
    fetch('/stats.json')
      .then((res) => {
        if (!res.ok) throw new Error('not ok');
        return res.json();
      })
      .then((data: Stats) => {
        setStats(data);
        setDate(formatDate(data.date));
      })
      .catch(() => {
        setStats(FALLBACK);
      });
  }, []);

  return (
    <Link href="/statistiken" className="block max-w-6xl mx-auto mt-12 px-4 group">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Obstgärten insgesamt */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border-2 border-primary/20 group-hover:border-primary/50 transition-colors">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Map className="w-6 h-6 text-primary" />
            </div>
            <div>
              {stats === null ? (
                <Skeleton />
              ) : (
                <p className="text-4xl md:text-5xl font-black text-primary font-heading">
                  {stats.orchards_count.toLocaleString('de-DE')}
                </p>
              )}
            </div>
          </div>
          <p className="text-lg font-semibold text-foreground">Obstgärten insgesamt</p>
          <p className="text-sm text-gray-600 mt-1">Bereits in OpenStreetMap erfasst</p>
        </div>

        {/* Erfasste Fläche */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border-2 border-accent/20 group-hover:border-accent/50 transition-colors">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
              <Database className="w-6 h-6 text-accent" />
            </div>
            <div>
              {stats === null ? (
                <Skeleton />
              ) : (
                <p className="text-4xl md:text-5xl font-black text-accent font-heading">
                  {Math.round(stats.total_area_ha).toLocaleString('de-DE')}
                </p>
              )}
            </div>
          </div>
          <p className="text-lg font-semibold text-foreground">Hektar erfasst</p>
          <p className="text-sm text-gray-600 mt-1">Obstgärten-Gesamtfläche in OpenStreetMap</p>
        </div>
      </div>
      {date && (
        <p className="text-xs text-gray-400 text-right mt-2">Stand: {date}</p>
      )}
    </Link>
  );
}
