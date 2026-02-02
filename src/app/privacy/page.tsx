import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Wallet } from "lucide-react";

export const metadata = {
  title: "นโยบายความเป็นส่วนตัว | Debt Manager",
  description: "นโยบายความเป็นส่วนตัวของระบบจัดการหนี้สิน Debt Manager",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                <ArrowLeft className="h-5 w-5 text-slate-600" />
              </Link>
              <div className="h-6 w-px bg-slate-200"></div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Debt Manager
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 md:p-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">นโยบายความเป็นส่วนตัว</h1>
              <p className="text-slate-500">ปรับปรุงล่าสุด: 1 กุมภาพันธ์ 2569</p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">1. บทนำ</h2>
              <p className="text-slate-600 leading-relaxed">
                Debt Manager ("เรา", "ของเรา") ให้ความสำคัญกับความเป็นส่วนตัวของท่าน นโยบายความเป็นส่วนตัวนี้อธิบายวิธีที่เราเก็บรวบรวม ใช้ เปิดเผย และปกป้องข้อมูลของท่านเมื่อท่านใช้บริการของเรา
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">2. ข้อมูลที่เราเก็บรวบรวม</h2>
              <p className="text-slate-600 leading-relaxed mb-4">เราเก็บรวบรวมข้อมูลประเภทต่อไปนี้:</p>
              
              <h3 className="text-lg font-medium text-slate-700 mt-6 mb-3">2.1 ข้อมูลที่ท่านให้โดยตรง</h3>
              <ul className="list-disc list-inside text-slate-600 space-y-2">
                <li>ข้อมูลบัญชี: ชื่อ อีเมล รูปโปรไฟล์ (ผ่าน Google OAuth)</li>
                <li>ข้อมูลผู้ติดต่อ: ชื่อ เบอร์โทร ที่อยู่ของลูกหนี้/เจ้าหนี้</li>
                <li>ข้อมูลทางการเงิน: สัญญากู้ยืม อัตราดอกเบี้ย การชำระเงิน</li>
                <li>เอกสารที่อัปโหลด: สลิปการโอนเงิน รูปสินค้า เอกสารสัญญา</li>
              </ul>

              <h3 className="text-lg font-medium text-slate-700 mt-6 mb-3">2.2 ข้อมูลที่เก็บโดยอัตโนมัติ</h3>
              <ul className="list-disc list-inside text-slate-600 space-y-2">
                <li>ข้อมูลการใช้งาน: หน้าที่เยี่ยมชม ฟีเจอร์ที่ใช้ ระยะเวลาใช้งาน</li>
                <li>ข้อมูลอุปกรณ์: ประเภทเบราว์เซอร์ ระบบปฏิบัติการ IP address</li>
                <li>คุกกี้และเทคโนโลยีติดตาม</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">3. วิธีที่เราใช้ข้อมูล</h2>
              <p className="text-slate-600 leading-relaxed mb-4">เราใช้ข้อมูลของท่านเพื่อ:</p>
              <ul className="list-disc list-inside text-slate-600 space-y-2">
                <li>ให้บริการและปรับปรุงแพลตฟอร์มของเรา</li>
                <li>ประมวลผลธุรกรรมและส่งการแจ้งเตือน</li>
                <li>ตอบคำถามและให้การสนับสนุน</li>
                <li>วิเคราะห์รูปแบบการใช้งานเพื่อปรับปรุงบริการ</li>
                <li>ป้องกันการฉ้อโกงและรักษาความปลอดภัย</li>
                <li>ปฏิบัติตามข้อกำหนดทางกฎหมาย</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">4. การแบ่งปันข้อมูล</h2>
              <p className="text-slate-600 leading-relaxed mb-4">เราอาจแบ่งปันข้อมูลของท่านกับ:</p>
              <ul className="list-disc list-inside text-slate-600 space-y-2">
                <li><strong>ผู้ให้บริการ:</strong> บริษัทที่ช่วยดำเนินการบริการ (เช่น การเก็บข้อมูลบนคลาวด์ การวิเคราะห์)</li>
                <li><strong>สมาชิกทีม:</strong> ผู้ใช้อื่นใน Workspace เดียวกันตามการอนุญาตที่กำหนด</li>
                <li><strong>ข้อกำหนดทางกฎหมาย:</strong> เมื่อกฎหมายกำหนดหรือเพื่อปกป้องสิทธิ์ของเรา</li>
              </ul>
              <p className="text-slate-600 leading-relaxed mt-4">
                <strong>เราจะไม่ขายข้อมูลส่วนบุคคลของท่านให้กับบุคคลที่สาม</strong>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">5. การเก็บรักษาข้อมูล</h2>
              <p className="text-slate-600 leading-relaxed">
                เราเก็บรักษาข้อมูลของท่านตราบเท่าที่บัญชียังเปิดใช้งานหรือตามที่จำเป็นเพื่อให้บริการ หลังจากลบบัญชี เราจะลบหรือทำให้ข้อมูลไม่ระบุตัวตนภายใน 90 วัน ยกเว้นที่กฎหมายกำหนดให้เก็บรักษา
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">6. ความปลอดภัยของข้อมูล</h2>
              <p className="text-slate-600 leading-relaxed mb-4">เราใช้มาตรการรักษาความปลอดภัยที่เหมาะสม:</p>
              <ul className="list-disc list-inside text-slate-600 space-y-2">
                <li>การเข้ารหัส SSL/TLS สำหรับข้อมูลที่ส่งผ่านเครือข่าย</li>
                <li>การเข้ารหัสข้อมูลที่จัดเก็บ</li>
                <li>การควบคุมการเข้าถึงและการยืนยันตัวตน</li>
                <li>การสำรองข้อมูลเป็นประจำ</li>
                <li>การตรวจสอบความปลอดภัยเป็นระยะ</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">7. สิทธิ์ของท่าน</h2>
              <p className="text-slate-600 leading-relaxed mb-4">ท่านมีสิทธิ์ในการ:</p>
              <ul className="list-disc list-inside text-slate-600 space-y-2">
                <li><strong>เข้าถึง:</strong> ขอสำเนาข้อมูลส่วนบุคคลของท่าน</li>
                <li><strong>แก้ไข:</strong> ปรับปรุงข้อมูลที่ไม่ถูกต้อง</li>
                <li><strong>ลบ:</strong> ขอให้ลบข้อมูลของท่าน</li>
                <li><strong>ส่งออก:</strong> รับข้อมูลในรูปแบบที่อ่านได้</li>
                <li><strong>คัดค้าน:</strong> คัดค้านการประมวลผลบางประเภท</li>
                <li><strong>ถอนความยินยอม:</strong> ถอนความยินยอมได้ทุกเมื่อ</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">8. คุกกี้</h2>
              <p className="text-slate-600 leading-relaxed">
                เราใช้คุกกี้เพื่อปรับปรุงประสบการณ์การใช้งาน รักษาสถานะการเข้าสู่ระบบ และวิเคราะห์การใช้งาน ท่านสามารถจัดการการตั้งค่าคุกกี้ผ่านเบราว์เซอร์ แต่การปิดคุกกี้บางตัวอาจส่งผลกระทบต่อการทำงานของบริการ
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">9. การถ่ายโอนข้อมูลระหว่างประเทศ</h2>
              <p className="text-slate-600 leading-relaxed">
                ข้อมูลของท่านอาจถูกถ่ายโอนและจัดเก็บบนเซิร์ฟเวอร์นอกประเทศไทย เราใช้ผู้ให้บริการที่มีมาตรการคุ้มครองข้อมูลที่เหมาะสมตามมาตรฐานสากล
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">10. ความเป็นส่วนตัวของเด็ก</h2>
              <p className="text-slate-600 leading-relaxed">
                บริการของเราไม่ได้มุ่งเน้นสำหรับบุคคลอายุต่ำกว่า 18 ปี เราไม่เก็บรวบรวมข้อมูลจากเด็กโดยเจตนา หากท่านเชื่อว่าเด็กได้ให้ข้อมูลแก่เรา กรุณาติดต่อเราเพื่อลบข้อมูล
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">11. การเปลี่ยนแปลงนโยบาย</h2>
              <p className="text-slate-600 leading-relaxed">
                เราอาจปรับปรุงนโยบายนี้เป็นครั้งคราว เราจะแจ้งให้ท่านทราบเกี่ยวกับการเปลี่ยนแปลงที่สำคัญผ่านอีเมลหรือการแจ้งเตือนในแอปพลิเคชัน
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">12. ติดต่อเรา</h2>
              <p className="text-slate-600 leading-relaxed">
                หากท่านมีคำถามเกี่ยวกับนโยบายความเป็นส่วนตัวนี้หรือต้องการใช้สิทธิ์ของท่าน กรุณาติดต่อ:
              </p>
              <p className="text-slate-600 mt-2">
                <strong>เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล (DPO)</strong><br />
                <strong>อีเมล:</strong> privacy@debtmanager.app<br />
                <strong>เว็บไซต์:</strong> https://debtmanager.app
              </p>
            </section>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-200 flex flex-wrap gap-4">
            <Link href="/terms">
              <Button variant="outline" className="rounded-full">
                เงื่อนไขการใช้งาน
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button className="rounded-full">
                กลับสู่หน้าหลัก
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-slate-500 text-sm">
        <p>© 2569 Debt Manager. สงวนลิขสิทธิ์.</p>
      </footer>
    </div>
  );
}
