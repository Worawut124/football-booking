// PromptPay QR Code generation utility
import QRCode from 'qrcode';

// Generate PromptPay payload
export function generatePromptPayPayload(promptPayId: string, amount: number): string {
  // Format PromptPay ID (remove spaces and dashes)
  const cleanId = promptPayId.replace(/[\s-]/g, '');
  
  // PromptPay payload format
  const payload = [
    '00', '02', '01',  // Payload format indicator
    '01', '12', '0016', 'A000000677010111',  // Application identifier
    '02', '13', '0016', 'A000000677010114',  // Application identifier
    '29', String(cleanId.length).padStart(2, '0'), cleanId,  // PromptPay ID
    '30', '04', '0000',  // Country code (Thailand)
    '53', '03', '764',   // Currency (THB)
    '54', String(amount.toFixed(2).length).padStart(2, '0'), amount.toFixed(2),  // Amount
    '58', '02', 'TH',    // Country code
    '62', '04', '0000'   // Additional data
  ].join('');
  
  // Calculate CRC16
  const crc = calculateCRC16(payload + '6304');
  
  return payload + '63' + '04' + crc.toString(16).toUpperCase().padStart(4, '0');
}

// Generate QR Code as Data URL
export async function generatePromptPayQR(promptPayId: string, amount: number): Promise<string> {
  const payload = generatePromptPayPayload(promptPayId, amount);
  
  try {
    const qrDataURL = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    });
    
    return qrDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

// CRC16 calculation for PromptPay
function calculateCRC16(data: string): number {
  const polynomial = 0x1021;
  let crc = 0xFFFF;
  
  for (let i = 0; i < data.length; i++) {
    crc ^= (data.charCodeAt(i) << 8);
    
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc <<= 1;
      }
      crc &= 0xFFFF;
    }
  }
  
  return crc;
}
