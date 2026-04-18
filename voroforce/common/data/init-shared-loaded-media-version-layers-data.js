import { arrayBuffer } from '../../utils/array-buffer'
import { SharedLoadedMediaVersionLayersData } from './shared-loaded-media-version-layers-data'

export const initSharedLoadedMediaVersionLayersData = (config) => {
  const getVersionLoadUnitCount = (version = {}) => {
    const layerCapacity = (version.cols ?? 1) * (version.rows ?? 1)
    if (version.sourceLayout === 'tiles') {
      return Math.max(1, layerCapacity * (version.layers ?? 1))
    }
    return Math.max(1, version.layers ?? 1)
  }

  const sharedLoadedMediaVersionLayersDataBuffers = config.media.versions.map(
    (version) =>
      arrayBuffer(
        getVersionLoadUnitCount(version) * Uint16Array.BYTES_PER_ELEMENT,
        config.multiThreading?.enabled,
      ),
  )
  const sharedLoadedMediaVersionLayersDataArrays =
    sharedLoadedMediaVersionLayersDataBuffers.map(
      (buffer) => new Uint16Array(buffer),
    )

  const sharedLoadedMediaVersionLayersData =
    sharedLoadedMediaVersionLayersDataArrays.map(
      (array) => new SharedLoadedMediaVersionLayersData(array),
    )

  return {
    sharedLoadedMediaVersionLayersDataBuffers,
    sharedLoadedMediaVersionLayersDataArrays,
    sharedLoadedMediaVersionLayersData,
  }
}
