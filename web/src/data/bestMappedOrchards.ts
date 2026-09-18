// Flächen mit mehr als 20 Obstbäumen, bei denen die Sorte eingetragen ist
// (taxon:cultivar / taxon:cultivar:de / cultivar, ohne Platzhalter wie „unbekannt“).
// Generiert von data-processing/find_best_mapped_orchards.py – nicht von Hand bearbeiten.
export type BestMappedOrchard = {
  /** OSM-Name der Fläche (oder einer umschließenden Fläche), falls vorhanden */
  name: string | null;
  place: string;
  state: string;
  /** Bäume mit eingetragener Sorte */
  cultivarTrees: number;
  /** Alle erfassten Bäume in der Fläche */
  trees: number;
  /** Anzahl verschiedener Sorten */
  cultivars: number;
  topCultivars: string[];
  areaHa: number;
  /** Punkt sicher innerhalb der Fläche [lng, lat] */
  center: [number, number];
  /** [west, south, east, north] */
  bbox: [number, number, number, number];
  /** OSM-Objekt, z. B. "way/1373324442" */
  osm: string;
};

export const BEST_MAPPED_ORCHARDS_DATE = "2026-08-18";

export const BEST_MAPPED_ORCHARDS: BestMappedOrchard[] = [
  {
    name: "Streuobstplantage Gartenfeld",
    place: "Steinenbrück",
    state: "Nordrhein-Westfalen",
    cultivarTrees: 127,
    trees: 136,
    cultivars: 108,
    topCultivars: [
      "Peter Broich (Kaiser Willhelm)",
      "Weißer Klarapfel",
      "Transparent von Croncels",
    ],
    areaHa: 2.22,
    center: [7.226172, 50.932378],
    bbox: [7.224826, 50.931529, 7.22805, 50.9332],
    osm: "way/1373324442",
  },
  {
    name: "Streuobstwiese Sengersfeld",
    place: "Göttingen",
    state: "Niedersachsen",
    cultivarTrees: 112,
    trees: 130,
    cultivars: 54,
    topCultivars: ["Boskoop", "Dülmener Herbstrosenapfel", "Gute Luise"],
    areaHa: 1.96,
    center: [9.972184, 51.536322],
    bbox: [9.970713, 51.535745, 9.973587, 51.536927],
    osm: "way/369173098",
  },
  {
    name: "Streuobstplantage Rommelshard",
    place: "Scheiderhöhe",
    state: "Nordrhein-Westfalen",
    cultivarTrees: 107,
    trees: 118,
    cultivars: 101,
    topCultivars: [
      "Feldspeierling",
      "Roter Weinbergspfirsich",
      "Frucht Eberesche Edulis",
    ],
    areaHa: 1.47,
    center: [7.244453, 50.88973],
    bbox: [7.243151, 50.889108, 7.245447, 50.890361],
    osm: "way/356328350",
  },
  {
    name: "Streuobstplantage Spechtsberg",
    place: "Agger",
    state: "Nordrhein-Westfalen",
    cultivarTrees: 85,
    trees: 91,
    cultivars: 76,
    topCultivars: ["Rheinischer Bohnapfel", "Grahams Jubiläumsapfel", "XL"],
    areaHa: 1.26,
    center: [7.243243, 50.890245],
    bbox: [7.242003, 50.889578, 7.244485, 50.890771],
    osm: "way/1373210788",
  },
  {
    name: null,
    place: "Magdeburg",
    state: "Sachsen-Anhalt",
    cultivarTrees: 63,
    trees: 78,
    cultivars: 54,
    topCultivars: ["Prinzessin Marianne", "Kuresia", "Carola"],
    areaHa: 0.58,
    center: [11.599276, 52.11453],
    bbox: [11.59886, 52.113965, 11.599662, 52.115114],
    osm: "way/98670039",
  },
  {
    name: null,
    place: "Hostrup",
    state: "Schleswig-Holstein",
    cultivarTrees: 43,
    trees: 43,
    cultivars: 24,
    topCultivars: ["Roter Eiserapfel", "Echte Knausbirne", "Schafsnase"],
    areaHa: 0.62,
    center: [9.503489, 54.646715],
    bbox: [9.502175, 54.646285, 9.504676, 54.647218],
    osm: "way/364742768",
  },
  {
    name: "Streuobstwiese am Rohrer Weg",
    place: "Stuttgart",
    state: "Baden-Württemberg",
    cultivarTrees: 35,
    trees: 45,
    cultivars: 29,
    topCultivars: ["Gewürzluike", "Rheinischer Bohnapfel", "Boskoop"],
    areaHa: 8.19,
    center: [9.138789, 48.723336],
    bbox: [9.136883, 48.721933, 9.141739, 48.724813],
    osm: "way/42711929",
  },
  {
    name: "Streuobstwiese Gewann Hirtenberg",
    place: "Crispenhofen",
    state: "Baden-Württemberg",
    cultivarTrees: 34,
    trees: 40,
    cultivars: 33,
    topCultivars: ["Gewürzluike", "Bittenfelder Sämling", "Gehers Rambour"],
    areaHa: 0.33,
    center: [9.602591, 49.309537],
    bbox: [9.600699, 49.309198, 9.603593, 49.309913],
    osm: "way/498034544",
  },
  {
    name: null,
    place: "Ballenberg",
    state: "Baden-Württemberg",
    cultivarTrees: 31,
    trees: 68,
    cultivars: 26,
    topCultivars: ["Kaiser Wilhelm", "Brettacher", "Wiltshire"],
    areaHa: 0.54,
    center: [9.547338, 49.403368],
    bbox: [9.544811, 49.402843, 9.547719, 49.403936],
    osm: "way/311361491",
  },
  {
    name: null,
    place: "Bruchsal",
    state: "Baden-Württemberg",
    cultivarTrees: 24,
    trees: 50,
    cultivars: 24,
    topCultivars: ["Rote Donausnuss", "Grüne Jagdbirne", "Gräfin von Paris"],
    areaHa: 7.81,
    center: [8.608054, 49.138427],
    bbox: [8.605285, 49.13654, 8.611075, 49.140311],
    osm: "relation/5792675",
  },
  {
    name: "neue Streuobstwiese",
    place: "Bernitt",
    state: "Mecklenburg-Vorpommern",
    cultivarTrees: 22,
    trees: 24,
    cultivars: 22,
    topCultivars: [
      "Rote Bergamotte",
      "Altländer Pfannkuchenapfel",
      "Große Rote Knorpelkirsche",
    ],
    areaHa: 0.39,
    center: [11.799579, 53.878329],
    bbox: [11.798987, 53.877895, 11.800143, 53.878579],
    osm: "way/484547718",
  },
  {
    name: "Streuobstwiese der Naturschule Aggerbogen",
    place: "Höffen",
    state: "Nordrhein-Westfalen",
    cultivarTrees: 22,
    trees: 26,
    cultivars: 19,
    topCultivars: [
      "Laxton Superb",
      "Köstliche von Charneux",
      "Rheinischer Bohnapfel",
    ],
    areaHa: 0.22,
    center: [7.248115, 50.889402],
    bbox: [7.247601, 50.889147, 7.248601, 50.889668],
    osm: "way/1463555908",
  },
];
