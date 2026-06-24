# Plano: Cybersegurança — In1

Adaptado do plano do site Lab Paulista. O In1 tem perfil de risco diferente: a maior ameaça
à estabilidade não é externa, é a própria CSP — política mal calibrada quebra AdSense,
ffmpeg.wasm e o background-removal. Por isso a CSP entra em **Report-Only** e só vira enforce
após validação em deploy real. **COOP/COEP nunca entram** (quebram AdSense + single-thread WASM).

## Cobertura

| # | Área | Status |
|---|------|--------|
| 01 | Dependency Audit | ✓ Executado — 3 moderate (postcss bundled no Next, sem fix, build-time only); risco aceito |
| 02 | Cloud / Env Security | ✓ Verificado — `.env*` gitignored, secrets server-only, RLS ativo (service-role only) |
| 03 | Security Headers (não-CSP) | ✓ Implementado — `next.config.ts` |
| 04 | Content-Security-Policy | ◑ Report-Only no ar — pendente validar e virar enforce pós-deploy |
| 05 | Edge Proxy (middleware) | ✓ Implementado — `proxy.ts` |
| 06 | API Hardening | ✓ Implementado — rate-limit Upstash + guards Content-Type/body-size |
| 07 | Open Redirect | ✓ Corrigido — `lib/safe-url.ts` |
| 08 | Blue Team / Processo | ◑ Verificação pós-deploy pendente (tabela no fim) |
| — | Ofensivo / SIEM / infra própria | Não aplicável |

---

## Tópico 1 — Dependency Audit ✓
- `npm audit`: 3 moderate, todas o mesmo CVE de `postcss` (XSS no stringify de CSS)
  embarcado dentro do `next`. Sem fix disponível (transitivo); só afeta build-time de CSS,
  não explorável em runtime. Risco residual aceito até o Next.js atualizar o postcss bundled.
- `.gitignore` cobre `.env*` com exceção `!.env.example` ✓

## Tópico 2 — Cloud & Env Security ✓
- `.env.local` não versionado ✓
- `SUPABASE_SERVICE_ROLE_KEY` e `AI_GATEWAY_API_KEY` só em route handlers / `lib/supabase/server.ts`,
  nunca em `NEXT_PUBLIC_*` ✓
- RLS ativo em `leads` e `short_urls`; sem policies anon/auth — só o service-role (server) lê/escreve ✓
- Vercel força HTTPS + TLS automaticamente; HSTS reforçado via header

## Tópico 3 — Security Headers HTTP (não-CSP) ✓
**Arquivo:** `next.config.ts` → `headers()`

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

Notas:
- `X-Frame-Options: DENY` protege contra clickjacking; **não** afeta iframes de anúncio (In1 é o frame pai).
- `Permissions-Policy` nega camera/mic/geo — verificado que nenhuma tool usa (só `clipboard.writeText`).
- `X-XSS-Protection` omitido (depreciado; a CSP cobre XSS).

## Tópico 4 — Content-Security-Policy ◑ (Report-Only → enforce)
**Arquivo:** `next.config.ts`

Header atual: **`Content-Security-Policy-Report-Only`** (observa, não bloqueia). Cada origem
mapeia uma dependência real — remover uma quebra a feature:

- `unpkg.com` (script + **connect**): ffmpeg.wasm core via `toBlobURL` (= fetch)
- `staticimgly.com` (connect): modelo ONNX do background-removal (CDN default)
- `*.googlesyndication.com` / `*.doubleclick.net` / `google.com` (script + img + **frame**): AdSense + iframes de anúncio
- `googletagmanager.com` / `*.google-analytics.com`: Google Analytics
- `*.clarity.ms` / `c.bing.com`: Microsoft Clarity
- `'wasm-unsafe-eval'` em `script-src`: compilação WASM (ffmpeg + ONNX)
- `blob:` em `img-src`/`worker-src`: previews/downloads e workers das tools
- `connect-src` inclui o host Supabase (https + wss), derivado de `NEXT_PUBLIC_SUPABASE_URL`

**Excluídos de propósito:** `require-trusted-types-for` (quebraria `dangerouslySetInnerHTML`
do markdown/JSON-LD) e `frame-src 'self'` isolado (quebraria os ads). COOP/COEP ausentes.

**Para virar enforce:** após deploy Report-Only limpo, trocar `cspHeaderKey` para
`"Content-Security-Policy"` no `next.config.ts`. Nenhuma outra mudança.

## Tópico 5 — Edge Proxy ✓
**Arquivo:** `proxy.ts` (raiz — convenção do Next 16, ex-`middleware`)

- Path-blocking → 404: `/.env`, `/.env.local`, `/.git`, `/wp-admin`, `/wp-login.php`,
  `/phpmyadmin`, `/xmlrpc.php`, `/admin`
- CSRF: POST/PUT/PATCH/DELETE para `/api/*` com `Origin` ≠ host → 403 (só quando Origin presente)
- `X-Request-Id`: UUID por request
- `matcher` exclui `_next/static`, `_next/image`, favicon e arquivos com extensão — não toca
  workers/wasm/fonts/imagens das tools. `GET /s/[code]` passa livre.

## Tópico 6 — API Hardening ✓
**Arquivos:** `app/api/{leads,shorten,rewrite}/route.ts` + `lib/rate-limit.ts`

- Rate-limit por IP via **Upstash Redis** (sliding window; durável em serverless). Degrada
  graciosamente se as envs do Upstash não existirem (dev local não quebra):
  - `/api/leads`: 5/IP/60s · `/api/shorten`: 10/IP/60s · `/api/rewrite`: 8/IP/60s (IA = mais caro)
  - Excedido → 429 + `Retry-After`
- Content-Type guard: não-JSON → 415
- Body-size guard: `Content-Length` > 10KB → 413
- Validação Zod já existia em todas as rotas (mantida)
- Envs novas: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (no `.env.example`)

## Tópico 7 — Open Redirect ✓
**Arquivos:** `lib/safe-url.ts`, `app/s/[code]/route.ts`, `app/api/shorten/route.ts`

- `isSafeRedirectUrl()` — só `http:`/`https:`; rejeita `javascript:`, `data:`, `file:` etc.
- Aplicado na **criação** (shorten) e no **redirect** (`/s/[code]`, defense-in-depth). URL
  insegura no redirect → cai no fallback (home).

---

## Verificação pós-deploy (pendente)

| Teste | Ferramenta | Meta |
|-------|-----------|------|
| CSP Report-Only limpo | Console / relatórios no deploy | Sem violações relevantes antes do flip |
| Security headers | securityheaders.com | A / A+ |
| TLS / Observatory | observatory.mozilla.org | B+ |
| AdSense renderiza | Browser (deploy) | Ads carregam, sem erro de CSP |
| ffmpeg / bg-removal | Browser (deploy) | Conversão e remoção de fundo OK sob CSP enforce |
| Rate limit | 6+ POSTs < 60s (com Upstash) | 429 ao exceder |
| CSRF | POST de origin diferente | 403 |
| Path blocking | GET `/wp-admin` | 404 |
| Open redirect | encurtar `javascript:alert(1)` | bloqueado na criação / fallback no redirect |

## Processo contínuo
- `npm audit` mensal
- Nova origem (CDN/analytics) → atualizar allowlist da CSP **e** o proxy juntos
- Upgrade do Next.js quando houver fix do postcss bundled

## Próximo sprint
- Configurar Upstash Redis em produção (envs na Vercel) e validar 429
- Virar a CSP para enforce após Report-Only limpo
