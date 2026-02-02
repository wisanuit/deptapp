# Debt Management SaaS

ระบบจัดการเจ้าหนี้ ลูกหนี้ และบัตรเครดิต แบบ Multi-tenant SaaS

## ✨ Features

### Core Features
- 🔐 **Authentication** - Login ด้วย Google OAuth
- 🏢 **Multi-Workspace** - 1 User มีหลาย Workspace (SaaS)
- 👥 **Contacts** - จัดการผู้ติดต่อ (เจ้าหนี้/ลูกหนี้) พร้อมข้อมูลบัญชีธนาคาร
- 💰 **Loans** - สัญญาเงินกู้ (รายการให้กู้ยืม)
- 💸 **Debts** - หนี้ที่ต้องจ่าย (สัญญาที่เราเป็นลูกหนี้)
- 💳 **Credit Cards** - จัดการบัตรเครดิต รอบบิล
- 🛒 **Installments** - ระบบผ่อนสินค้า พร้อมจัดการสต๊อก
- 💵 **Customer Credits** - วงเงินเครดิตลูกค้า
- 🔔 **Notifications** - ระบบแจ้งเตือน
- 📋 **Collections** - ติดตามทวงหนี้

### Interest Calculation
- **Monthly Mode** - คิดดอกเบี้ยรายเดือน
  - Prorate รอบแรกที่ไม่เต็มเดือน
  - คำนวณดอกเบี้ยกลางเดือนได้
- **Daily Mode** - คิดดอกเบี้ยรายวัน

### Payment Allocation
- จ่ายเงินก้อนเดียว ตัดหลายสัญญาได้
- เลือกตัดดอก/ต้น แยกกัน
- Auto-allocation: Interest First, Principal First, FIFO
- รองรับทั้งสัญญาเงินกู้และหนี้ที่ต้องจ่าย

### Contact Management
- รูปโปรไฟล์ผู้ติดต่อ
- ข้อมูลบัญชีธนาคาร (ชื่อธนาคาร, เลขที่บัญชี, ชื่อบัญชี)
- พร้อมเพย์และ QR Code
- ป้องกันการลบบัญชีตัวเอง

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js Route Handlers
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js + Google OAuth
- **State**: React Query
- **Validation**: Zod

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Route Handlers
│   │   ├── auth/          # NextAuth
│   │   ├── upload/        # File upload API
│   │   └── workspaces/    # Workspace APIs
│   │       └── [workspaceId]/
│   │           ├── contacts/
│   │           ├── loans/
│   │           ├── payments/
│   │           ├── credit-cards/
│   │           ├── customer-credits/
│   │           ├── installments/
│   │           ├── interest-policies/
│   │           ├── loan-applications/
│   │           ├── collections/
│   │           └── notifications/
│   ├── auth/              # Auth pages
│   ├── dashboard/         # Dashboard
│   └── workspaces/        # Workspace pages
│       └── [workspaceId]/
│           ├── contacts/      # ผู้ติดต่อ
│           ├── loans/         # สัญญาเงินกู้ (ให้กู้)
│           ├── debts/         # หนี้ที่ต้องจ่าย
│           ├── payments/      # การชำระเงิน
│           ├── credit-cards/  # บัตรเครดิต
│           ├── customer-credits/ # วงเงินเครดิต
│           ├── installments/  # ผ่อนสินค้า
│           ├── products/      # จัดการสต๊อก
│           ├── interest-policies/ # นโยบายดอกเบี้ย
│           ├── loan-applications/ # ใบสมัครกู้
│           ├── collections/   # ติดตามทวงหนี้
│           ├── notifications/ # แจ้งเตือน
│           └── settings/      # ตั้งค่า
├── components/            # React Components
│   ├── providers.tsx      # Context Providers
│   └── ui/                # UI Components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── image-upload.tsx   # อัปโหลดรูปภาพ
│       ├── document-upload.tsx # อัปโหลดเอกสาร
│       └── ...
├── lib/                   # Utilities
│   ├── auth.ts            # NextAuth config
│   ├── prisma.ts          # Prisma client
│   ├── utils.ts           # Helper functions
│   └── validations.ts     # Zod schemas
├── services/              # Business Logic
│   ├── interest.service.ts    # Interest calculation
│   ├── payment.service.ts     # Payment allocation
│   ├── creditcard.service.ts  # Credit card logic
│   ├── creditlimit.service.ts # Credit limit
│   ├── installment.service.ts # Installment
│   ├── loanapplication.service.ts
│   ├── collection.service.ts
│   └── notification.service.ts
└── types/                 # TypeScript types
    └── next-auth.d.ts

prisma/
└── schema.prisma          # Database schema

public/
└── uploads/               # Uploaded files
    ├── installments/
    ├── products/
    └── contacts/
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Neon, Supabase, or local)
- Google OAuth credentials

### Installation

1. **Clone and install dependencies**
```bash
npm install
```

2. **Setup environment variables**
```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://user:password@host:5432/database"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

3. **Setup database**
```bash
npm run db:generate
npm run db:push
```

4. **Run development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Run migrations |
| `npm run db:studio` | Open Prisma Studio |

## 🗂 Database Schema

### Main Models
- **User** - ผู้ใช้งาน (from NextAuth)
- **Workspace** - Workspace สำหรับ multi-tenant
- **WorkspaceMember** - สมาชิกใน Workspace
- **Contact** - ผู้ติดต่อ (เจ้าหนี้/ลูกหนี้) พร้อมข้อมูลธนาคาร
- **InterestPolicy** - นโยบายดอกเบี้ย
- **Loan** - สัญญาเงินกู้ (RECEIVABLE/PAYABLE)
- **Payment** - การชำระเงิน
- **PaymentAllocation** - การจัดสรรเงินให้แต่ละสัญญา
- **CreditCard** - บัตรเครดิต
- **CreditCardStatement** - ใบแจ้งยอดบัตร
- **CustomerCreditLimit** - วงเงินเครดิตลูกค้า
- **InstallmentPlan** - แผนผ่อนสินค้า
- **Product** - สินค้า (สต๊อก)
- **LoanApplication** - ใบสมัครกู้
- **CollectionCase** - เคสติดตามทวงหนี้
- **Notification** - การแจ้งเตือน

## 🔧 Configuration

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable OAuth 2.0
4. Create OAuth Client ID (Web application)
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://your-domain.com/api/auth/callback/google`

### Database Options

- **Neon** - Serverless Postgres (recommended)
- **Supabase** - Postgres with extras
- **AWS RDS** - Managed PostgreSQL
- **Local** - PostgreSQL local instance

## 📖 API Documentation

### Workspaces
- `GET /api/workspaces` - List user's workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces/:id` - Get workspace
- `PATCH /api/workspaces/:id` - Update workspace
- `DELETE /api/workspaces/:id` - Delete workspace

### Contacts
- `GET /api/workspaces/:id/contacts` - List contacts
- `POST /api/workspaces/:id/contacts` - Create contact
- `PATCH /api/workspaces/:id/contacts/:contactId` - Update contact (รวมข้อมูลธนาคาร)
- `DELETE /api/workspaces/:id/contacts/:contactId` - Delete contact (ห้ามลบตัวเอง)

### Loans
- `GET /api/workspaces/:id/loans` - List loans
  - Query: `loanType=RECEIVABLE|PAYABLE` (ให้กู้/หนี้)
  - Query: `status=OPEN,OVERDUE,CLOSED`
- `POST /api/workspaces/:id/loans` - Create loan
- `GET /api/workspaces/:id/loans/:loanId` - Get loan with interest
- `PATCH /api/workspaces/:id/loans/:loanId` - Update loan

### Payments
- `GET /api/workspaces/:id/payments` - List payments
- `POST /api/workspaces/:id/payments` - Create payment with allocations

### Credit Cards
- `GET /api/workspaces/:id/credit-cards` - List cards
- `POST /api/workspaces/:id/credit-cards` - Create card

### Installments
- `GET /api/workspaces/:id/installments` - List installment plans
- `POST /api/workspaces/:id/installments` - Create installment plan

### Customer Credits
- `GET /api/workspaces/:id/customer-credits` - List credit limits
- `POST /api/workspaces/:id/customer-credits` - Create credit limit

### Interest Policies
- `GET /api/workspaces/:id/interest-policies` - List policies
- `POST /api/workspaces/:id/interest-policies` - Create policy

### Collections
- `GET /api/workspaces/:id/collections` - List collection cases
- `POST /api/workspaces/:id/collections` - Create case

### Notifications
- `GET /api/workspaces/:id/notifications` - List notifications
- `PATCH /api/workspaces/:id/notifications/:id` - Mark as read

### Upload
- `POST /api/upload` - Upload file (image/document)

## 🧮 Interest Calculation Formula

### Monthly Interest (Prorate)
```
daily_rate = monthly_rate / days_in_month
interest = principal × daily_rate × days
```

### Daily Interest
```
interest = principal × daily_rate × days
```

## 📄 License

MIT License

## ☁️ Deployment Guide

### 🚀 Step-by-Step: Deploy to Vercel + Neon

---

#### Step 1: สร้าง Neon Database

1. ไปที่ **[neon.tech](https://neon.tech)**
2. คลิก **"Sign Up"** → ใช้ GitHub หรือ Email
3. คลิก **"New Project"**
4. ตั้งชื่อ: `debt-management`
5. **Region**: เลือก `Asia Pacific (Singapore)` ⬅️ สำคัญ!
6. คลิก **"Create Project"**
7. **Copy Connection String** เก็บไว้:
```
postgresql://neondb_owner:xxx@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

---

#### Step 2: Push Code ไป GitHub

```bash
# ถ้ายังไม่มี git
git init
git add .
git commit -m "Initial commit"

# สร้าง repo บน GitHub แล้ว push
git remote add origin https://github.com/YOUR_USERNAME/debt-management.git
git branch -M main
git push -u origin main
```

---

#### Step 3: สร้าง Google OAuth Credentials

1. ไปที่ **[console.cloud.google.com](https://console.cloud.google.com)**
2. สร้าง Project ใหม่ หรือเลือก Project ที่มี
3. ไปที่ **APIs & Services** → **Credentials**
4. คลิก **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
5. ถ้าถูกถามให้ตั้งค่า OAuth consent screen ก่อน:
   - User Type: **External**
   - App name: `Debt Management`
   - User support email: อีเมลของคุณ
   - Developer contact: อีเมลของคุณ
   - คลิก **Save and Continue** จนจบ
6. กลับมาสร้าง OAuth Client ID:
   - Application type: **Web application**
   - Name: `Debt Management`
   - Authorized redirect URIs: 
     ```
     http://localhost:3000/api/auth/callback/google
     https://YOUR-APP.vercel.app/api/auth/callback/google
     ```
7. คลิก **Create**
8. **Copy** `Client ID` และ `Client Secret`

---

#### Step 4: Deploy to Vercel

1. ไปที่ **[vercel.com](https://vercel.com)**
2. คลิก **"Sign Up"** → Login ด้วย **GitHub**
3. คลิก **"Add New..."** → **"Project"**
4. เลือก repository `debt-management`
5. คลิก **"Import"**

---

#### Step 5: ตั้งค่า Environment Variables

ในหน้า Configure Project → คลิก **"Environment Variables"**

เพิ่มทีละตัว:

| NAME | VALUE |
|------|-------|
| `DATABASE_URL` | `postgresql://...` (จาก Neon Step 1) |
| `NEXTAUTH_URL` | `https://YOUR-APP.vercel.app` |
| `NEXTAUTH_SECRET` | (สร้างตามด้านล่าง) |
| `GOOGLE_CLIENT_ID` | (จาก Google Cloud Step 3) |
| `GOOGLE_CLIENT_SECRET` | (จาก Google Cloud Step 3) |

**สร้าง NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```
หรือไปที่ [generate-secret.vercel.app](https://generate-secret.vercel.app)

---

#### Step 6: Deploy

1. ตรวจสอบว่าใส่ Environment Variables ครบ
2. คลิก **"Deploy"**
3. รอ 2-3 นาที

---

#### Step 7: Setup Database Schema

หลัง deploy เสร็จ:

**Option A: ใช้ Terminal ใน local**
```bash
# สร้างไฟล์ .env.local
echo 'DATABASE_URL="postgresql://...จาก Neon..."' > .env.local

# Push schema ไป database
npx prisma db push
```

**Option B: ใช้ Vercel CLI**
```bash
npm i -g vercel
vercel login
vercel env pull .env.local
npx prisma db push
```

---

#### Step 8: อัพเดท NEXTAUTH_URL

1. ไป Vercel Dashboard → Project ของคุณ
2. ดู URL ที่ได้ เช่น `https://debt-management-xxx.vercel.app`
3. ไปที่ **Settings** → **Environment Variables**
4. แก้ไข `NEXTAUTH_URL` ให้ตรงกับ URL จริง
5. คลิก **Save**
6. ไปที่ **Deployments** → คลิก **"..."** → **"Redeploy"**

---

#### Step 9: อัพเดท Google OAuth Redirect URI

1. กลับไป Google Cloud Console
2. ไปที่ **Credentials** → คลิก OAuth Client ที่สร้างไว้
3. เพิ่ม Redirect URI:
```
https://YOUR-APP.vercel.app/api/auth/callback/google
```
4. คลิก **Save**

---

#### Step 10: ทดสอบ! 🎉

1. เปิด `https://YOUR-APP.vercel.app`
2. คลิก **Login with Google**
3. สร้าง Workspace แรก
4. เริ่มใช้งาน!

---

### ⚠️ หมายเหตุสำหรับ File Upload

Vercel เป็น **read-only filesystem** ดังนั้น `public/uploads/` ไม่ทำงาน

**วิธีแก้**: ใช้ Vercel Blob หรือ Uploadthing

#### Option A: Vercel Blob (แนะนำ)
```bash
npm install @vercel/blob
```

เพิ่ม Environment Variable:
```
BLOB_READ_WRITE_TOKEN=vercel_blob_xxx
```

#### Option B: Uploadthing
```bash
npm install uploadthing @uploadthing/react
```

---

### 🌏 Thai Server Options

| Provider | Region | Latency | ราคา |
|----------|--------|---------|------|
| **Vercel** | Singapore | ~30-50ms | Free tier |
| **Neon** | Singapore | ~30-50ms | Free 0.5GB |
| **DigitalOcean** | Singapore | ~20-40ms | $6/เดือน |
| **Z.com** | Thailand | ~5-15ms | ~300฿/เดือน |

---

### ✅ Deployment Checklist

- [ ] สร้าง Neon Database (Singapore region)
- [ ] Push code ไป GitHub
- [ ] สร้าง Google OAuth Credentials
- [ ] สร้าง Vercel Project
- [ ] ตั้งค่า 5 Environment Variables
- [ ] Deploy
- [ ] รัน `npx prisma db push`
- [ ] อัพเดท NEXTAUTH_URL ให้ตรงกับ URL จริง
- [ ] อัพเดท Google OAuth redirect URI
- [ ] ทดสอบ Login
- [ ] ตั้งค่า File Storage (Vercel Blob) - ถ้าต้องการ upload ไฟล์

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request
