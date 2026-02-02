import type { Loan, InterestPolicy } from "@prisma/client";
import { getDaysInMonth, daysBetween } from "@/lib/utils";

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
 * คำนวณดอกเบี้ยคงค้างจนถึงวันนี้
 */
export function calculateAccruedInterest(loan: LoanWithPolicy): number {
  const today = new Date();
  const result = calculateInterest(loan, new Date(loan.startDate), today);
  return result.totalInterest;
}
