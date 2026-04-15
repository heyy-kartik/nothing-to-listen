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
        // Standard image: bytes is an Image/HTMLImageElement
        this.gl.texSubImage3D(
          this.gl.TEXTURE_2D_ARRAY,
          0,
          0,
          0,
          index,
          this.width,
          this.height,
          1,
          this.gl.RGBA,
          this.gl.UNSIGNED_BYTE,
          bytes,
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

