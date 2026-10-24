import QRCode from 'qrcode';

export async function qrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    margin: 1,
    width: 512,
    errorCorrectionLevel: 'M',
    color: { dark: '#17291F', light: '#FFFFFF' },
  });
}

export function profileUrl(userId: string): string {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#/u/${userId}`;
}
