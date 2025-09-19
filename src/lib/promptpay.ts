// PromptPay QR Code generation utility
import QRCode from 'qrcode';

// Build TLV (Tag-Length-Value) helper
function tlv(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${tag}${len}${value}`;
}

// Build Merchant Account Information (ID 29) for PromptPay
// Sub IDs:
//  - 00: AID 'A000000677010111'
//  - 01: PromptPay target (mobile in 0066XXXXXXXXX format)
//  - 02: National ID (13 digits)
function buildMerchantAccountInfo(promptPayId: string): string {
  const aid = tlv('00', 'A000000677010111');

  const digits = promptPayId.replace(/[^0-9+]/g, '');
  // Detect mobile vs national id
  let subTag = '01';
  let target = digits;

  // Mobile number normalization
  // Acceptable inputs: 0812345678, +66812345678, 66812345678
  const isLikelyMobile = /^\+?66\d{9}$/.test(digits) || /^0\d{9}$/.test(digits);
  const isNationalId = /^\d{13}$/.test(digits);

  if (isLikelyMobile) {
    // Convert to 0066XXXXXXXXX (drop leading 0 if present)
    if (digits.startsWith('+66')) {
      target = `0066${digits.slice(3)}`;
    } else if (digits.startsWith('66')) {
      target = `0066${digits.slice(2)}`;
    } else if (digits.startsWith('0') && digits.length === 10) {
      target = `0066${digits.slice(1)}`;
    }
    subTag = '01';
  } else if (isNationalId) {
    target = digits; // 13 digits citizen ID
    subTag = '02';
  } else {
    // Fallback: try to send as-is (some wallets/eWallet IDs use 15 digits via subtag 03)
    subTag = '03';
    target = digits;
  }

  const acct = aid + tlv(subTag, target);
  return tlv('29', acct);
}

// Generate PromptPay payload following Thai QR Payment (EMVCo) standard
export function generatePromptPayPayload(promptPayId: string, amount: number): string {
  // 00: Payload Format Indicator -> '01'
  const id00 = tlv('00', '01');
  // 01: Point of Initiation Method -> '12' (dynamic)
  const id01 = tlv('01', '12');
  // 29: Merchant Account Information (PromptPay)
  const id29 = buildMerchantAccountInfo(promptPayId);
  // 53: Transaction Currency '764' (THB)
  const id53 = tlv('53', '764');
  // 54: Transaction Amount (optional but we set it)
  const amt = amount.toFixed(2);
  const id54 = tlv('54', amt);
  // 58: Country Code 'TH'
  const id58 = tlv('58', 'TH');

  // Assemble without CRC first
  const withoutCRC = id00 + id01 + id29 + id53 + id54 + id58 + '6304';
  const crc = calculateCRC16(withoutCRC).toString(16).toUpperCase().padStart(4, '0');
  return withoutCRC + crc;
}

// Generate QR Code as Data URL
export async function generatePromptPayQR(promptPayId: string, amount: number): Promise<string> {
  const payload = generatePromptPayPayload(promptPayId, amount);
  
  try {
    const qrDataURL = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 512
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
