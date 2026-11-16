import { describe, expect, it } from 'vitest'
import { matchesDestination as fn, parseRss } from '../../supabase/functions/promo-watch/index'
import { matchesDestination as app } from './promoMatch'

const RSS = `<?xml version="1.0"?><rss><channel><title>Blog</title>
<item><title><![CDATA[Voos para Salvador a partir de R$ 399 &#8211; ida e volta]]></title><link>https://exemplo.com/salvador</link><guid isPermaLink="false">https://exemplo.com/?p=1</guid><pubDate>Mon, 16 Nov 2026 10:00:00 +0000</pubDate></item>
<item><title>Promo&#8217;s de Natal &amp; Ano Novo</title><link>https://exemplo.com/natal</link><pubDate>Mon, 16 Nov 2026 09:00:00 +0000</pubDate></item>
</channel></rss>`

describe('promo-watch', () => {
  it('lê itens do RSS (CDATA, entidades, guid ausente)', () => {
    const items = parseRss(RSS, 'Blog')
    expect(items).toHaveLength(2)
    expect(items[0]).toMatchObject({ guid: 'https://exemplo.com/?p=1', link: 'https://exemplo.com/salvador', source: 'Blog' })
    expect(items[0].title).toBe('Voos para Salvador a partir de R$ 399 – ida e volta')
    expect(items[1].guid).toBe('https://exemplo.com/natal')
    expect(items[1].title).toBe('Promo’s de Natal & Ano Novo')
  })
  it('usa o mesmo casamento do app', () => {
    const titles = ['Voos para Salvador', 'Promoção de Natal', 'Voos para Natal/RN', 'Voos para Porto Alegre', 'GRU → LIS', 'Voos para o Rio']
    const dests = [{ iata: 'SSA', city: 'Salvador' }, { iata: 'NAT', city: 'Natal' }, { iata: 'OPO', city: 'Porto' }, { iata: 'LIS', city: 'Lisboa' }, { iata: 'GIG', city: 'Rio de Janeiro' }]
    for (const t of titles) for (const d of dests) expect(fn(t, d)).toBe(app(t, d))
  })
})
