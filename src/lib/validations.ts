import { z } from "zod";

// ==========================================
// WORKSPACE SCHEMAS
// ==========================================

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อ Workspace").max(100),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

// ==========================================
// CONTACT SCHEMAS
// ==========================================

export const contactTypeEnum = z.enum(["BORROWER", "LENDER", "BOTH"]);

export const createContactSchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อ").max(100),
  phone: z.string().max(20).optional(),
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง").optional().or(z.literal("")),
  imageUrl: z.string().max(500000).optional(),
  note: z.string().max(500).optional(),
  type: contactTypeEnum.default("BOTH"),
  // Bank account fields
  bankName: z.string().max(100).optional().or(z.literal("")),
  bankAccountNo: z.string().max(50).optional().or(z.literal("")),
  bankAccountName: z.string().max(100).optional().or(z.literal("")),
  promptPayNo: z.string().max(50).optional().or(z.literal("")),
  qrCodeUrl: z.string().max(500000).optional().or(z.literal("")),
});

export const updateContactSchema = createContactSchema.partial();

// ==========================================
// INTEREST POLICY SCHEMAS
// ==========================================

export const interestModeEnum = z.enum(["MONTHLY", "DAILY"]);

export const createInterestPolicySchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อ").max(100),
  mode: interestModeEnum,
  monthlyRate: z.number().min(0).max(1).optional(),
  dailyRate: z.number().min(0).max(1).optional(),
  anchorDay: z.number().int().min(1).max(31).optional(),
  graceDays: z.number().int().min(0).default(0),
});

export const updateInterestPolicySchema = createInterestPolicySchema.partial();

// ==========================================
// LOAN SCHEMAS
// ==========================================

export const loanStatusEnum = z.enum(["OPEN", "CLOSED", "OVERDUE"]);

export const createLoanSchema = z.object({
  borrowerId: z.string().cuid("Invalid borrower ID"),
  lenderId: z.string().cuid("Invalid lender ID").optional(),
  principal: z.number().positive("จำนวนเงินต้องมากกว่า 0"),
  startDate: z.string().or(z.date()),
  dueDate: z.string().or(z.date()).optional(),
  interestPolicyId: z.string().cuid().optional(),
  note: z.string().max(500).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

export const updateLoanSchema = z.object({
  dueDate: z.string().or(z.date()).optional(),
  status: loanStatusEnum.optional(),
  interestPolicyId: z.string().cuid().nullable().optional(),
  note: z.string().max(500).optional(),
});

// ==========================================
// PAYMENT SCHEMAS
// ==========================================

export const paymentAllocationSchema = z.object({
  loanId: z.string().cuid(),
  principalPaid: z.number().min(0).default(0),
  interestPaid: z.number().min(0).default(0),
});

export const createPaymentSchema = z.object({
  amount: z.number().positive("จำนวนเงินต้องมากกว่า 0"),
  paymentDate: z.string().or(z.date()),
  note: z.string().max(500).optional(),
  attachmentUrl: z.string().max(500000).optional(),
  allocations: z.array(paymentAllocationSchema).min(1, "กรุณาเลือก Loan ที่ต้องการจ่าย"),
});

export const autoAllocateSchema = z.object({
  amount: z.number().positive(),
  paymentDate: z.string().or(z.date()),
  method: z.enum(["INTEREST_FIRST", "PRINCIPAL_FIRST", "FIFO"]),
  note: z.string().optional(),
  attachmentUrl: z.string().max(500000).optional(),
});

// ==========================================
// CREDIT CARD SCHEMAS
// ==========================================

export const createCreditCardSchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อบัตร").max(100),
  cardNumber: z.string().length(4, "ใส่เลข 4 หลักสุดท้าย").optional(),
  creditLimit: z.number().positive("วงเงินต้องมากกว่า 0"),
  statementCutDay: z.number().int().min(1).max(31),
  paymentDueDays: z.number().int().min(1).max(60),
  minPaymentPercent: z.number().min(0).max(1).default(0.05),
  minPaymentFixed: z.number().min(0).optional(),
  interestRate: z.number().min(0).max(1),
});

export const updateCreditCardSchema = createCreditCardSchema.partial();

export const createCreditCardPaymentSchema = z.object({
  statementId: z.string().cuid(),
  amount: z.number().positive(),
  paymentDate: z.string().or(z.date()),
  note: z.string().optional(),
});

// ==========================================
// TYPE EXPORTS
// ==========================================

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type CreateContactInput = z.infer<typeof createContactSchema>;
export type CreateInterestPolicyInput = z.infer<typeof createInterestPolicySchema>;
export type CreateLoanInput = z.infer<typeof createLoanSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type AutoAllocateInput = z.infer<typeof autoAllocateSchema>;
export type CreateCreditCardInput = z.infer<typeof createCreditCardSchema>;
export type CreateCreditCardPaymentInput = z.infer<typeof createCreditCardPaymentSchema>;
