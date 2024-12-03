export function normalizeData(data: Float32Array): Uint8Array {
  const min = Math.min(...data)
  const max = Math.max(...data)

  return new Uint8Array(data.map(value => ((value - min) / (max - min)) * 255))
}