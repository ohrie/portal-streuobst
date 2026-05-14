export interface RouteFeature {
  name: string;
  description_html: string | null;
  url: string | null;
  trail_type: string | null;
  circular: string;
  length_m: number | null;
  uphill_m: number | null;
  downhill_m: number | null;
  duration: string | null;
  license: string | null;
  license_url: string | null;
  publisher_name: string;
  publisher_url: string | null;
  image_urls: string[] | null;
  geometry: number[][];
}
