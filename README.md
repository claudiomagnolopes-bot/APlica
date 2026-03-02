# APlica Manutenção

Este app está em **Expo (React Native)**. A forma mais simples de instalar no smartphone é via **Expo Go**.

## Instalar no smartphone (jeito mais fácil)

### Android

1. No celular, instale o app **Expo Go** (Play Store).
2. No computador, dentro da pasta do projeto, rode:

```bash
npm install
npm run start
```

3. Vai aparecer um QR code no terminal.
4. Abra o **Expo Go** no celular e toque em **Scan QR Code**.
5. Escaneie o QR code.
6. Pronto: o APlica abre no seu smartphone.

> Importante: celular e computador precisam estar na **mesma rede Wi‑Fi**.

### iPhone (se precisar)

1. Instale **Expo Go** na App Store.
2. Rode `npm run start` no computador.
3. Abra a câmera do iPhone e escaneie o QR code (ou abra pelo Expo Go).

---

## Quero instalar sem Expo Go (APK)

Se você quiser instalar como app “normal” no Android:

```bash
npm install
npx expo login
npx eas build:configure
npx eas build -p android --profile preview
```

No final, o Expo gera um link para baixar o **APK** e instalar no celular.

---

## Scripts úteis

```bash
npm run start    # inicia o projeto e mostra QR code
npm run android  # roda ambiente Android nativo (dev)
npm run web      # versão web
npm run lint     # valida código
```

---

## Funcionalidade de PDF

Na aba **Ocorrências**, cada ocorrência tem botão **PDF / Enviar**:

1. Gera PDF da ocorrência
2. Abre compartilhamento do celular (WhatsApp, e-mail, etc.)

Implementação usando `expo-print` + `expo-sharing`.
