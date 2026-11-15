/** Plataformas disponíveis como logo da conta (imagens em public/logos). */
export interface Brand { id: string; name: string; logo: string; color: string }

export const BRANDS: Brand[] = [
  { id: 'livelo', name: 'Livelo', logo: '/logos/livelo.png', color: '#FF0A8C' },
  { id: 'smiles', name: 'Smiles', logo: '/logos/smiles.jpg', color: '#E8661C' },
  { id: 'latam', name: 'LATAM Pass', logo: '/logos/latam.jpg', color: '#5A0F55' },
  { id: 'azul', name: 'Azul Fidelidade', logo: '/logos/azul.jpg', color: '#0A6BD1' },
]

export const brandById = (id: string) => BRANDS.find((b) => b.id === id)

/** Encontra a plataforma pelo nome da conta (ex.: "LATAM" → LATAM Pass). */
export function brandForName(name: string): Brand | undefined {
  const n = name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
  return BRANDS.find((b) => {
    const bn = b.name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    return bn === n || bn.startsWith(n) || n.startsWith(bn.split(' ')[0])
  })
}

export const BRAND_PREFIX = 'brand:'
export const IMG_PREFIX = 'img:'

/** Reduz a imagem enviada para um quadrado pequeno (PNG em data URL) para guardar junto da conta. */
export async function fileToLogo(file: File, size = 128): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Envie um arquivo de imagem (PNG, JPG, SVG ou WebP).')
  if (file.size > 5_000_000) throw new Error('A imagem passa de 5 MB.')
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    const w = img.naturalWidth || size
    const h = img.naturalHeight || size
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')!
    const scale = Math.min(size / w, size / h)
    ctx.drawImage(img, (size - w * scale) / 2, (size - h * scale) / 2, w * scale, h * scale)
    return IMG_PREFIX + canvas.toDataURL('image/png')
  } finally {
    URL.revokeObjectURL(url)
  }
}
