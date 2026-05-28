# Galeria de Fotos com Mapa

Aplicativo mobile desenvolvido em React Native (Expo) que permite capturar ou selecionar imagens, associar cada uma a uma localização geográfica, exibi-las em uma galeria em grid e visualizá-las no mapa com marcadores interativos.

## Tecnologias utilizadas

- React Native com Expo
- expo-sqlite (persistência local dos dados)
- expo-image-picker (captura pela câmera ou seleção da galeria)
- expo-location (obtenção do GPS no momento do cadastro)
- react-native-maps (mapa com marcadores e callouts)
- Expo Router (navegação por abas)

## Pré-requisitos

- Node.js 18+
- Expo CLI
- Aplicativo Expo Go no celular (ou emulador Android/iOS)

## Como executar

### 1. Clonar o repositório

git clone https://github.com/Geovana-02/Trabalho-Galeria.git
cd Trabalho-Galeria

### 2. Instalar as dependências

npm install

### 3. Instalar os pacotes nativos

npx expo install expo-sqlite expo-image-picker expo-location react-native-maps

### 4. Iniciar o aplicativo

npx expo start

Escaneie o QR code com o Expo Go (Android) ou com o app Câmera (iOS).

## Estrutura do projeto

app/
_layout.tsx                   # Navegação raiz (Stack)
index.tsx                     # Redirecionamento para as abas
(tabs)/
_layout.tsx                 # Layout da barra de abas com ícones
index.tsx                   # Tela de Galeria
map.tsx                     # Tela de Mapa
database/
db.ts                         # Inicialização do banco SQLite
repositories/
photos.repository.ts        # Operações CRUD (criar, listar, excluir)

## Funcionalidades

- Adicionar fotos pela câmera ou galeria do celular
- Solicitar e obter localização GPS automaticamente no momento do cadastro
- Salvar no SQLite: título, URI da imagem, latitude, longitude e data
- Busca por título em tempo real na tela de galeria
- Galeria exibida em grid de 2 colunas com título, data e coordenadas
- Pressione e segure uma foto para excluí-la
- Tela de mapa com marcadores de todas as fotos salvas
- Fotos salvas no mesmo local aparecem com marcadores separados em espiral
- Toque no marcador para ver miniatura e título da foto no callout
- Callout fecha automaticamente ao trocar de aba
- Interface em modo escuro com tons de azul e roxo
- Dados persistidos localmente com SQLite após fechar o app

## Permissões necessárias

- Câmera
- Biblioteca de fotos
- Localização (em primeiro plano)