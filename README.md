# Nuvyon — Dashboard de Inteligência Operacional

Dashboard React para gestão de técnicos e agentes de ISP de fibra.

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse: http://localhost:5173/dashboard-nuvyon/

## Publicando no GitHub Pages

```bash
# 1. Instalar dependências
npm install

# 2. Subir o código
git init
git add .
git commit -m "feat: dashboard nuvyon v1"
git remote add origin https://github.com/erjinfo/dashboard-nuvyon.git
git branch -M main
git push -u origin main

# 3. Publicar no GitHub Pages
npm run deploy
```

4. Acesse **Settings → Pages** no repositório → branch `gh-pages` → **Save**

Dashboard disponível em: `https://erjinfo.github.io/dashboard-nuvyon/`

## Atualizando

```bash
git add .
git commit -m "atualização"
git push
npm run deploy
```
