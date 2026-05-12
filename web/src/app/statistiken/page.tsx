'use client';

import { useEffect, useState } from 'react';
import { TreePine, Ruler, TrendingUp, Calendar } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';

interface Bundesland {
    name: string;
    kuerzel: string;
    ars: string;
    wiesen_count: number;
    wiesen_area_ha: number;
    trees_count: number;
}

interface LaenderStats {
    generated: string;
    laender: Bundesland[];
}

interface GlobalStats {
    trees_count: number;
}

const PRIMARY = '#754c82';
const SECONDARY = '#465902';
const ACCENT = '#D9BC2B';
const LIGHT = '#F2DC9B';

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

function formatNum(n: number): string {
    return n.toLocaleString('de-DE');
}

function formatHa(n: number): string {
    return n.toLocaleString('de-DE', { maximumFractionDigits: 0 });
}

interface TooltipProps {
    active?: boolean;
    payload?: { value: number; name: string }[];
    label?: string;
    unit?: string;
}

function CustomTooltip({ active, payload, label, unit }: TooltipProps) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-lg text-sm">
            <p className="font-semibold text-foreground mb-1">{label}</p>
            <p className="text-primary font-bold">
                {formatNum(payload[0].value)} {unit}
            </p>
        </div>
    );
}

function useIsMobile(breakpoint = 640) {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
        setIsMobile(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, [breakpoint]);
    return isMobile;
}

export default function StatistikenPage() {
    const [stats, setStats] = useState<LaenderStats | null>(null);
    const [treesCount, setTreesCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeChart, setActiveChart] = useState<'count' | 'area'>('area');
    const isMobile = useIsMobile();

    useEffect(() => {
        Promise.all([
            fetch('/stats_laender.json').then((res) => {
                if (!res.ok) throw new Error('not ok');
                return res.json() as Promise<LaenderStats>;
            }),
            fetch('/stats.json').then((res) => {
                if (!res.ok) throw new Error('not ok');
                return res.json() as Promise<GlobalStats>;
            }),
        ])
            .then(([laender, global]) => {
                setStats(laender);
                setTreesCount(global.trees_count);
            })
            .catch(() => setStats(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Lade Statistiken …</p>
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Statistiken konnten nicht geladen werden.</p>
            </div>
        );
    }

    const sorted = [...stats.laender].sort((a, b) =>
        activeChart === 'count' ? b.wiesen_count - a.wiesen_count : b.wiesen_area_ha - a.wiesen_area_ha
    );

    const top3 = [...stats.laender].sort((a, b) => b.wiesen_area_ha - a.wiesen_area_ha).slice(0, 3);
    const tableSorted = [...stats.laender].sort((a, b) => b.wiesen_area_ha - a.wiesen_area_ha);
    const totalCount = stats.laender.reduce((s, l) => s + l.wiesen_count, 0);
    const totalHa = stats.laender.reduce((s, l) => s + l.wiesen_area_ha, 0);
    const totalTrees = stats.laender.reduce((s, l) => s + l.trees_count, 0);

    const chartData = sorted.map((l) => ({
        name: l.name.replace('Nordrhein-Westfalen', 'NRW').replace('Mecklenburg-Vorpommern', 'M-V').replace('Schleswig-Holstein', 'S-H').replace('Sachsen-Anhalt', 'Sa-An').replace('Rheinland-Pfalz', 'RLP').replace('Baden-Württemberg', 'BW'),
        fullName: l.name,
        wiesen_count: l.wiesen_count,
        wiesen_area_ha: Math.round(l.wiesen_area_ha),
    }));

    const barColor = (index: number) => {
        if (index === 0) return PRIMARY;
        if (index === 1) return SECONDARY;
        if (index === 2) return ACCENT;
        return '#94a3b8';
    };

    return (
        <main>
            {/* Hero */}
            <section className="bg-background py-16 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-sm font-semibold text-primary uppercase tracking-wide">
                            Statistiken
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-secondary font-heading mb-4">
                        Obstwiesen<br />je Bundesland
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl">
                        Wie viele Streuobstwiesen sind in OpenStreetMap erfasst – und wie viel Fläche
                        nehmen sie je Bundesland ein?
                    </p>
                    {stats.generated && (
                        <div className="flex items-center gap-2 mt-4 text-sm text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span>Stand: {formatDate(stats.generated)}</span>
                        </div>
                    )}
                </div>
            </section>

            {/* Zusammenfassung */}
            <section className="px-4 py-8">
                <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Gesamtfläche */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-accent/10">
                        <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center mb-3">
                            <Ruler className="w-5 h-5 text-accent" />
                        </div>
                        <p className="text-3xl font-black text-accent font-heading">
                            {formatHa(totalHa)}
                        </p>
                        <p className="text-sm font-semibold text-foreground mt-1">Hektar gesamt</p>
                        <p className="text-xs text-gray-400">erfasste Gesamtfläche</p>
                    </div>
                    {/* Gesamtzahl */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-primary/10">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                            <TreePine className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-3xl font-black text-primary font-heading">
                            {formatNum(totalCount)}
                        </p>
                        <p className="text-sm font-semibold text-foreground mt-1">Wiesen gesamt</p>
                        <p className="text-xs text-gray-400">alle 16 Bundesländer</p>
                    </div>
                    {/* Bäume */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-secondary/10">
                        <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center mb-3">
                            <TreePine className="w-5 h-5 text-secondary" />
                        </div>
                        <p className="text-3xl font-black text-secondary font-heading">
                            {treesCount !== null ? formatNum(treesCount) : '–'}
                        </p>
                        <p className="text-sm font-semibold text-foreground mt-1">Bäume erfasst</p>
                        <p className="text-xs text-gray-400">natural=tree in OSM</p>
                    </div>
                    {/* Top-Bundesland */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-secondary/10">
                        <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center mb-3">
                            <TrendingUp className="w-5 h-5 text-secondary" />
                        </div>
                        <p className="text-3xl font-black text-secondary font-heading">
                            {top3[0]?.kuerzel}
                        </p>
                        <p className="text-sm font-semibold text-foreground mt-1">{top3[0]?.name}</p>
                        <p className="text-xs text-gray-400">
                            {formatHa(top3[0]?.wiesen_area_ha ?? 0)} ha
                        </p>
                    </div>
                </div>
            </section>

            {/* Diagramm */}
            <section className="px-4 py-8">
                <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                    {/* Toggle */}
                    <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                        <h2 className="text-xl font-bold text-foreground font-heading">
                            Vergleich nach Bundesland
                        </h2>
                        <div className="flex rounded-xl overflow-hidden border border-gray-200 text-sm font-semibold">
                            <button
                                onClick={() => setActiveChart('count')}
                                className={`px-4 py-2 transition-colors ${activeChart === 'count'
                                    ? 'bg-primary text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                Anzahl Wiesen
                            </button>
                            <button
                                onClick={() => setActiveChart('area')}
                                className={`px-4 py-2 transition-colors ${activeChart === 'area'
                                    ? 'bg-primary text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                Hektar
                            </button>
                        </div>
                    </div>

                    <ResponsiveContainer width="100%" height={isMobile ? chartData.length * 36 + 20 : 420}>
                        <BarChart
                            data={chartData}
                            layout={isMobile ? 'vertical' : 'horizontal'}
                            margin={isMobile
                                ? { top: 4, right: 40, left: 8, bottom: 4 }
                                : { top: 4, right: 16, left: 16, bottom: 60 }
                            }
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            {isMobile ? (
                                <>
                                    <XAxis
                                        type="number"
                                        tick={{ fontSize: 11, fill: '#64748b' }}
                                        tickFormatter={(v) => v.toLocaleString('de-DE')}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        tick={{ fontSize: 11, fill: '#64748b' }}
                                        width={44}
                                    />
                                </>
                            ) : (
                                <>
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 11, fill: '#64748b' }}
                                        angle={-35}
                                        textAnchor="end"
                                        interval={0}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: '#64748b' }}
                                        tickFormatter={(v) => v.toLocaleString('de-DE')}
                                    />
                                </>
                            )}
                            <Tooltip
                                content={
                                    <CustomTooltip
                                        unit={activeChart === 'count' ? 'Wiesen' : 'ha'}
                                    />
                                }
                            />
                            <Bar
                                dataKey={activeChart === 'count' ? 'wiesen_count' : 'wiesen_area_ha'}
                                radius={isMobile ? [0, 6, 6, 0] : [6, 6, 0, 0]}
                            >
                                {chartData.map((_, index) => (
                                    <Cell key={index} fill={barColor(index)} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </section>

            {/* Detailtabelle */}
            <section className="px-4 py-8 pb-16">
                <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100">
                        <h2 className="text-xl font-bold text-foreground font-heading">
                            Alle Bundesländer im Detail
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
                                    <th className="text-left px-6 py-3 font-semibold">#</th>
                                    <th className="text-left px-6 py-3 font-semibold">Bundesland</th>
                                    <th className="text-right px-6 py-3 font-semibold">Obstwiesen</th>
                                    <th className="text-right px-6 py-3 font-semibold">Fläche (ha)</th>
                                    <th className="text-right px-6 py-3 font-semibold hidden md:table-cell">Bäume</th>
                                    <th className="text-right px-6 py-3 font-semibold hidden sm:table-cell">Bundesanteil</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {tableSorted.map((land, i) => {
                                    const share = totalHa > 0 ? (land.wiesen_area_ha / totalHa) * 100 : 0;
                                    const isTop = i < 3;
                                    return (
                                        <tr
                                            key={land.kuerzel}
                                            className={`hover:bg-gray-50/60 transition-colors ${isTop ? 'font-medium' : ''
                                                }`}
                                        >
                                            <td className="px-6 py-3.5 text-gray-400 text-xs w-8">
                                                {i < 3 ? (
                                                    <span
                                                        className="inline-flex w-6 h-6 rounded-full items-center justify-center text-white text-xs font-bold"
                                                        style={{
                                                            background:
                                                                i === 0 ? PRIMARY : i === 1 ? SECONDARY : ACCENT,
                                                        }}
                                                    >
                                                        {i + 1}
                                                    </span>
                                                ) : (
                                                    i + 1
                                                )}
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <span className="text-foreground">{land.name}</span>
                                                <span className="ml-2 text-xs text-gray-400 font-mono">
                                                    {land.kuerzel}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5 text-right text-primary">
                                                {formatNum(land.wiesen_count)}
                                            </td>
                                            <td className="px-6 py-3.5 text-right text-gray-600 font-bold">
                                                {formatHa(land.wiesen_area_ha)}
                                            </td>
                                            <td className="px-6 py-3.5 text-right text-secondary hidden md:table-cell">
                                                {formatNum(land.trees_count)}
                                            </td>
                                            <td className="px-6 py-3.5 text-right hidden sm:table-cell">
                                                <div className="flex items-center justify-end gap-2">
                                                    <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full"
                                                            style={{
                                                                width: `${share}%`,
                                                                background: isTop ? PRIMARY : '#94a3b8',
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-gray-400 w-10 text-right">
                                                        {share.toFixed(1)} %
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr className="bg-gray-50 border-t border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    <td className="px-6 py-3" />
                                    <td className="px-6 py-3">Gesamt</td>
                                    <td className="px-6 py-3 text-right">{formatNum(totalCount)}</td>
                                    <td className="px-6 py-3 text-right font-bold text-gray-600">{formatHa(totalHa)}</td>
                                    <td className="px-6 py-3 text-right hidden md:table-cell">{formatNum(totalTrees)}</td>
                                    <td className="px-6 py-3 text-right hidden sm:table-cell">
                                        <span className="text-xs text-gray-500">100,0 %</span>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </section>
        </main>
    );
}
