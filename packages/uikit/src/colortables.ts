import { Log } from './utilities/log'

export type ColorMap = {
  R: number[]
  G: number[]
  B: number[]
  A: number[]
  I: number[]

  min?: number
  max?: number
  labels?: string[]
}

export type LUT = {
  lut: Uint8ClampedArray
  min?: number
  max?: number
  labels?: string[]
}

export class ColorTables {
  gamma = 1.0
  version = 0.1
  cluts: Record<string, ColorMap> = {}

  constructor() {
    this.loadColormaps().catch((error) => {
      Log.warn('Failed to load colormaps:', error)
    })
  }

  /**
   * Dynamically loads JSON colormaps using import.meta.glob
   */
  async loadColormaps(): Promise<void> {
    // Glob all JSON files in the colormaps directory
    const modules = import.meta.glob('../colormaps/*.json')

    for (const [path, loadModule] of Object.entries(modules)) {
      try {
        const key = path.split('/').pop()?.replace('.json', '') || 'unknown'
        const cmap = (await loadModule()) as ColorMap // Assert type to ColorMap
        this.addColormap(key, cmap)
        Log.info(`Successfully loaded colormap: ${key}`)
      } catch (error) {
        Log.warn(`Failed to load colormap from ${path}:`, error)
      }
    }
  }

  /**
   * Adds a colormap to the collection
   * @param key - Name of the colormap
   * @param cmap - The colormap data
   */
  addColormap(key: string, cmap: ColorMap): void {
    this.cluts[key] = cmap
  }

  /**
   * Returns the list of available colormap keys
   */
  colormaps(): string[] {
    return Object.keys(this.cluts)
  }

  /**
   * Retrieves a colormap by key, falling back to a default grayscale colormap
   * @param name - Name of the colormap
   */
  colormapFromKey(name: string): ColorMap {
    let cmap = this.cluts[name]
    if (cmap) return cmap

    cmap = this.cluts[name.toLowerCase()]
    if (cmap) return cmap

    if (name.length > 0) {
      Log.warn('No colormap named ' + name)
    }

    // Return a default grayscale colormap
    return {
      min: 0,
      max: 0,
      R: [0, 255],
      G: [0, 255],
      B: [0, 255],
      A: [0, 255],
      I: [0, 255]
    }
  }

  colormap(key = '', isInvert = false): Uint8ClampedArray {
    const cmap = this.colormapFromKey(key)
    return this.makeLut(cmap.R, cmap.G, cmap.B, cmap.A, cmap.I, isInvert)
  }

  makeLabelLut(cm: ColorMap, alphaFill = 255): LUT {
    if (cm.R === undefined || cm.G === undefined || cm.B === undefined) {
      throw new Error(`Invalid colormap table: ${cm}`)
    }
    const nLabels = cm.R.length
    const idxs = cm.I ?? [...Array(nLabels).keys()]

    if (nLabels !== cm.G.length || nLabels !== cm.B.length || nLabels !== idxs.length) {
      throw new Error(`colormap does not make sense: ${cm}`)
    }

    let As = new Uint8ClampedArray(nLabels).fill(alphaFill)
    As[0] = 0
    if (cm.A !== undefined) {
      As = Uint8ClampedArray.from(cm.A)
    }

    const mnIdx = Math.min(...idxs)
    const mxIdx = Math.max(...idxs)
    const nLabelsDense = mxIdx - mnIdx + 1
    const lut = new Uint8ClampedArray(nLabelsDense * 4).fill(0)

    for (let i = 0; i < nLabels; i++) {
      let k = (idxs[i] - mnIdx) * 4
      lut[k++] = cm.R[i]
      lut[k++] = cm.G[i]
      lut[k++] = cm.B[i]
      lut[k++] = As[i]
    }

    const cmap: LUT = {
      lut,
      min: mnIdx,
      max: mxIdx
    }

    if (cm.labels) {
      const nL = cm.labels.length
      if (nL === nLabelsDense) {
        cmap.labels = cm.labels
      } else if (nL === nLabels) {
        cmap.labels = Array(nLabelsDense).fill('?')
        for (let i = 0; i < nLabels; i++) {
          const idx = idxs[i]
          cmap.labels[idx] = cm.labels[i]
        }
      }
    }

    return cmap
  }

  async makeLabelLutFromUrl(name: string): Promise<LUT> {
    const response = await fetch(name)
    const cm = await response.json()
    return this.makeLabelLut(cm as ColorMap)
  }

  makeDrawLut(name: string | ColorMap): LUT {
    let cmap: ColorMap = typeof name === 'object' ? name : this.cluts[name]

    if (!cmap) {
      cmap = {
        min: 0,
        max: 0,
        R: [0, 255, 0, 0, 255, 0, 255],
        G: [0, 0, 255, 0, 255, 255, 0],
        B: [0, 0, 0, 255, 0, 255, 255],
        A: [0, 255, 255, 255, 255, 255, 255],
        I: [0, 255]
      }
    }

    const cm = this.makeLabelLut(cmap, 255)

    if (!cm.labels) {
      cm.labels = []
    }
    if (cm.labels.length < 256) {
      for (let i = cm.labels.length; i < 256; i++) {
        cm.labels.push(i.toString())
      }
    }

    const lut = new Uint8ClampedArray(256 * 4).fill(255)
    lut[3] = 0

    const explicitLUTbytes = Math.min(cm.lut.length, 256 * 4)
    for (let i = 0; i < explicitLUTbytes; i++) {
      lut[i] = cm.lut[i]
    }

    return {
      lut,
      labels: cm.labels
    }
  }

  makeLut(
    Rsi: number[],
    Gsi: number[],
    Bsi: number[],
    Asi: number[],
    Isi: number[],
    isInvert: boolean
  ): Uint8ClampedArray {
    const nIdx = Rsi.length
    const Rs = [...Rsi]
    const Gs = [...Gsi]
    const Bs = [...Bsi]
    const As = Uint8ClampedArray.from(Asi ?? new Array(nIdx).fill(64))
    const Is = Uint8ClampedArray.from(Isi ?? new Array(nIdx).fill(0))

    const lut = new Uint8ClampedArray(256 * 4).fill(0)

    for (let i = 0; i < nIdx - 1; i++) {
      const idxLo = Is[i]
      const idxHi = Is[i + 1]
      const idxRng = idxHi - idxLo
      let k = idxLo * 4

      for (let j = idxLo; j <= idxHi; j++) {
        const f = (j - idxLo) / idxRng
        lut[k++] = Rs[i] + f * (Rs[i + 1] - Rs[i])
        lut[k++] = Gs[i] + f * (Gs[i + 1] - Gs[i])
        lut[k++] = Bs[i] + f * (Bs[i + 1] - Bs[i])
        lut[k++] = As[i] + f * (As[i + 1] - As[i])
      }
    }

    if (this.gamma !== 1.0) {
      for (let i = 0; i < 255 * 4; i++) {
        if (i % 4 === 3) continue
        lut[i] = Math.pow(lut[i] / 255, 1 / this.gamma) * 255
      }
    }

    return lut
  }
}
