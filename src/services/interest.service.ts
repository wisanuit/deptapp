import type { Loan, InterestPolicy } from "@prisma/client";
import { getDaysInMonth, daysBetween, getThailandToday } from "@/lib/utils";

export type LoanWithPolicy = Loan & {
  interestPolicy: InterestPolicy | null;
};

export interface InterestCalculationResult {
  totalInterest: number;
  dailyBreakdown: Array<{
    date: Date;
    principal: number;
    interest: number;
    rate: number;
    days: number;
  }>;
}

/**
 * =====================================================
 * กฎหมายเกี่ยวกับดอกเบี้ยในประเทศไทย
 * =====================================================
 * 
 * 1. พ.ร.บ. ห้ามเรียกดอกเบี้ยเกินอัตรา พ.ศ. 2560
 *    - สถาบันการเงิน: สูงสุด 15% ต่อปี
 *    - บุคคลธรรมดา: สูงสุด 15% ต่อปี (1.25% ต่อเดือน)
 *    - หากเกินถือว่าผิดกฎหมาย ดอกเบี้ยเป็นโมฆะทั้งหมด
 * 
 * 2. ประมวลกฎหมายแพ่งและพาณิชย์ มาตรา 654
 *    - ถ้าดอกเบี้ยเกิน 15% ต่อปี ศาลอาจลดลงได้
 * 
 * 3. บัตรเครดิต/สินเชื่อส่วนบุคคล
 *    - บัตรเครดิต: สูงสุด 16% ต่อปี
 *    - สินเชื่อส่วนบุคคล: สูงสุด 25% ต่อปี
 *    - นาโนไฟแนนซ์: สูงสุด 33% ต่อปี
 * 
 * ⚠️ หมายเหตุ: เงินกู้นอกระบบที่เกิน 15%/ปี ถือว่าผิดกฎหมาย
 * =====================================================
 */

// อัตราดอกเบี้ยสูงสุดตามกฎหมาย
export const LEGAL_INTEREST_LIMITS = {
  PERSONAL_YEARLY: 0.15,      // 15% ต่อปี
  PERSONAL_MONTHLY: 0.0125,   // 1.25% ต่อเดือน
  PERSONAL_DAILY: 0.00041,    // 0.041% ต่อวัน (15%/365)
  CREDIT_CARD_YEARLY: 0.16,   // 16% ต่อปี
  PERSONAL_LOAN_YEARLY: 0.25, // 25% ต่อปี
  NANO_FINANCE_YEARLY: 0.33,  // 33% ต่อปี
};

/**
 * ตรวจสอบว่าอัตราดอกเบี้ยเกินกฎหมายหรือไม่
 */
export function checkInterestRateLegality(
  rate: number, 
  mode: "YEARLY" | "MONTHLY" | "DAILY"
): { isLegal: boolean; message: string; limit: number } {
  let yearlyRate: number;
  let limit: number;
  
  switch (mode) {
    case "YEARLY":
      yearlyRate = rate;
      limit = LEGAL_INTEREST_LIMITS.PERSONAL_YEARLY;
      break;
    case "MONTHLY":
      yearlyRate = rate * 12;
      limit = LEGAL_INTEREST_LIMITS.PERSONAL_MONTHLY;
      break;
    case "DAILY":
      yearlyRate = rate * 365;
      limit = LEGAL_INTEREST_LIMITS.PERSONAL_DAILY;
      break;
  }

  const isLegal = yearlyRate <= LEGAL_INTEREST_LIMITS.PERSONAL_YEARLY;
  
  if (!isLegal) {
    return {
      isLegal: false,
      limit,
      message: `⚠️ อัตราดอกเบี้ยเกินกฎหมาย! ตาม พ.ร.บ. ห้ามเรียกดอกเบี้ยเกินอัตรา พ.ศ. 2560 บุคคลธรรมดาเรียกดอกเบี้ยได้ไม่เกิน 15% ต่อปี (${(LEGAL_INTEREST_LIMITS.PERSONAL_MONTHLY * 100).toFixed(2)}% ต่อเดือน)`
    };
  }

  return {
    isLegal: true,
    limit,
    message: "✅ อัตราดอกเบี้ยอยู่ในกรอบกฎหมาย"
  };
}

/**
 * =====================================================
 * สูตรการคำนวณดอกเบี้ย
 * =====================================================
 * 
 * 1. ดอกเบี้ยรายปี (Yearly Interest)
 *    ดอกเบี้ย = เงินต้น × อัตราดอกเบี้ย(%) × ระยะเวลา(ปี)
 *    ตัวอย่าง: 10,000 × 0.10 × 1 = 1,000 บาท
 * 
 * 2. ดอกเบี้ยรายเดือน (Monthly Interest)
 *    ดอกเบี้ย = เงินต้น × อัตราดอกเบี้ยต่อเดือน
 *    ตัวอย่าง: 10,000 × 0.05 = 500 บาท/เดือน
 * 
 * 3. ดอกเบี้ยรายวัน (Daily Interest)
 *    ดอกเบี้ย = เงินต้น × อัตราดอกเบี้ยต่อวัน × จำนวนวัน
 *    ตัวอย่าง: 10,000 × 0.02 = 200 บาท/วัน
 * 
 * 4. ดอกเบี้ยแบบเงินต้นคงที่ (Flat Rate) - นอกระบบ
 *    - ดอกเบี้ยรวม = เงินต้น × ดอกเบี้ย/เดือน × จำนวนเดือน
 *    - ยอดรวม = เงินต้น + ดอกเบี้ยรวม
 *    - ผ่อน/งวด = ยอดรวม ÷ จำนวนงวด
 *    ตัวอย่าง: กู้ 10,000 ดอกเบี้ย 5%/เดือน 5 เดือน
 *    - ดอกเบี้ยรวม = 500 × 5 = 2,500 บาท
 *    - ยอดรวม = 12,500 บาท
 *    - ผ่อน/เดือน = 2,500 บาท
 * =====================================================
 */

/**
 * คำนวณดอกเบี้ยตาม Interest Policy
 * 
 * MONTHLY Mode:
 * - รอบแรกไม่เต็มเดือน → คิดรายวัน (prorate)
 * - รอบเต็มเดือน → principal × monthly_rate
 * - จ่ายกลางเดือน → แบ่งช่วงเวลา แล้วคิดรายวันตามยอดคงเหลือ
 * 
 * DAILY Mode:
 * - interest = principal × daily_rate × days
 */
export function calculateInterest(
  loan: LoanWithPolicy,
  fromDate: Date,
  toDate: Date
): InterestCalculationResult {
  const policy = loan.interestPolicy;
  
  if (!policy) {
    return { totalInterest: 0, dailyBreakdown: [] };
  }

  const result: InterestCalculationResult = {
    totalInterest: 0,
    dailyBreakdown: [],
  };

  if (policy.mode === "DAILY") {
    return calculateDailyInterest(loan.remainingPrincipal, policy.dailyRate!, fromDate, toDate);
  }

  if (policy.mode === "MONTHLY") {
    return calculateMonthlyInterest(
      loan.remainingPrincipal,
      policy.monthlyRate!,
      policy.anchorDay || 1,
      fromDate,
      toDate
    );
  }

  return result;
}

/**
 * คำนวณดอกเบี้ยแบบรายวัน
 */
function calculateDailyInterest(
  principal: number,
  dailyRate: number,
  fromDate: Date,
  toDate: Date
): InterestCalculationResult {
  const days = daysBetween(fromDate, toDate);
  const interest = principal * dailyRate * days;

  return {
    totalInterest: interest,
    dailyBreakdown: [
      {
        date: fromDate,
        principal,
        interest,
        rate: dailyRate,
        days,
      },
    ],
  };
}

/**
 * คำนวณดอกเบี้ยแบบรายเดือน พร้อม prorate
 */
function calculateMonthlyInterest(
  principal: number,
  monthlyRate: number,
  anchorDay: number,
  fromDate: Date,
  toDate: Date
): InterestCalculationResult {
  const breakdown: InterestCalculationResult["dailyBreakdown"] = [];
  let totalInterest = 0;
  let currentDate = new Date(fromDate);

  while (currentDate < toDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const dailyRate = monthlyRate / daysInMonth;

    // หา anchor date ของเดือนนี้
    let anchorDate = new Date(year, month, Math.min(anchorDay, daysInMonth));
    
    // ถ้า currentDate > anchorDate ให้ใช้ anchor ของเดือนถัดไป
    if (currentDate > anchorDate) {
      const nextMonth = month + 1;
      const nextYear = nextMonth > 11 ? year + 1 : year;
      const nextMonthDays = getDaysInMonth(nextYear, nextMonth % 12);
      anchorDate = new Date(nextYear, nextMonth % 12, Math.min(anchorDay, nextMonthDays));
    }

    // กำหนด end date ของช่วงนี้
    const periodEnd = anchorDate < toDate ? anchorDate : toDate;
    const daysInPeriod = daysBetween(currentDate, periodEnd);

    if (daysInPeriod > 0) {
      // ถ้าเป็นรอบเต็มเดือน (จาก anchor ถึง anchor)
      const isFullMonth = 
        currentDate.getDate() === anchorDay && 
        periodEnd.getDate() === anchorDay &&
        daysInPeriod >= 28;

      let periodInterest: number;
      if (isFullMonth) {
        // รอบเต็มเดือน: principal × monthly_rate
        periodInterest = principal * monthlyRate;
      } else {
        // รอบไม่เต็มเดือน: prorate รายวัน
        periodInterest = principal * dailyRate * daysInPeriod;
      }

      breakdown.push({
        date: new Date(currentDate),
        principal,
        interest: periodInterest,
        rate: isFullMonth ? monthlyRate : dailyRate,
        days: daysInPeriod,
      });

      totalInterest += periodInterest;
    }

    // ไปรอบถัดไป
    currentDate = new Date(periodEnd);
  }

  return { totalInterest, dailyBreakdown: breakdown };
}

/**
 * คำนวณดอกเบี้ยเมื่อมีการจ่ายกลางเดือน
 * แบ่งช่วงเวลาแล้วคิดรายวันตามยอดคงเหลือ
 */
export function calculateInterestWithPayments(
  initialPrincipal: number,
  payments: Array<{ date: Date; principalPaid: number }>,
  policy: InterestPolicy,
  fromDate: Date,
  toDate: Date
): InterestCalculationResult {
  const breakdown: InterestCalculationResult["dailyBreakdown"] = [];
  let totalInterest = 0;
  let remainingPrincipal = initialPrincipal;

  // เรียงลำดับ payments ตามวันที่
  const sortedPayments = [...payments].sort((a, b) => a.date.getTime() - b.date.getTime());

  let periodStart = new Date(fromDate);

  for (const payment of sortedPayments) {
    if (payment.date > periodStart && payment.date <= toDate) {
      // คำนวณดอกเบี้ยช่วงก่อน payment
      const periodResult = calculateInterest(
        { remainingPrincipal, interestPolicy: policy } as LoanWithPolicy,
        periodStart,
        payment.date
      );

      breakdown.push(...periodResult.dailyBreakdown);
      totalInterest += periodResult.totalInterest;

      // อัพเดทยอดเงินต้นคงเหลือ
      remainingPrincipal -= payment.principalPaid;
      periodStart = new Date(payment.date);
    }
  }

  // คำนวณช่วงสุดท้าย
  if (periodStart < toDate && remainingPrincipal > 0) {
    const periodResult = calculateInterest(
      { remainingPrincipal, interestPolicy: policy } as LoanWithPolicy,
      periodStart,
      toDate
    );

    breakdown.push(...periodResult.dailyBreakdown);
    totalInterest += periodResult.totalInterest;
  }

  return { totalInterest, dailyBreakdown: breakdown };
}

/**
 * คำนวณดอกเบี้ยคงค้างจนถึงวันนี้ (เวลาประเทศไทย)
 * หากมีการชำระเงินแล้ว จะเริ่มนับจากวันที่ชำระล่าสุด
 * 
 * @param loan - ข้อมูลเงินกู้พร้อม allocations
 * @param lastPaymentDate - วันที่ชำระเงินล่าสุด (optional)
 */
export function calculateAccruedInterest(
  loan: LoanWithPolicy, 
  lastPaymentDate?: Date | null
): number {
  // ใช้เวลาประเทศไทย (GMT+7)
  const today = getThailandToday();
  
  // ถ้ามีวันที่ชำระล่าสุด ให้เริ่มนับจากวันนั้น
  // ถ้าไม่มี ให้ใช้วันที่เริ่มกู้
  const startFrom = lastPaymentDate ? new Date(lastPaymentDate) : new Date(loan.startDate);
  
  // ถ้าวันเริ่มนับอยู่หลังวันนี้ ให้ดอกเบี้ย = 0
  if (startFrom >= today) {
    return 0;
  }
  
  const result = calculateInterest(loan, startFrom, today);
  return result.totalInterest;
}

/**
 * คำนวณดอกเบี้ยคงค้างโดยคิดจากการชำระเงินทั้งหมด (เวลาประเทศไทย)
 * เริ่มนับดอกเบี้ยใหม่หลังแต่ละครั้งที่ชำระ
 * 
 * @param loan - ข้อมูลเงินกู้
 * @param allocations - รายการชำระเงิน
 */
export function calculateAccruedInterestFromPayments(
  loan: LoanWithPolicy,
  allocations: Array<{ payment: { paymentDate: Date } }>
): number {
  // หาวันที่ชำระเงินล่าสุด
  if (allocations.length === 0) {
    // ไม่มีการชำระเงิน ใช้วันที่เริ่มกู้
    return calculateAccruedInterest(loan, null);
  }
  
  // เรียงลำดับตามวันที่และหาวันล่าสุด
  const sortedAllocations = [...allocations].sort(
    (a, b) => new Date(b.payment.paymentDate).getTime() - new Date(a.payment.paymentDate).getTime()
  );
  
  const lastPaymentDate = new Date(sortedAllocations[0].payment.paymentDate);
  
  return calculateAccruedInterest(loan, lastPaymentDate);
}
