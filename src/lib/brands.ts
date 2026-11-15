/**
 * Plataformas de pontos e milhas. Não são os logotipos oficiais: cada uma é um selo com as
 * iniciais e uma cor aproximada da marca. Para usar o logotipo real, envie a imagem na conta.
 */
export interface Brand { id: string; name: string; mark: string; bg: string; fg?: string }

export const BRANDS: Brand[] = [
  { id: 'livelo', name: 'Livelo', mark: 'Li', bg: '#EC008C' },
  { id: 'smiles', name: 'Smiles', mark: 'Sm', bg: '#FF7A00' },
  { id: 'latam', name: 'LATAM Pass', mark: 'LA', bg: '#D4003C' },
  { id: 'azul', name: 'Azul Fidelidade', mark: 'Az', bg: '#0033A0' },
  { id: 'esfera', name: 'Esfera', mark: 'Es', bg: '#009C8C' },
  { id: 'iupp', name: 'Iupp', mark: 'Iu', bg: '#FF6200' },
  { id: 'dotz', name: 'Dotz', mark: 'Do', bg: '#F15A29' },
  { id: 'kmv', name: 'Km de Vantagens', mark: 'Km', bg: '#0B5FA5' },
  { id: 'c6', name: 'C6 Átomos', mark: 'C6', bg: '#242424' },
  { id: 'inter', name: 'Inter Loop', mark: 'In', bg: '#FF7A00' },
  { id: 'nubank', name: 'Nubank Rewards', mark: 'Nu', bg: '#820AD1' },
  { id: 'amex', name: 'Membership Rewards', mark: 'MR', bg: '#006FCF' },
  { id: 'aadvantage', name: 'AAdvantage', mark: 'AA', bg: '#0078D2' },
  { id: 'united', name: 'MileagePlus', mark: 'UA', bg: '#1C3F94' },
  { id: 'delta', name: 'SkyMiles', mark: 'DL', bg: '#C01933' },
  { id: 'flyingblue', name: 'Flying Blue', mark: 'FB', bg: '#002060' },
  { id: 'tap', name: 'TAP Miles&Go', mark: 'TP', bg: '#D2232A' },
  { id: 'iberia', name: 'Iberia Plus', mark: 'Ib', bg: '#D7192D' },
  { id: 'lifemiles', name: 'LifeMiles', mark: 'LM', bg: '#DA291C' },
  { id: 'copa', name: 'ConnectMiles', mark: 'CM', bg: '#0072CE' },
  { id: 'emirates', name: 'Emirates Skywards', mark: 'EK', bg: '#D71921' },
  { id: 'qatar', name: 'Privilege Club', mark: 'QR', bg: '#5C0632' },
  { id: 'turkish', name: 'Miles&Smiles', mark: 'TK', bg: '#C70A0C' },
  { id: 'accor', name: 'Accor ALL', mark: 'AL', bg: '#2A2A5E' },
  { id: 'bonvoy', name: 'Marriott Bonvoy', mark: 'MB', bg: '#9B1B30' },
  { id: 'hilton', name: 'Hilton Honors', mark: 'HH', bg: '#104C97' },
  { id: 'ihg', name: 'IHG One Rewards', mark: 'IH', bg: '#2E7D4F' },
  { id: 'shell', name: 'Shell Box', mark: 'Sh', bg: '#FBCE07', fg: '#1a1a1a' },
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
