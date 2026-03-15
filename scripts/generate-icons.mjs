import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import pngToIco from 'png-to-ico'

const __dirname = dirname(fileURLToPath(import.meta.url))
const assetsDir = join(__dirname, '..', 'assets')
const svgPath = join(assetsDir, 'icon.svg')

async function generate() {
  const svgBuffer = readFileSync(svgPath)

  // Generate PNG at 512x512
  const png512 = await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toBuffer()
  writeFileSync(join(assetsDir, 'icon.png'), png512)
  console.log('Created icon.png (512x512)')

  // Generate PNG at 256x256 for ICO
  const png256 = await sharp(svgBuffer)
    .resize(256, 256)
    .png()
    .toBuffer()

  // Generate ICO for Windows
  const ico = await pngToIco(png256)
  writeFileSync(join(assetsDir, 'icon.ico'), ico)
  console.log('Created icon.ico')

  console.log('Done! Note: icon.icns for macOS needs to be created on a Mac using iconutil.')
}

generate().catch(console.error)
