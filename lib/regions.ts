export type Province = {
  code: string;
  name: string;
};

export type Regency = {
  code: string;
  province_code: string;
  name: string;
};

export type District = {
  code: string;
  regency_code: string;
  name: string;
};

const CACHE: {
  provinces: Province[] | null;
  regencies: Record<string, Regency[]>;
  districts: Record<string, District[]>;
} = {
  provinces: null,
  regencies: {},
  districts: {},
};

export async function fetchProvinces(): Promise<Province[]> {
  if (CACHE.provinces) return CACHE.provinces;
  try {
    const res = await fetch("/api/regions/provinces");
    if (!res.ok) throw new Error("Failed to fetch provinces");
    const json = await res.json();
    const data = (json.data || json || []) as Province[];
    CACHE.provinces = data;
    return data;
  } catch (err) {
    console.error("fetchProvinces error:", err);
    return [];
  }
}

export async function fetchRegencies(provinceCode: string): Promise<Regency[]> {
  if (!provinceCode) return [];
  if (CACHE.regencies[provinceCode]) return CACHE.regencies[provinceCode];
  try {
    const res = await fetch(`/api/regions/regencies/${provinceCode}`);
    if (!res.ok) throw new Error("Failed to fetch regencies");
    const json = await res.json();
    const data = (json.data || json || []) as Regency[];
    CACHE.regencies[provinceCode] = data;
    return data;
  } catch (err) {
    console.error("fetchRegencies error:", err);
    return [];
  }
}

export async function fetchDistricts(cityCode: string): Promise<District[]> {
  if (!cityCode) return [];
  if (CACHE.districts[cityCode]) return CACHE.districts[cityCode];
  try {
    const res = await fetch(`/api/regions/districts/${cityCode}`);
    if (!res.ok) throw new Error("Failed to fetch districts");
    const json = await res.json();
    const data = (json.data || json || []) as District[];
    CACHE.districts[cityCode] = data;
    return data;
  } catch (err) {
    console.error("fetchDistricts error:", err);
    return [];
  }
}
