# Nexa AI

Nexa é uma plataforma SaaS de chat com IA — moderna, futurista e premium. Usuários podem conversar com a IA, gerenciar conversas, e fazer upgrade para o plano PRO via Mercado Pago.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — rodar o servidor API (porta dinâmica)
- `pnpm --filter @workspace/nexa run dev` — rodar o frontend (porta dinâmica)
- `pnpm run typecheck` — typecheck completo em todos os pacotes
- `pnpm run build` — typecheck + build de todos os pacotes
- `pnpm --filter @workspace/api-spec run codegen` — regenerar hooks e schemas Zod do OpenAPI spec
- `pnpm --filter @workspace/db run push` — fazer push das mudanças do schema do DB (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — secret para sessões

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite + Tailwind CSS 4 + Framer Motion + Wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: express-session + bcryptjs
- Validação: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (do OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/nexa/` — Frontend React + Vite (rota `/`)
- `artifacts/api-server/` — Backend Express (rota `/api`)
- `lib/api-spec/openapi.yaml` — Contrato OpenAPI (source of truth)
- `lib/api-client-react/` — Hooks React Query gerados
- `lib/api-zod/` — Schemas Zod gerados
- `lib/db/src/schema/` — Schema do banco (users, conversations, messages, payments)
- `artifacts/api-server/src/routes/` — Rotas da API (auth, conversations, messages, plans, payments, webhook)
- `artifacts/api-server/src/lib/ai.ts` — Geração de respostas da IA
- `artifacts/api-server/src/lib/auth.ts` — Middlewares de autenticação e limites de plano

## Architecture decisions

- Auth via sessão HTTP (express-session + cookie httpOnly) — sem JWT para simplificar
- Schema-first via OpenAPI: spec → codegen → hooks + Zod schemas
- Resposta de IA via OpenAI (com fallback inteligente se a chave não estiver configurada)
- Plano FREE: 10 mensagens/dia. Plano PRO: ilimitado
- Reset diário de mensagens verificado a cada request (sem cron job necessário)
- Webhook do Mercado Pago ativa o plano PRO automaticamente

## Product

- Landing page moderna com CTA para registro
- Chat com histórico de conversas (sidebar + área principal)
- Sistema de autenticação (login/cadastro)
- Planos FREE vs PRO com tela de comparação
- Integração Mercado Pago preparada (Pix, checkout, webhook)
- Perfil do usuário com estatísticas de uso

## User preferences

- Projeto em português (BR)
- Design futurista, dark mode, premium
- Sem emojis na UI
- Código organizado e modular

## Variáveis de Ambiente necessárias

- `DATABASE_URL` — URL de conexão PostgreSQL (já configurada pelo Replit)
- `SESSION_SECRET` — Secret para sessões (já configurada)
- `OPENAI_API_KEY` — (opcional) Chave OpenAI para respostas reais da IA
- `MERCADO_PAGO_ACCESS_TOKEN` — (opcional) Token do Mercado Pago para pagamentos

## Como configurar o Mercado Pago

1. Acesse https://www.mercadopago.com.br/developers
2. Crie uma aplicação
3. Copie o Access Token (use o de Produção para produção, ou Sandbox para testes)
4. Configure como env var `MERCADO_PAGO_ACCESS_TOKEN`
5. O webhook estará em: `https://seu-dominio/api/webhook/mercadopago`

## Como configurar a IA (OpenAI)

1. Acesse https://platform.openai.com
2. Crie uma API Key
3. Configure como env var `OPENAI_API_KEY`
4. Sem a chave, o sistema usa respostas de fallback inteligentes

## Gotchas

- Sempre rodar codegen após mudar `lib/api-spec/openapi.yaml`
- O cookie de sessão usa `sameSite: "none"` em produção (necessário para HTTPS)
- O reset diário de mensagens é verificado a cada request de chat (sem cron)
- Para publicar no Render: configure as env vars DATABASE_URL, SESSION_SECRET, OPENAI_API_KEY e MERCADO_PAGO_ACCESS_TOKEN

## Pointers

- Ver `pnpm-workspace` skill para estrutura do workspace, TypeScript setup e detalhes de pacotes
