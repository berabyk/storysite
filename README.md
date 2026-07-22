# Hikâye — hikâye paylaşım sitesi

Kısa hikâyeler ve karakterler için, **okumak üzere tasarlanmış** bir site.
İçerik **Notion**'da yazılır; site **derleme anında** Notion'dan çekilip tamamen
statik hale getirilir. Böylece çalışma anında hiç Notion çağrısı yapılmaz ve site
CDN hızında açılır.

## Teknoloji

- **React 18 + Vite 6 + TypeScript**
- **shadcn/ui** (Radix + Tailwind CSS v4)
- **React Router** (SPA yönlendirme, `/tr` ve `/en`)
- **Notion** — içerik kaynağı (yalnızca derleme anında, `scripts/fetch-notion.mjs`)
- Fontlar self-host (Fraunces + Inter, `@fontsource`)

## Nasıl çalışır? (mimari)

```
Notion  ──(npm run content, derleme anında)──►  public/content/*.json + resimler
                                                        │
                                          tarayıcı bunları fetch eder (runtime'da Notion YOK)
                                                        ▼
                                            React + shadcn arayüzü
```

- `scripts/fetch-notion.mjs`: Notion'daki hikâye/karakterleri çeker, gövdeleri HTML'e
  render eder ve `public/content/` altına JSON olarak yazar. Notion'un **süresi dolan
  resim URL'lerini** indirip yerelleştirir (resimler asla kırılmaz, daha da hızlı).
- `src/lib/content.ts`: tek veri erişim katmanı. Bugün statik JSON okur. **İleride
  gerçek bir backend (Linux sunucu) yapınca yalnızca burayı değiştir** — `VITE_CONTENT_BASE`
  ortam değişkenini API adresine yönlendir, arayüzün geri kalanı hiç değişmez.

> `NOTION_TOKEN` tanımlı değilse `npm run content` hiçbir şeyi bozmadan çıkar ve
> depoda hazır duran **örnek (seed) içerik** kullanılır. Yani token olmadan da site
> derlenir ve tasarım görünür.

## Kurulum

```bash
npm install
cp .env.example .env   # Notion bilgilerini doldur (opsiyonel — boşsa seed kullanılır)
npm run dev            # http://localhost:5173
```

### Ortam değişkenleri (`.env`)

| Değişken | Açıklama |
| --- | --- |
| `NOTION_TOKEN` | Notion internal integration token |
| `NOTION_TR_DATABASE_ID` / `NOTION_EN_DATABASE_ID` | Hikâye veritabanları |
| `NOTION_CHARACTER_TR_DATABASE_ID` / `NOTION_CHARACTER_EN_DATABASE_ID` | Karakter veritabanları |
| `VITE_CONTENT_BASE` | (opsiyonel) İçeriğin okunacağı taban yol. Varsayılan `/content` |

Notion veritabanı property'leri (mevcut yapıyla aynı):

- **Hikâye**: `Title`, `Slug`, `Explanation`, `BannerImage`, `Status` (`Published`), `Characters` (multi-select)
- **Karakter**: `Name`, `Slug`, `Explanation`, `Image`, `Kind` (select)
- Bir karakterin hangi hikâyelerde geçtiği, hikâyenin `Characters` alanındaki değerin
  karakterin `Slug` (veya `Name`) değeriyle eşleşmesinden bulunur.

## Komutlar

| Komut | Ne yapar |
| --- | --- |
| `npm run dev` | Geliştirme sunucusu |
| `npm run content` | Notion'dan içeriği çekip `public/content/` üretir |
| `npm run build` | `content` + üretim derlemesi (`dist/`) |
| `npm run build:only` | İçeriği yeniden çekmeden sadece derler |
| `npm run preview` | `dist/`'i yerelde önizler |
| `npm run typecheck` | TypeScript kontrolü |

## Yayınlama (deploy)

`npm run build` çıktısı `dist/` klasörüdür — statik olarak her yere konur.
SPA yönlendirmesi için gerekli fallback dosyaları hazır: `public/_redirects`
(Netlify / Cloudflare Pages) ve `vercel.json` (Vercel).

**Cloudflare Pages / Vercel / Netlify** için önerilen ayarlar:

- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: `.env` içindeki `NOTION_*` değerleri

Böylece her deploy'da içerik Notion'dan taze çekilir.

### Yeni hikâye yayınlayınca güncelleme

İçerik derleme anında donduğu için, Notion'da yeni bir hikâye yayınlayınca siteyi
yeniden derlemek gerekir. Seçenekler:

1. Hosting panelinden **"Redeploy"** (tek tık).
2. Notion otomasyonu / bir webhook ile deploy hook tetikleme.
3. Zamanlanmış (ör. günlük) otomatik yeniden derleme.

## İleride: kendi backend'in

Linux sunucu alıp gerçek bir backend yazmak istediğinde:

1. Backend'i, bugünkü JSON ile **aynı şekilde** cevap verecek uçlarla yaz
   (`/content/tr/stories.json` vb.) — ya da istediğin şemayı kullan.
2. `src/lib/content.ts` içindeki `getStories/getStory/getCharacters/getCharacter`
   fonksiyonlarını yeni API'ye göre güncelle (veya sadece `VITE_CONTENT_BASE`'i ayarla).
3. Arayüzün geri kalanına dokunmana gerek yok.

Bu sayede Notion'dan kendi backend'ine geçiş, tek dosyalık bir değişikliktir.
