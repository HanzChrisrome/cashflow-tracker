const pesoFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

export function formatPeso(value: string | number) {
  return pesoFormatter.format(Number(value));
}

export function sumPeso(values: Array<string | number>) {
  const totalCentavos = values.reduce<number>(
    (sum, value) => sum + Math.round(Number(value) * 100),
    0,
  );
  return formatPeso(totalCentavos / 100);
}
