/**
 * LankaQR EMV QR Code Parser
 */

export interface LankaQRData {
  bank_code: string;
  terminal_id: string;
  merchant_name: string;
  merchant_city: string;
  currency_code: string;
  amount?: string;
  reference?: string;
}

function parseTLVStructure(qrString: string): Map<string, string> {
  const tlvMap = new Map<string, string>();
  let position = 0;

  while (position < qrString.length - 3) {
    const tag = qrString.substring(position, position + 2);
    position += 2;

    const lengthStr = qrString.substring(position, position + 2);
    const length = parseInt(lengthStr, 10);
    position += 2;

    if (isNaN(length) || length < 0) break;

    const value = qrString.substring(position, position + length);
    position += length;

    tlvMap.set(tag, value);
  }

  return tlvMap;
}

function extractMerchantAccountInfo(tag26Value: string): {
  bank_code: string;
  terminal_id: string;
} | null {
  if (!tag26Value) return null;

  const subTlvMap = parseTLVStructure(tag26Value);
  const tag00Value = subTlvMap.get('00');
  
  if (!tag00Value || tag00Value.length < 10) return null;

  // Typical layout: BankCode(5) + TerminalID(4)
  // This varies by implementer, so we handle it gracefully
  const bank_code = tag00Value.substring(0, 5);
  const terminal_id = tag00Value.substring(tag00Value.length - 4);

  return { bank_code, terminal_id };
}

export function parseLankaQR(qrString: string): LankaQRData | null {
  try {
    const tlvMap = parseTLVStructure(qrString);

    const tag26Value = tlvMap.get('26');
    const merchantInfo = extractMerchantAccountInfo(tag26Value || '');
    
    if (!merchantInfo) return null;

    const merchant_name = tlvMap.get('59') || 'Unknown Merchant';
    const merchant_city = tlvMap.get('60') || 'Unknown City';
    const currency_code = tlvMap.get('53') || '144'; // default LKR
    const amount = tlvMap.get('54'); // Optional in static QR

    // Additional data tag 62
    const tag62Value = tlvMap.get('62');
    let reference = '';
    if (tag62Value) {
      const sub62Map = parseTLVStructure(tag62Value);
      reference = sub62Map.get('05') || sub62Map.get('01') || '';
    }

    return {
      bank_code: merchantInfo.bank_code,
      terminal_id: merchantInfo.terminal_id,
      merchant_name,
      merchant_city,
      currency_code,
      amount,
      reference,
    };
  } catch (error) {
    console.error('Error parsing LankaQR:', error);
    return null;
  }
}
