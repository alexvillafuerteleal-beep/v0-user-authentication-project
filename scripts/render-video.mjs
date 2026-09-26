// Renderiza video/explicativo/index.html a MP4 (H.264, 1920×1080, 30 fps) cuadro por cuadro.
//
//   FFMPEG_PATH=/ruta/a/ffmpeg node scripts/render-video.mjs
//   node scripts/render-video.mjs --frames 3,10,21,30,40,47   # solo capturas de prueba (PNG)
//
// Requiere un ffmpeg con libx264 (por ejemplo el de ffmpeg-static) y el Chromium de Playwright
// (npx playwright install chromium). La composición controla una línea de tiempo de GSAP
// pausada; aquí se avanza cuadro por cuadro, así el resultado no depende de la velocidad de la PC.
import { chromium } from "@playwright/test"
import { spawn } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"
import sharp from "sharp"

const FPS = 30
const W = 1920
const H = 1080
const OUT_DIR = "public/video"
const OUT = path.join(OUT_DIR, "pagoia-explicativo.mp4")
const POSTER = path.join(OUT_DIR, "pagoia-explicativo-poster.webp")
const POSTER_AT = 21 // segundo: escena del escaneo, con los campos capturados

const framesArg = process.argv.indexOf("--frames")
const testFrames = framesArg > -1 ? process.argv[framesArg + 1].split(",").map(Number) : null

// Sin el Chromium de Playwright se usa Microsoft Edge, que viene con Windows.
const browser = await chromium.launch().catch(() => chromium.launch({ channel: "msedge" }))
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
await page.goto(pathToFileURL(path.resolve("video/explicativo/index.html")).href, { waitUntil: "domcontentloaded" })
await page.waitForFunction(() => window.__ready === true, null, { timeout: 60_000 })
const duration = await page.evaluate(() => window.__duration)
const seek = (t) => page.evaluate((s) => window.__seek(s), t)

fs.mkdirSync(OUT_DIR, { recursive: true })

if (testFrames) {
  const dir = process.env.FRAMES_DIR || "video/explicativo/frames"
  fs.mkdirSync(dir, { recursive: true })
  for (const t of testFrames) {
    await seek(t)
    await page.screenshot({ path: path.join(dir, `t${String(t).padStart(2, "0")}.png`) })
  }
  console.log(`Capturas en ${dir}`)
  await browser.close()
  process.exit(0)
}

const ffmpeg = spawn(
  process.env.FFMPEG_PATH || "ffmpeg",
  ["-y", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
   "-c:v", "libx264", "-preset", "slow", "-crf", "21", "-pix_fmt", "yuv420p", "-movflags", "+faststart", OUT],
  { stdio: ["pipe", "inherit", "inherit"] },
)
const done = new Promise((resolve, reject) => {
  ffmpeg.on("error", reject)
  ffmpeg.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg terminó con código ${code}`))))
})

const total = Math.round(duration * FPS)
const started = Date.now()
for (let i = 0; i < total; i++) {
  await seek(i / FPS)
  const jpg = await page.screenshot({ type: "jpeg", quality: 95 })
  if (!ffmpeg.stdin.write(jpg)) await new Promise((r) => ffmpeg.stdin.once("drain", r))
  if (i % 150 === 0) console.log(`cuadro ${i}/${total} · ${Math.round((Date.now() - started) / 1000)} s`)
}
ffmpeg.stdin.end()
await done

await seek(POSTER_AT)
await sharp(await page.screenshot({ type: "png" })).resize(1280).webp({ quality: 82 }).toFile(POSTER)
await browser.close()
console.log(`Listo: ${OUT} (${(fs.statSync(OUT).size / 1e6).toFixed(1)} MB) y ${POSTER}`)
