# Nuvyon — Dashboard de Inteligência Operacional

## 🚀 Deploy automático via GitHub Actions

Com o arquivo `.github/workflows/deploy.yml` incluído, **basta fazer push** que o GitHub compila e publica sozinho.

### Passo a passo (única vez)

```bash
# 1. Instale as dependências (só para rodar local)
npm install

# 2. Suba o projeto no GitHub
git init
git add .
git commit -m "feat: dashboard nuvyon v1"
git remote add origin https://github.com/erjinfo/dashboard-nuvyon.git
git branch -M main
git push -u origin main
```

### Ativar o GitHub Pages (única vez)

1. Abra o repositório no GitHub
2. Vá em **Settings → Pages**
3. Em **Source**, selecione **Deploy from a branch**
4. Branch: **gh-pages** → pasta **/ (root)**
5. Clique **Save**

Aguarde ~2 minutos. O GitHub Actions vai compilar e publicar automaticamente.

✅ Dashboard em: `https://erjinfo.github.io/dashboard-nuvyon/`

---

### Para atualizar no futuro

Apenas faça push — o deploy acontece automaticamente:

```bash
git add .
git commit -m "atualização"
git push
```

---

### Rodar localmente

```bash
npm install
npm run dev
# Acesse: http://localhost:5173/dashboard-nuvyon/
```
