# APlica Manutenção — Guia para Iniciantes (passo a passo)

Se você nunca fez app, tudo bem. Siga **exatamente** esta ordem.

---

## 1) O que você precisa instalar no notebook

### Windows
1. Instale o **Node.js LTS**: https://nodejs.org
2. Instale o **Git**: https://git-scm.com/download/win
3. Instale o **VS Code**: https://code.visualstudio.com

### Mac
1. Instale o **Node.js LTS**: https://nodejs.org
2. Instale o **Git** (ou `xcode-select --install` no Terminal)
3. Instale o **VS Code**: https://code.visualstudio.com

---

## 2) Onde abrir os códigos

1. Abra o **VS Code**.
2. Clique em **File > Open Folder**.
3. Selecione a pasta do projeto `APlica`.
4. No menu do VS Code, clique em **Terminal > New Terminal**.

> É nesse terminal que você vai colar os comandos.

---

## 3) Como testar no celular (modo mais fácil, sem APK)

1. No celular Android, instale o app **Expo Go** (Play Store).
2. No terminal do VS Code (na pasta do projeto), rode:

```bash
npm install
npm run start
```

3. Aguarde aparecer um **QR code** no terminal.
4. Deixe celular e notebook na **mesma rede Wi‑Fi**.
5. Abra o **Expo Go** no celular.
6. Toque em **Scan QR Code** e escaneie o QR.
7. O app vai abrir no celular.

---

## 4) Como gerar APK (instalar como app normal)

No terminal do VS Code, rode na ordem:

```bash
npm install
npx expo login
npx eas build:configure
npx eas build -p android --profile preview
```

### O que vai acontecer
- `expo login`: você entra na sua conta Expo.
- `eas build:configure`: prepara o projeto para build.
- `eas build ...`: cria o APK na nuvem.

Quando terminar, ele mostra um **link do APK**.

---

## 5) Como instalar o APK no celular

1. Envie o link para seu celular (WhatsApp, e-mail, etc.).
2. Abra o link no celular.
3. Baixe o APK.
4. Toque para instalar.
5. Se o Android pedir, permita **instalar apps desconhecidos** para o navegador usado.
6. App instalado.

---

## 6) Onde colocar novos códigos

- Arquivo principal do app: **`App.js`**
- Lógica de salvar dados offline: **`src/platform-hooks.js`**

Edite pelo VS Code, salve, e rode `npm run start` para ver no celular.

---

## 7) Erros comuns e solução rápida

Se algo não funcionar, rode:

```bash
npx expo doctor
npm run lint
```

Se o build APK falhar:

```bash
npx eas build -p android --profile preview --clear-cache
```

---

## 8) Comandos que você mais vai usar

```bash
npm install
npm run start
npm run lint
```
