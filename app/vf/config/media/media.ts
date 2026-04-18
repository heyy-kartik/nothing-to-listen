const parseLayerCount = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const mediaConfig = {
  enabled: true,
  baseUrl: import.meta.env.VITE_TEXTURES_BASE_URL ?? '/media',
  preload: 'first', // 'v0', 'first' or false
  compressionFormat: 'jpg', // standard JPEG — files in /media/v0, v1, v2 are .jpg
  versions: [
    {
      cols: 512,
      rows: 104,
      width: 2048,
      height: 624,
      layers: parseLayerCount(import.meta.env.VITE_MEDIA_VERSION_0_LAYERS, 1),
      layerSrcFormat: '/v0/{INDEX}.jpg',
      type: 'uncompressed-grid',
      sourceLayout: 'tiles',
    },
    {
      cols: 90,
      rows: 60,
      width: 1980,
      height: 1980,
      layers: parseLayerCount(import.meta.env.VITE_MEDIA_VERSION_1_LAYERS, 10),
      layerSrcFormat: '/v1/{INDEX}.jpg',
      type: 'uncompressed-grid',
      sourceLayout: 'tiles',
    },
    {
      cols: 18,
      rows: 12,
      width: 1980,
      height: 1980,
      layers: parseLayerCount(import.meta.env.VITE_MEDIA_VERSION_2_LAYERS, 241),
      layerSrcFormat: '/v2/{INDEX}.jpg',
      type: 'uncompressed-grid',
      sourceLayout: 'tiles',
    },
  ],
}

export default mediaConfig

export const uncompressedSingleMediaVersionConfig = {
  cols: 1,
  rows: 1,
  virtualCols: 9,
  virtualRows: 6,
  tileWidth: 220,
  tileHeight: 330,
  width: 1980,
  height: 1980,

  layers: 50000, // real layer count for 50000/54: 925.9 = 926
  virtualLayers: 50,
  layerIndexStart: 0,
  layerSrcFormat: '/single/{INDEX}.jpg',
  type: 'uncompressed-single',
}

export const mediaConfigWithUncompressedSingleVersion = {
  ...mediaConfig,
  versions: [
    ...mediaConfig.versions,
    ...(import.meta.env.VITE_EXPERIMENTAL_MEDIA_VERSION_3_ENABLED
      ? [uncompressedSingleMediaVersionConfig]
      : []),
  ],
}
