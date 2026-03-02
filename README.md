# APlica Manutenção

Este app está em **Expo (React Native)**.

## Jeito 1 (mais rápido): testar agora com celular ao lado (sem APK)

1. No notebook, abra a pasta do projeto.
2. Rode:

```bash
npm install
npm run start
```

3. No celular Android, instale o app **Expo Go** (Play Store).
4. Conecte notebook e celular na **mesma rede Wi-Fi**.
5. Abra o **Expo Go** no celular.
6. Escaneie o QR code que apareceu no terminal do notebook.
7. O app abre no celular para teste imediato.

---

## Jeito 2: gerar APK e instalar no celular (passo a passo)

### 1) Preparar no notebook

No terminal, dentro do projeto:

```bash
npm install
npx expo login
```

> Se não tiver conta Expo, crie em: https://expo.dev/signup

### 2) Configurar build Android

```bash
npx eas build:configure
```

Quando perguntar plataforma, selecione **Android**.

### 3) Gerar APK

```bash
npx eas build -p android --profile preview
```

Aguarde terminar (leva alguns minutos).

### 4) Pegar link do APK

Quando finalizar, o terminal vai mostrar um link (algo como `https://expo.dev/artifacts/...apk`).

Você também pode ver em:

- https://expo.dev
- Entrar no seu projeto
- Aba **Builds**
- Abrir o build Android e copiar o link do APK

### 5) Instalar no celular

1. Abra o link do APK no celular (WhatsApp, e-mail ou navegador).
2. Toque para baixar.
3. Ao instalar, o Android pode pedir para permitir **instalar apps desconhecidos**.
4. Permita apenas para o navegador/arquivo usado.
5. Conclua a instalação.

### 6) Testar

1. Abra o app no celular.
2. Crie uma tarefa e uma ocorrência.
3. Teste foto, conclusão, histórico e PDF.

---

## Se der erro no build APK

Rode estes comandos e tente de novo:

```bash
npx expo doctor
npx eas build -p android --profile preview --clear-cache
```

---

## Comandos úteis

```bash
npm run start
npm run web
npm run lint
```
