export function formatRupiah(value: number | string) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "Rp0";
  }

  return `Rp${number.toLocaleString("id-ID")}`;
}

export function formatNumber(value: number | string) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number.toLocaleString("id-ID");
}