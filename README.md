# Galeria de Fotos com Mapa

Aplicativo mobile desenvolvido em React Native (Expo) que permite capturar ou selecionar imagens, associar cada uma a uma localização geográfica, exibi-las em uma galeria em grid e visualizá-las no mapa com marcadores interativos.

### 1. Captura de Imagens
- **Tirar foto com a câmera** do dispositivo
- **Selecionar da galeria** existente
- **Pré-visualização** da imagem antes de salvar
- **Título personalizado** para cada foto

### 2. Localização Geográfica
- **Solicita permissão** de localização ao primeiro uso
- **Captura automática** do GPS no momento do cadastro
- **Exibição das coordenadas** nos cards da galeria
- **Fallback** para salvar sem localização (quando indisponível)

### 3. Galeria de Fotos
- **Layout em grid** com 2 colunas
- **Busca em tempo real** por título
- **Exibição de informações**:
  - Título da foto
  - Data de criação (formato brasileiro)
  - Coordenadas geográficas (quando disponíveis)
- **Exclusão por toque longo** (confirmação com Alert)
- **Lista vazia** com mensagem amigável
- **Interface escura** consistente

### 4. Mapa Interativo
- **Marcadores com emoji 📍** (tamanho 30px, bem visíveis)
- **Tratamento de marcadores sobrepostos** (sistema em espiral)
- **Modal ao tocar no marcador** com:
  - Foto ampliada 
  - Título completo
  - Data de criação
  - Coordenadas exatas
  - Botão "Fechar"
- **Zoom automático** na região das fotos
- **Toque fora do modal** para fechar
- **Fundos transparentes** para melhor experiência

## Tecnologias utilizadas

- React Native com Expo
- expo-sqlite (persistência local dos dados)
- expo-image-picker (captura pela câmera ou seleção da galeria)
- expo-location (obtenção do GPS no momento do cadastro)
- react-native-maps (mapa com marcadores e modais)
- Expo Router (navegação por abas)

## Pré-requisitos

- Node.js 18+
- Expo CLI
- Aplicativo Expo Go no celular (ou emulador Android/iOS)

## Como executar

### 1. Clonar o repositório

```bash
git clone https://github.com/rye-ishii/my-notes.git
cd my-notes