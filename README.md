# Roube o emprego das IAs

SPA satirica: pessoas enviam prompts e outras pessoas respondem manualmente, sem IA real.

## Mini tutorial de inicio

### 1) Pre-requisitos
- Node.js 20+ (recomendado)
- PostgreSQL rodando localmente

### 2) Instalar dependencias
```bash
npm install
```

### 3) Configurar banco
Edite o arquivo `.env` com sua conexao Postgres:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/roube_ias?schema=public"
```

### 4) Gerar client Prisma + criar tabelas
```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
```

### 5) Rodar o projeto
```bash
npm run dev
```

Abra `http://localhost:3000`.

## Scripts uteis
- `npm run dev`: sobe ambiente local
- `npm run lint`: valida lint
- `npm run test`: roda testes (Vitest)
- `npm run build`: build de producao

## Fluxo rapido para testar
1. Abra duas abas/janelas no navegador.
2. Em uma, envie um prompt.
3. Na outra, troque para modo `Trabalhador`, assuma o prompt e responda.
4. Volte na primeira para ver o status mudar para `Respondido`.
