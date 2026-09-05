export type SearchableResource = {
  id: string;
  owner_id: string;
  title: string;
  category: string;
  custom_category?: string | null;
  description: string | null;
  quantity: number;
  unit: string;
  condition?: string | null;
  price?: number | null;
  negotiation_percent?: number | null;
  images?: string[] | null;
  province?: string | null;
  province_code?: string | null;
  city?: string | null;
  city_code?: string | null;
  district?: string | null;
  district_code?: string | null;
  status: string;
  created_at: string;
};

const SYNONYMS: Record<string, string[]> = {
  kopi: ["ampas", "ampas kopi", "coffee", "grounds", "seduhan", "organik"],
  ampas: ["kopi", "ampas kopi", "tahu", "kelapa", "organik"],
  plastik: ["botol", "hdpe", "pet", "ldpe", "pp", "tutup", "cacahan", "kresek"],
  hdpe: ["plastik", "botol sampo", "tutup botol", "jeriken"],
  pet: ["plastik", "botol air", "mineral"],
  kardus: ["karton", "kertas", "box", "packaging", "packing", "corrugated", "duplex"],
  kertas: ["kardus", "karton", "hvs", "arsip", "buku"],
  kain: ["perca", "tekstil", "textile", "katun", "rayon", "garmen", "konveksi"],
  perca: ["kain", "tekstil", "garmen", "sisa konveksi", "katun"],
  kayu: ["palet", "pallet", "pinus", "serbuk", "papan", "peti"],
  palet: ["kayu", "pallet", "pinus", "logistik"],
  minyak: ["jelantah", "used cooking oil", "uco", "goreng"],
  jelantah: ["minyak", "minyak bekas", "biodiesel"],
  logam: ["besi", "tembaga", "aluminium", "seng", "kaleng"],
  besi: ["logam", "scrap", "baja", "pipa"],
  elektronik: ["ewaste", "e-waste", "pcb", "komponen", "baterai", "kabel"],
};

function expandTokens(query: string): string[] {
  const clean = query.toLowerCase().trim();
  const rawTokens = clean.split(/\s+/).filter(Boolean);
  const tokenSet = new Set<string>(rawTokens);

  // Add synonyms
  for (const token of rawTokens) {
    if (SYNONYMS[token]) {
      SYNONYMS[token].forEach((syn) => tokenSet.add(syn.toLowerCase()));
    }
  }

  // Multi-word phrase check
  for (const [key, syns] of Object.entries(SYNONYMS)) {
    if (clean.includes(key)) {
      syns.forEach((syn) => tokenSet.add(syn.toLowerCase()));
    }
  }

  return Array.from(tokenSet);
}

export function rankAndFilterResources(
  resources: SearchableResource[],
  filters: {
    query?: string;
    category?: string;
    province?: string;
    city?: string;
    district?: string;
  }
): SearchableResource[] {
  const { query = "", category = "all", province, city, district } = filters;
  const cleanQuery = query.trim().toLowerCase();
  const tokens = cleanQuery ? expandTokens(cleanQuery) : [];

  const scored = resources
    .map((res) => {
      // 1. Category Filter
      if (category !== "all") {
        if (category === "other") {
          if (res.category !== "other") return null;
        } else if (res.category?.toLowerCase() !== category.toLowerCase()) {
          return null;
        }
      }

      // 2. Location Cascading Filter
      if (province && province !== "all") {
        const matchesProv =
          res.province?.toLowerCase().includes(province.toLowerCase()) ||
          res.province_code === province;
        if (!matchesProv) return null;
      }

      if (city && city !== "all") {
        const matchesCity =
          res.city?.toLowerCase().includes(city.toLowerCase()) ||
          res.city_code === city;
        if (!matchesCity) return null;
      }

      if (district && district !== "all") {
        const matchesDistrict =
          res.district?.toLowerCase().includes(district.toLowerCase()) ||
          res.district_code === district;
        if (!matchesDistrict) return null;
      }

      // If no query string, pass location-filtered resource with base score
      if (!cleanQuery) {
        return { resource: res, score: 1 };
      }

      // 3. Smart Text & Synonyms Relevance Scoring
      let score = 0;
      const titleLower = (res.title || "").toLowerCase();
      const customCatLower = (res.custom_category || "").toLowerCase();
      const descLower = (res.description || "").toLowerCase();
      const catLower = (res.category || "").toLowerCase();
      const cityLower = (res.city || "").toLowerCase();
      const distLower = (res.district || "").toLowerCase();

      // Exact phrase match in title or custom category (top weight)
      if (titleLower.includes(cleanQuery)) score += 120;
      if (customCatLower.includes(cleanQuery)) score += 100;
      if (descLower.includes(cleanQuery)) score += 40;

      // Token & Synonym matching
      for (const token of tokens) {
        if (titleLower.includes(token)) score += 30;
        if (customCatLower.includes(token)) score += 25;
        if (catLower.includes(token)) score += 20;
        if (descLower.includes(token)) score += 10;
        if (cityLower.includes(token)) score += 15;
        if (distLower.includes(token)) score += 15;
      }

      if (score === 0) return null;

      return { resource: res, score };
    })
    .filter((item): item is { resource: SearchableResource; score: number } => item !== null);

  // Sort descending by score, then newest
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.resource.created_at).getTime() - new Date(a.resource.created_at).getTime();
  });

  return scored.map((item) => item.resource);
}
