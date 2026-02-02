/**
 * SlipOK Service
 * ตรวจสอบสลิปโอนเงินผ่าน SlipOK API
 * https://slipok.com/api-documentation/
 */

const SLIPOK_API_URL = "https://api.slipok.com/api/line/apikey";

export interface SlipOKVerifyRequest {
  data: string; // QR Code data หรือ base64 image
  amount?: number; // ยอดเงินที่ต้องการตรวจสอบ (optional)
  log?: boolean; // บันทึก log ใน SlipOK (เช็คสลิปซ้ำ)
}

export interface SlipOKSender {
  displayName: string;
  name: string;
  proxy: {
    type: string | null;
    value: string | null;
  };
  account: {
    type: string;
    value: string;
  };
}

export interface SlipOKReceiver {
  displayName: string;
  name: string;
  proxy: {
    type: string;
    value: string;
  };
  account: {
    type: string;
    value: string;
  };
}

export interface SlipOKData {
  success: boolean;
  message: string;
  rqUID?: string;
  language?: string;
  transRef: string;
  sendingBank: string;
  receivingBank: string;
  transDate: string;
  transTime: string;
  transTimestamp?: string;
  sender: SlipOKSender;
  receiver: SlipOKReceiver;
  amount: number;
  paidLocalAmount?: number;
  paidLocalCurrency?: string;
  countryCode?: string;
  transFeeAmount?: number;
  ref1?: string;
  ref2?: string;
  ref3?: string;
  toMerchantId?: string;
}

export interface SlipOKSuccessResponse {
  success: true;
  data: SlipOKData;
}

export interface SlipOKErrorResponse {
  code: number;
  message: string;
  data?: SlipOKData; // บางกรณีมี data แม้จะ error (เช่น สลิปซ้ำ)
}

export type SlipOKResponse = SlipOKSuccessResponse | SlipOKErrorResponse;

// Bank codes
export const BANK_CODES: Record<string, string> = {
  "002": "กรุงเทพ (BBL)",
  "004": "กสิกรไทย (KBANK)",
  "006": "กรุงไทย (KTB)",
  "011": "ทหารไทยธนชาต (TTB)",
  "014": "ไทยพาณิชย์ (SCB)",
  "017": "ซิตี้แบงก์",
  "020": "สแตนดาร์ดชาร์เตอร์ด",
  "022": "CIMB ไทย",
  "024": "ยูโอบี",
  "025": "กรุงศรีอยุธยา (BAY)",
  "030": "ออมสิน (GSB)",
  "033": "ธ.ก.ส. (BAAC)",
  "034": "เอ็กซิมแบงก์",
  "065": "ธอส. (GHB)",
  "066": "SME Bank",
  "067": "เกียรตินาคินภัทร",
  "069": "อิสลามแห่งประเทศไทย",
  "070": "ไอซีบีซี",
  "071": "ไทยเครดิต",
  "073": "แลนด์แอนด์เฮ้าส์",
};

export function getBankName(code: string): string {
  return BANK_CODES[code] || `ธนาคาร (${code})`;
}

/**
 * ตรวจสอบสลิปผ่าน SlipOK API
 * @param branchId - SlipOK Branch ID
 * @param apiKey - SlipOK API Key  
 * @param data - QR Code data หรือ base64 image
 * @param amount - ยอดเงินที่ต้องตรวจสอบ (optional)
 * @param log - บันทึก log เพื่อเช็คสลิปซ้ำ
 */
export async function verifySlip(
  branchId: string,
  apiKey: string,
  data: string,
  amount?: number,
  log: boolean = true
): Promise<{ success: boolean; data?: SlipOKData; error?: { code: number; message: string } }> {
  try {
    const url = `${SLIPOK_API_URL}/${branchId}`;
    
    const body: SlipOKVerifyRequest = {
      data,
      log,
    };
    
    if (amount !== undefined) {
      body.amount = amount;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-authorization": apiKey,
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (!response.ok) {
      // Error response
      const errorResult = result as SlipOKErrorResponse;
      return {
        success: false,
        error: {
          code: errorResult.code,
          message: errorResult.message,
        },
        data: errorResult.data, // บางกรณีมี data (เช่น สลิปซ้ำ)
      };
    }

    // Success response
    const successResult = result as SlipOKSuccessResponse;
    return {
      success: true,
      data: successResult.data,
    };
  } catch (error) {
    console.error("SlipOK API Error:", error);
    return {
      success: false,
      error: {
        code: -1,
        message: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ SlipOK",
      },
    };
  }
}

/**
 * ตรวจสอบสลิปจากรูปภาพ (Base64)
 */
export async function verifySlipImage(
  branchId: string,
  apiKey: string,
  imageBase64: string,
  amount?: number,
  log: boolean = true
): Promise<{ success: boolean; data?: SlipOKData; error?: { code: number; message: string } }> {
  // ลบ prefix ถ้ามี (data:image/png;base64,)
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  return verifySlip(branchId, apiKey, base64Data, amount, log);
}

/**
 * สร้าง PromptPay QR Code Data
 * Format: 00020101021129370016A000000677010111[ID_TYPE][ID]5802TH53037645406[AMOUNT]6304[CHECKSUM]
 */
export function generatePromptPayQRData(
  promptPayId: string,
  amount?: number
): string {
  // Simplified PromptPay QR generation
  // ใน production ควรใช้ library ที่ถูกต้อง เช่น promptpay-qr
  
  // Clean PromptPay ID (remove dashes and spaces)
  const cleanId = promptPayId.replace(/[-\s]/g, "");
  
  // Determine ID type: 13 digits = National ID, 10 digits = Phone
  let idType = "01"; // Phone
  if (cleanId.length === 13) {
    idType = "02"; // National ID
  }
  
  // This is a simplified version - for production, use proper CRC16 calculation
  // and follow EMVCo QR specification
  const baseData = [
    "00", "02", "01", // Payload Format Indicator
    "01", "02", "11", // Point of Initiation (11 = static, 12 = dynamic)
    "29", // Merchant Account Information - PromptPay
    "37",
    "0016A000000677010111", // PromptPay AID
    idType,
    cleanId.length.toString().padStart(2, "0"),
    cleanId,
    "5802TH", // Country Code
    "5303764", // Currency (THB = 764)
  ];
  
  if (amount && amount > 0) {
    const amountStr = amount.toFixed(2);
    baseData.push("54", amountStr.length.toString().padStart(2, "0"), amountStr);
  }
  
  // Note: This needs proper CRC16-CCITT checksum at the end
  // For production, use a proper library
  
  return baseData.join("");
}

/**
 * Error code descriptions
 */
export const SLIPOK_ERROR_CODES: Record<number, string> = {
  1000: "กรุณาใส่ข้อมูล QR Code",
  1002: "API Key ไม่ถูกต้อง",
  1006: "รูปภาพไม่ถูกต้อง",
  1007: "QR Code หมดอายุ หรือไม่มีรายการ",
  1008: "QR Code ไม่ใช่ QR สำหรับตรวจสอบการชำระเงิน",
  1010: "กรุณารอการตรวจสอบสลิป (ธนาคารมีความล่าช้า)",
  1012: "สลิปซ้ำ สลิปนี้เคยส่งเข้ามาในระบบแล้ว",
  1013: "ยอดเงินไม่ตรงกับสลิป",
  1014: "บัญชีผู้รับไม่ตรงกับบัญชีหลักของร้าน",
};

export function getErrorDescription(code: number): string {
  return SLIPOK_ERROR_CODES[code] || `รหัสข้อผิดพลาด: ${code}`;
}
