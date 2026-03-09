# Nuvyon — Dashboard de Inteligência Operacional

Dashboard React para gestão de técnicos e agentes de ISP de fibra.
Cruza dados de OS, Atendimentos e SAC com análise de performance, health score de clientes e vereditos por colaborador.

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse: http://localhost:5173/dashboard-nuvyon/

## Publicando no GitHub Pages

1. Crie o repositório no GitHub com o nome `dashboard-nuvyon`
2. Configure o remote e faça o push:

```bash
git init
git add .
git commit -m "feat: dashboard nuvyon v1"
git remote add origin https://github.com/erjinfo/dashboard-nuvyon.git
git branch -M main
git push -u origin main
```

3. Publique no GitHub Pages:

```bash
npm run deploy
```

4. Acesse **Settings → Pages** no repositório, selecione branch `gh-pages` e salve.

Seu dashboard ficará em: `https://erjinfo.github.io/dashboard-nuvyon/`

## Atualizando

```bash
git add .
git commit -m "atualização"
git push
npm run deploy
```

## Arquivos do projeto

```
dashboard-nuvyon/
├── src/
│   ├── App.jsx       ← dashboard completo
│   └── main.jsx      ← entrada React
├── index.html
├── package.json
├── vite.config.js    ← lembre de ajustar o base/ se mudar o nome do repo
└── .gitignore
```
