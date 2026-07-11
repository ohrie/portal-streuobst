// Kartenausschnitte (Zentrum + Zoom) je Bundesland für Deep-Links auf /karte/.
// Format folgt dem Mapbox-GL Hash-String: #zoom/lat/lng
export type Bundesland = {
  name: string;
  zoom: number;
  lat: number;
  lng: number;
};

export const BUNDESLAENDER: Bundesland[] = [
  { name: "Baden-Württemberg", zoom: 8, lat: 48.66, lng: 9.35 },
  { name: "Bayern", zoom: 7, lat: 49.02, lng: 11.4 },
  { name: "Berlin", zoom: 10, lat: 52.52, lng: 13.4 },
  { name: "Brandenburg", zoom: 8, lat: 52.41, lng: 13.06 },
  { name: "Bremen", zoom: 10, lat: 53.08, lng: 8.8 },
  { name: "Hamburg", zoom: 10, lat: 53.55, lng: 10.0 },
  { name: "Hessen", zoom: 8, lat: 50.65, lng: 9.16 },
  { name: "Mecklenburg-Vorpommern", zoom: 8, lat: 53.61, lng: 12.43 },
  { name: "Niedersachsen", zoom: 7, lat: 52.64, lng: 9.85 },
  { name: "Nordrhein-Westfalen", zoom: 8, lat: 51.43, lng: 7.66 },
  { name: "Rheinland-Pfalz", zoom: 8, lat: 50.12, lng: 7.3 },
  { name: "Saarland", zoom: 10, lat: 49.38, lng: 7.02 },
  { name: "Sachsen", zoom: 8, lat: 51.1, lng: 13.2 },
  { name: "Sachsen-Anhalt", zoom: 8, lat: 51.95, lng: 11.69 },
  { name: "Schleswig-Holstein", zoom: 8, lat: 54.22, lng: 9.7 },
  { name: "Thüringen", zoom: 8, lat: 50.9, lng: 11.03 },
];
