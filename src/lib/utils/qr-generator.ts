import QRCode from 'qrcode'

export interface QROptions {
  width?: number
  margin?: number
  color?: {
    dark?: string
    light?: string
  }
}

export async function generateQRDataURL(
  url: string, 
  options: QROptions = {}
): Promise<string> {
  const defaultOptions: QROptions = {
    width: 256,
    margin: 2,
    color: {
      dark: '#1e40af',
      light: '#ffffff',
    },
  }

  const mergedOptions = { ...defaultOptions, ...options }

  return QRCode.toDataURL(url, {
    width: mergedOptions.width,
    margin: mergedOptions.margin,
    color: mergedOptions.color,
  })
}

export async function generateQRSVG(
  url: string,
  options: QROptions = {}
): Promise<string> {
  const defaultOptions: QROptions = {
    width: 256,
    margin: 2,
    color: {
      dark: '#1e40af',
      light: '#ffffff',
    },
  }

  const mergedOptions = { ...defaultOptions, ...options }

  return QRCode.toString(url, {
    type: 'svg',
    width: mergedOptions.width,
    margin: mergedOptions.margin,
    color: mergedOptions.color,
  })
}

export function generateReportToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
}
