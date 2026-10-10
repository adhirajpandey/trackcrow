const COORDINATES = /^\s*(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/;

/** Links for a transaction location, in the order to try: the Maps app first, then the web. */
export function mapsLinks(locationRaw: string | null | undefined): string[] {
  const location = locationRaw?.trim();
  if (!location) return [];
  const match = location.match(COORDINATES);
  const latitude = Number(match?.[1]);
  const longitude = Number(match?.[2]);
  const pin = Boolean(match) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
  const query = pin ? `${latitude},${longitude}` : location;
  const encoded = encodeURIComponent(query);
  // A geo: link opens the default maps app; text searches from 0,0 per the Android geo URI convention.
  const geo = `geo:${pin ? query : '0,0'}?q=${encoded}`;
  return [geo, `https://www.google.com/maps/search/?api=1&query=${encoded}`];
}
