declare module 'qrcode' {
  interface QRCodeOptions {
    width?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }

  export function toDataURL(data: string, options?: QRCodeOptions): Promise<string>;
  export function toBuffer(data: string, options?: QRCodeOptions): Promise<Buffer>;
  export function toString(data: string, options?: QRCodeOptions): Promise<string>;
}
