// Genera los íconos PNG de la PWA y el favicon a partir del símbolo de PagoIA.
// Uso: node scripts/generar-iconos-marca.mjs
import sharp from "sharp"
import { writeFile } from "node:fs/promises"

const NAVY = "#0A1929"
const MARK_PATHS = (spark) => `
  <path fill="url(#g)" fill-rule="evenodd" d="M16 8H38a14 14 0 0 1 0 28H28V56l-3-3-3 3-3-3-3 3Z M28 16.5H37a5.5 5.5 0 0 1 0 11H28Z"/>
  <path fill="${spark}" d="M48 42.5Q49.2 48.8 55.5 50Q49.2 51.2 48 57.5Q46.8 51.2 40.5 50Q46.8 48.8 48 42.5Z"/>`
const GRADIENT = `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#00D4AA"/><stop offset="1" stop-color="#0066FF"/></linearGradient></defs>`

// Símbolo recortado a su caja, fondo transparente (favicons).
const bareMark = (spark) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="9.75 6.75 52 52">${GRADIENT}${MARK_PATHS(spark)}</svg>`

// Símbolo centrado sobre azul marino. Al 62% cabe en la zona segura de los íconos "maskable".
const tile = (scale) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${GRADIENT}
    <rect width="64" height="64" fill="${NAVY}"/>
    <g transform="translate(32 32) scale(${scale}) translate(-35.75 -32.75)">${MARK_PATHS("#F0479F")}</g>
  </svg>`

const outputs = [
  { file: "public/icon-light-32x32.png", svg: bareMark("#C2177A"), size: 32 },
  { file: "public/icon-dark-32x32.png", svg: bareMark("#F0479F"), size: 32 },
  { file: "public/apple-icon.png", svg: tile(0.62), size: 180 },
  { file: "public/icon-192.png", svg: tile(0.62), size: 192 },
  { file: "public/icon-512.png", svg: tile(0.62), size: 512 },
]

for (const { file, svg, size } of outputs) {
  const png = await sharp(Buffer.from(svg), { density: 72 * (size / 32) }).resize(size, size).png().toBuffer()
  await writeFile(file, png)
  console.log(`✓ ${file} (${size}×${size})`)
}
