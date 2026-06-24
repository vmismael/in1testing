# Design — Roadmap de Ferramentas Client-Side do ALLIN1

**Data:** 2026-06-23
**Status:** Aprovado (design); pendente plano de implementação.

> **Atualização 2026-06-23 — produto agora em INGLÊS.** O time decidiu rodar anúncios
> para EUA/internacional (RPM maior), então conteúdo, UI e **slugs** são em inglês. Os
> slugs em pt-BR das tabelas abaixo viram inglês — ex.: `word-counter`,
> `qr-code-generator`, `password-generator`, `image-converter`, `image-resizer`,
> `split-pdf`, `image-to-pdf`, `pdf-to-jpg`, `json-formatter`, `base64`,
> `background-remover`, `mp4-to-mp3`, `audio-converter`, `compress-pdf`, `crop-image`,
> `video-to-gif`, `video-converter`, `trim-video`, `rotate-pdf`, `watermark-pdf`,
> `organize-pdf`, `case-converter`, `color-converter`, `hash-generator`. Rota de
> categoria: `/category/[slug]`.

## Contexto e objetivo

O ALLIN1 é um SaaS gratuito de ferramentas utilitárias (pt-BR), monetizado por
anúncios (AdSense) + captura de leads, com SEO programático como motor de
crescimento. Hoje existem 4 ferramentas: Juntar PDF, Comprimir Imagem (client-side),
Encurtar URL (servidor/Supabase) e Reescritor de Texto IA (AI Gateway).

O objetivo deste roadmap é **expandir o catálogo** para capturar mais tráfego
orgânico, mantendo a disciplina de custo e a velocidade que definem o produto.

## Decisões estratégicas (tomadas com o usuário)

1. **100% client-side / custo zero.** Só entram ferramentas que rodam inteiramente
   no navegador (JS/WASM). Sem custo de servidor, escala infinita, privacidade.
2. **Priorização por volume de busca + facilidade.** Atacar primeiro o maior tráfego
   orgânico com o menor esforço de implementação.
3. **Rollout em ondas de "SEO rápido".** Onda 1 = triviais de altíssimo volume;
   Onda 2 = vitrine (alto volume, médio esforço, WASM); Onda 3 = cauda longa.

### Fora de escopo (por enquanto)
- **PDF → Word**: inviável client-side com fidelidade (precisa de servidor).
- **Download do YouTube**: impossível client-side (precisa de servidor para extrair
  streams) e viola os ToS do YouTube (risco legal). Descartado.
- **Track de IA** (resumir, traduzir, corrigir gramática — extensões do reescritor):
  usa o AI Gateway (tem custo). Fica como track **opcional**, fora da regra zero-custo,
  habilitável depois. A infra já existe (rota `/api/rewrite`).

## Padrão de implementação (o motor já existente)

Adicionar uma ferramenta = **1 objeto no `lib/tools/registry.ts`** (slug, categoria,
metaTitle/description, h1, intro, `sections` com conteúdo ≥800 palavras pt-BR, `faq`,
`howTo`, `accept`/`multiple`) **+ 1 componente processador** em
`components/tools/<nome>/` ligado no `switch` de `components/tools/tool-processor.tsx`
(lazy-load client-only). Página, metadata, sitemap e JSON-LD (FAQ/HowTo/WebApplication/
Breadcrumb) são gerados automaticamente. Processadores reaproveitam `FileDropzone`,
`lib/download.ts` e `lib/format.ts`.

**Toda ferramenta exige conteúdo SEO completo** (≥800 palavras + FAQ + HowTo em pt-BR).
Esse é o maior custo por ferramenta — não a lógica.

## Roadmap priorizado

> Intenção de busca: 🔥 alto · ◓ médio. Esforço relativo dado o padrão acima.

### Onda 1 — Ganhos rápidos (trivial/fácil, altíssimo volume)

| Ferramenta | slug | Categoria | Lib | Esforço | Busca |
|---|---|---|---|---|---|
| Contador de palavras e caracteres | `contador-de-palavras` | Texto e IA | JS puro | trivial | 🔥 |
| Gerador de QR Code | `gerador-qr-code` | Web | `qrcode` | fácil | 🔥 |
| Gerador de senha | `gerador-de-senha` | Web | `crypto` | trivial | 🔥 |
| Conversor de imagem (PNG/JPG/WebP) | `conversor-de-imagem` | Imagem | canvas | fácil | 🔥 |
| Redimensionar imagem | `redimensionar-imagem` | Imagem | canvas | fácil | 🔥 |
| Dividir PDF | `dividir-pdf` | PDF | `pdf-lib` | fácil | 🔥 |
| Imagem para PDF | `imagem-para-pdf` | PDF | `pdf-lib` | fácil | 🔥 |
| PDF para JPG | `pdf-para-jpg` | PDF | `pdf.js` | médio | 🔥 |
| Formatador de JSON | `formatar-json` | Web | JS puro | fácil | 🔥 |
| Codificador Base64 | `base64` | Web | `btoa/atob` | trivial | ◓ |

### Onda 2 — Vitrine (alto volume, médio esforço, WASM)

| Ferramenta | slug | Categoria | Lib | Nota |
|---|---|---|---|---|
| Removedor de fundo ⭐ | `remover-fundo` | Imagem | `@imgly/background-removal` | modelo IA on-device; primeiro uso pesado |
| MP4 para MP3 ⭐ | `mp4-para-mp3` | Vídeo e Áudio | `ffmpeg.wasm` (single-thread) | preenche a categoria hoje vazia |
| Conversor de áudio ⭐ | `conversor-de-audio` | Vídeo e Áudio | `ffmpeg.wasm` | MP3/WAV/OGG/M4A |
| Comprimir PDF | `comprimir-pdf` | PDF | `pdf-lib` + canvas | compressão **básica** (downsample de imagens); ressalva de qualidade na copy |
| Cortar imagem (crop) | `cortar-imagem` | Imagem | canvas + cropper | UI de recorte |

### Onda 3 — Cauda longa (mesmo padrão)

| Ferramenta | slug | Categoria | Lib |
|---|---|---|---|
| Vídeo para GIF | `video-para-gif` | Vídeo e Áudio | `ffmpeg.wasm` |
| Conversor de vídeo (pequeno) | `conversor-de-video` | Vídeo e Áudio | `ffmpeg.wasm` |
| Cortar vídeo (trim) | `cortar-video` | Vídeo e Áudio | `ffmpeg.wasm` |
| Rotacionar PDF | `rotacionar-pdf` | PDF | `pdf-lib` |
| Marca d'água em PDF | `marca-dagua-pdf` | PDF | `pdf-lib` |
| Organizar páginas PDF | `organizar-pdf` | PDF | `pdf-lib` + `pdf.js` |
| Conversor de maiúsculas/minúsculas | `conversor-de-caso` | Texto e IA | JS puro |
| Conversor de cores (HEX/RGB/HSL) | `conversor-de-cores` | Web | JS puro |
| Gerador de hash (MD5/SHA-256) | `gerador-de-hash` | Web | SubtleCrypto + `spark-md5` |

**Backlog (mesmo molde, sob demanda):** gerador de UUID, conversor de timestamp,
Markdown → HTML, gerador de Lorem Ipsum, comparar texto (diff), remover EXIF/metadados,
gerador de favicon, imagem ↔ Base64.

## Dependências novas (por onda)

- **Onda 1:** `qrcode` (+ `@types/qrcode`), `pdfjs-dist`. (`pdf-lib` já instalado.)
- **Onda 2:** `@imgly/background-removal`, `@ffmpeg/ffmpeg` + `@ffmpeg/util`, lib de crop
  (ex.: `react-easy-crop`).
- **Onda 3:** `spark-md5` (MD5); SHA via SubtleCrypto nativo. Opcionais: `marked`
  (Markdown), `diff` (comparar texto).

## Notas técnicas (decisões de implementação)

- **ffmpeg.wasm em single-thread (importante).** A versão multithread exige
  *cross-origin isolation* (headers `COOP: same-origin` + `COEP: require-corp`).
  Esses headers **quebram recursos cross-origin** — incluindo **Google AdSense** e
  analytics — que são centrais para a monetização. Portanto usamos o **ffmpeg.wasm
  single-thread** (mais lento, porém sem headers e sem quebrar os anúncios). Limites de
  tamanho de arquivo serão comunicados na UI.
- **Removedor de fundo:** carregar o processador via `next/dynamic` (já é o padrão); o
  modelo (~vários MB) baixa no primeiro uso — exibir progresso e aviso.
- **Comprimir PDF:** ganho real é limitado no navegador (re-encoda imagens embutidas via
  canvas). Posicionar como "compressão básica" e medir antes/depois (como já fazemos no
  Comprimir Imagem).
- **6ª categoria "Utilidades/Dev" (decisão aberta):** QR, senha, JSON, Base64, hash e
  cores hoje mapeiam para "Web". Reavaliar separar numa categoria própria quando houver
  > ~5 utilitários. Não bloqueia o roadmap.
- **Categoria "Vídeo e Áudio"** deixa de estar vazia já na Onda 2 (some o estado
  "chega em breve").
- **Conversor de imagem:** é **uma** ferramenta (`conversor-de-imagem`) com seletor de
  formato de saída (PNG/JPG/WebP). Páginas dedicadas por par de formato (ex.:
  `png-para-jpg`, `webp-para-jpg`) são uma **expansão de SEO futura** (backlog), gerada
  pelo mesmo motor, não parte da Onda 1.

## Critérios de "pronto" por ferramenta

1. Objeto no registry com conteúdo pt-BR ≥800 palavras + FAQ + HowTo.
2. Processador client-side funcional (lazy-load), reusando `FileDropzone`/`download`/`format`.
3. `npm run build` gera a página como SSG; `npm run lint` limpo.
4. Verificação manual no navegador: a ferramenta produz o resultado esperado e baixa o arquivo.
5. SEO automático conferido (title/canonical/JSON-LD/sitemap) — herdado do motor.

## Verificação do roadmap como um todo
- Cada onda é um lote independente; entregar e validar onda a onda.
- Métrica de sucesso: novas páginas indexáveis no `sitemap.xml`, build/lint verdes, e
  (pós-deploy) primeiras impressões orgânicas por ferramenta no Search Console.
