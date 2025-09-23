export const formatShutterSpeed = (exposureTime: number): string => {
  if (exposureTime >= 1) return `${exposureTime}s`
  return `1/${Math.round(1 / exposureTime)}`
}

export const formatDirection = (direction: number): string => {
  const directions = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ]
  const index = Math.round(direction / 22.5) % 16
  return `${Math.round(direction)}° ${directions[index]}`
}
