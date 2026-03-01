# APlica Manutenção (Android)

Sim — este projeto já está pronto como app React Native com Expo.

## 1) Preparar ambiente (uma vez só)

- Instale **Node.js 18+**
- Instale o app **Expo Go** no celular Android
- (Opcional para APK/AAB de loja) crie conta no Expo: https://expo.dev

## 2) Rodar no celular (jeito mais rápido)

```bash
npm install
npm run start
```

Depois que abrir o Metro/Expo no terminal:

1. Conecte celular e computador na mesma rede Wi‑Fi
2. Abra o **Expo Go** no Android
3. Escaneie o QR code mostrado no terminal

Pronto: o app abre no celular.

## 3) Gerar APK para instalar no Android

### Opção A — APK de desenvolvimento (local)

> Requer Android Studio + SDK + emulador/dispositivo configurado.

```bash
npm install
npx expo prebuild --platform android
cd android
./gradlew assembleDebug
```

APK gerado em:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

### Opção B — Build na nuvem (recomendado)

```bash
npm install
npx expo login
npx expo install eas-cli
npx eas build:configure
npx eas build -p android --profile preview
```

No final, o Expo retorna um link para baixar o APK/AAB.

## 4) Publicar na Play Store (resumo)

1. Gere **AAB** com EAS (`--profile production`)
2. Crie app no Google Play Console
3. Envie o AAB
4. Preencha ficha da loja e publique

## Scripts disponíveis

```bash
npm run start    # abre Expo/Metro
npm run android  # roda app no ambiente Android nativo
npm run web      # versão web
npm run lint     # valida código
```

## Estrutura principal

- `App.js`: interface principal + navegação por abas.
- `src/platform-hooks.js`: hooks `useQuery` e `useMutation` para persistência local.
- `app.json`: configuração do app Expo.
