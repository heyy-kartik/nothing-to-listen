import { Texture } from 'ogl'

export class CompressedMediaGridArrayTexture extends Texture {
  constructor(gl, args) {
    const format = args.compressionFormat
    const isStandardImage = format === 'jpg' || format === 'jpeg' || format === 'png'

    let ext = null
    let internalFormat

    if (isStandardImage) {
      // Standard image formats — no compressed texture extension needed
      internalFormat = gl.RGBA8
    } else if (format === 'etc') {
      ext = gl.getExtension('WEBGL_compressed_texture_etc')
      if (!ext) {
        console.error('ETC1 texture compression not supported')
      }
      internalFormat = ext.COMPRESSED_RGB_ETC1_WEBGL
    } else if (format === 'ktx') {
      ext = gl.getExtension('WEBGL_compressed_texture_etc')
      if (!ext) {
        console.error('ETC texture compression not supported')
      }
      internalFormat = ext.COMPRESSED_RGB8_ETC2
    } else {
      ext = gl.getExtension('WEBGL_compressed_texture_s3tc')
      if (!ext) {
        console.error('S3TC texture compression not supported')
      }
      internalFormat = ext.COMPRESSED_RGB_S3TC_DXT1_EXT
    }

    super(gl, {
      ...args,
      target: gl.TEXTURE_2D_ARRAY,
      internalFormat,

      // These are the key parameters for bilinear filtering
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,

      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE,
    })

    this.compressedTexExt = ext
    this.internalFormat = internalFormat
    this.isStandardImage = isStandardImage
    this.cols = args.cols ?? 1
    this.rows = args.rows ?? 1
    this.layerCapacity = this.cols * this.rows
    this.tileWidth = Math.max(1, Math.floor(this.width / this.cols))
    this.tileHeight = Math.max(1, Math.floor(this.height / this.rows))

    this.bind()

    // Initialize the texture storage with aligned dimensions
    gl.texStorage3D(
      gl.TEXTURE_2D_ARRAY,
      1, // mipmap levels
      internalFormat,
      this.width,
      this.height,
      this.length, // (number of layers)
    )
  }

  bind() {
    // Already bound to active texture unit
    if (this.glState.textureUnits[this.glState.activeTextureUnit] === this.id)
      return
    this.gl.bindTexture(this.target, this.texture)
    this.glState.textureUnits[this.glState.activeTextureUnit] = this.id
  }

  pendingLayerUpdates = []

  static getImageDimensions(bytes) {
    const width = bytes?.naturalWidth ?? bytes?.videoWidth ?? bytes?.width ?? 0
    const height =
      bytes?.naturalHeight ?? bytes?.videoHeight ?? bytes?.height ?? 0
    return {
      width,
      height,
    }
  }

  static resizeImageSource(image, width, height) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.warn(
        '[CompressedMediaGridArrayTexture] Failed to get 2D canvas context while resizing media source; using original source dimensions as fallback',
      )
      return image
    }
    ctx.drawImage(image, 0, 0, width, height)
    return canvas
  }

  update(textureUnit = 0) {
    // Make sure that texture is bound to its texture unit
    if (
      this.pendingLayerUpdates.length > 0 ||
      this.glState.textureUnits[textureUnit] !== this.id
    ) {
      // set active texture unit to perform texture functions
      this.gl.renderer.activeTexture(textureUnit)
      this.bind()

      if (this.flipY !== this.glState.flipY) {
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, this.flipY)
        this.glState.flipY = this.flipY
      }

      if (this.premultiplyAlpha !== this.glState.premultiplyAlpha) {
        this.gl.pixelStorei(
          this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,
          this.premultiplyAlpha,
        )
        this.glState.premultiplyAlpha = this.premultiplyAlpha
      }

      if (this.unpackAlignment !== this.glState.unpackAlignment) {
        this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, this.unpackAlignment)
        this.glState.unpackAlignment = this.unpackAlignment
      }

      if (this.minFilter !== this.state.minFilter) {
        this.gl.texParameteri(
          this.target,
          this.gl.TEXTURE_MIN_FILTER,
          this.minFilter,
        )
        this.state.minFilter = this.minFilter
      }

      if (this.magFilter !== this.state.magFilter) {
        this.gl.texParameteri(
          this.target,
          this.gl.TEXTURE_MAG_FILTER,
          this.magFilter,
        )
        this.state.magFilter = this.magFilter
      }

      if (this.wrapS !== this.state.wrapS) {
        this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_S, this.wrapS)
        this.state.wrapS = this.wrapS
      }

      if (this.wrapT !== this.state.wrapT) {
        this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_T, this.wrapT)
        this.state.wrapT = this.wrapT
      }

      if (this.wrapR !== this.state.wrapR) {
        this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_R, this.wrapR)
        this.state.wrapR = this.wrapR
      }

      if (this.anisotropy && this.anisotropy !== this.state.anisotropy) {
        this.gl.texParameterf(
          this.target,
          this.gl.renderer.getExtension('EXT_texture_filter_anisotropic')
            .TEXTURE_MAX_ANISOTROPY_EXT,
          this.anisotropy,
        )
        this.state.anisotropy = this.anisotropy
      }
    }

    if (this.generateMipmaps) {
      this.gl.generateMipmap(this.target)
    }

    this.pendingLayerUpdates.forEach(({ index, bytes }) => {
      if (this.isStandardImage) {
        const { width: sourceWidth, height: sourceHeight } =
          CompressedMediaGridArrayTexture.getImageDimensions(bytes)

        let xOffset = 0
        let yOffset = 0
        let layerIndex = index
        let uploadWidth = this.width
        let uploadHeight = this.height
        let uploadBytes = bytes

        const shouldPackAsTile =
          Number.isFinite(sourceWidth) &&
          Number.isFinite(sourceHeight) &&
          (sourceWidth !== this.width || sourceHeight !== this.height) &&
          this.layerCapacity > 0

        if (shouldPackAsTile) {
          // `index` is treated as a global tile id for tile-source media:
          // decompose it into destination layer + tile position inside the layer atlas.
          const tileIndex = index % this.layerCapacity
          const tileRow = Math.floor(tileIndex / this.cols)
          const tileCol = tileIndex % this.cols
          layerIndex = Math.floor(index / this.layerCapacity)
          xOffset = tileCol * this.tileWidth
          yOffset = tileRow * this.tileHeight
          uploadWidth = this.tileWidth
          uploadHeight = this.tileHeight
        }

        if (layerIndex < 0 || layerIndex >= this.length) {
          return
        }

        if (
          Number.isFinite(sourceWidth) &&
          Number.isFinite(sourceHeight) &&
          (sourceWidth !== uploadWidth || sourceHeight !== uploadHeight)
        ) {
          uploadBytes = CompressedMediaGridArrayTexture.resizeImageSource(
            bytes,
            uploadWidth,
            uploadHeight,
          )
        }

        // Standard image: bytes is an Image/HTMLImageElement
        this.gl.texSubImage3D(
          this.gl.TEXTURE_2D_ARRAY,
          0,
          xOffset,
          yOffset,
          layerIndex,
          uploadWidth,
          uploadHeight,
          1,
          this.gl.RGBA,
          this.gl.UNSIGNED_BYTE,
          uploadBytes,
        )
      } else {
        // Compressed format: bytes is a Uint8Array
        this.gl.compressedTexSubImage3D(
          this.gl.TEXTURE_2D_ARRAY,
          0,
          0,
          0,
          index,
          this.width,
          this.height,
          1,
          this.internalFormat,
          bytes,
        )
      }
    })

    this.pendingLayerUpdates = []
  }

  prepareLayerUpdate(index, bytes) {
    this.pendingLayerUpdates.push({
      index,
      bytes,
    })
  }
}
