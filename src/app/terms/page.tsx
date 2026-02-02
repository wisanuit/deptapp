import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Wallet } from "lucide-react";

export const metadata = {
  title: "เงื่อนไขการใช้งาน | Debt Manager",
  description: "เงื่อนไขการใช้งานระบบจัดการหนี้สิน Debt Manager",
};

export default function TermsOfServicePage() {
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
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">เงื่อนไขการใช้งาน</h1>
              <p className="text-slate-500">ปรับปรุงล่าสุด: 1 กุมภาพันธ์ 2569</p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">1. การยอมรับข้อกำหนด</h2>
              <p className="text-slate-600 leading-relaxed">
                การเข้าใช้งานหรือใช้บริการ Debt Manager ("บริการ") ของเรา ถือว่าท่านได้ยอมรับและตกลงที่จะปฏิบัติตามข้อกำหนดและเงื่อนไขการใช้งานเหล่านี้ หากท่านไม่ยอมรับข้อกำหนดเหล่านี้ ท่านไม่ควรใช้บริการของเรา
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">2. คำอธิบายบริการ</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Debt Manager เป็นระบบจัดการหนี้สินและสินเชื่อออนไลน์ที่ช่วยให้ผู้ใช้สามารถ:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2">
                <li>บันทึกและติดตามสัญญากู้ยืมเงิน</li>
                <li>คำนวณดอกเบี้ยอัตโนมัติ</li>
                <li>จัดการการชำระเงิน</li>
                <li>จัดการผ่อนชำระสินค้า</li>
                <li>จัดการบัตรเครดิตและสินเชื่อ</li>
                <li>ติดตามทวงหนี้</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">3. บัญชีผู้ใช้</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                เพื่อใช้บริการของเรา ท่านต้องสร้างบัญชีผู้ใช้โดย:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2">
                <li>ให้ข้อมูลที่ถูกต้องและเป็นปัจจุบัน</li>
                <li>รักษาความปลอดภัยของรหัสผ่าน</li>
                <li>รับผิดชอบต่อกิจกรรมทั้งหมดที่เกิดขึ้นภายใต้บัญชีของท่าน</li>
                <li>แจ้งเราทันทีเมื่อพบการใช้งานโดยไม่ได้รับอนุญาต</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">4. แผนการใช้งานและการชำระเงิน</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                เราเสนอแผนการใช้งานหลายระดับ:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2">
                <li><strong>แผนฟรี:</strong> ใช้งานได้จำกัดฟีเจอร์และปริมาณข้อมูล</li>
                <li><strong>แผนโปร:</strong> ฟีเจอร์ครบถ้วนสำหรับผู้ใช้งานจริงจัง</li>
                <li><strong>แผนธุรกิจ:</strong> ไม่จำกัดการใช้งานสำหรับองค์กร</li>
              </ul>
              <p className="text-slate-600 leading-relaxed mt-4">
                การชำระเงินสำหรับแผนที่มีค่าใช้จ่ายจะถูกเรียกเก็บล่วงหน้าเป็นรายเดือนหรือรายปี การยกเลิกจะมีผลเมื่อสิ้นสุดรอบการเรียกเก็บเงินปัจจุบัน
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">5. การใช้งานที่ยอมรับได้</h2>
              <p className="text-slate-600 leading-relaxed mb-4">ท่านตกลงที่จะไม่:</p>
              <ul className="list-disc list-inside text-slate-600 space-y-2">
                <li>ใช้บริการเพื่อวัตถุประสงค์ที่ผิดกฎหมาย</li>
                <li>ละเมิดสิทธิ์ในทรัพย์สินทางปัญญาของผู้อื่น</li>
                <li>ส่งข้อมูลที่เป็นอันตราย ไวรัส หรือโค้ดที่เป็นภัย</li>
                <li>พยายามเข้าถึงระบบโดยไม่ได้รับอนุญาต</li>
                <li>รบกวนการทำงานของบริการ</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">6. ทรัพย์สินทางปัญญา</h2>
              <p className="text-slate-600 leading-relaxed">
                บริการและเนื้อหาทั้งหมด รวมถึงซอฟต์แวร์ โลโก้ และเครื่องหมายการค้า เป็นทรัพย์สินของ Debt Manager และได้รับการคุ้มครองตามกฎหมายทรัพย์สินทางปัญญา ข้อมูลที่ท่านอัปโหลดหรือสร้างขึ้นยังคงเป็นของท่าน แต่ท่านให้สิทธิ์เราในการใช้งานเพื่อให้บริการ
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">7. ข้อจำกัดความรับผิดชอบ</h2>
              <p className="text-slate-600 leading-relaxed">
                บริการให้บริการ "ตามที่เป็นอยู่" และ "ตามที่มี" เราไม่รับประกันว่าบริการจะปราศจากข้อผิดพลาด ไม่หยุดชะงัก หรือเหมาะสมกับวัตถุประสงค์เฉพาะ เราจะไม่รับผิดชอบต่อความเสียหายใดๆ ที่เกิดจากการใช้งานบริการ รวมถึงการสูญเสียข้อมูลหรือกำไร
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">8. การยกเลิกบริการ</h2>
              <p className="text-slate-600 leading-relaxed">
                เราอาจระงับหรือยกเลิกบัญชีของท่านได้ทุกเมื่อหากท่านละเมิดข้อกำหนดเหล่านี้ เมื่อยกเลิก ท่านอาจสูญเสียการเข้าถึงข้อมูลของท่าน ท่านสามารถยกเลิกบัญชีได้ทุกเมื่อผ่านการตั้งค่าบัญชี
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">9. การเปลี่ยนแปลงข้อกำหนด</h2>
              <p className="text-slate-600 leading-relaxed">
                เราอาจปรับปรุงข้อกำหนดเหล่านี้เป็นครั้งคราว เราจะแจ้งให้ท่านทราบเกี่ยวกับการเปลี่ยนแปลงที่สำคัญ การใช้บริการต่อไปหลังจากการเปลี่ยนแปลงถือว่าท่านยอมรับข้อกำหนดใหม่
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">10. กฎหมายที่ใช้บังคับ</h2>
              <p className="text-slate-600 leading-relaxed">
                ข้อกำหนดเหล่านี้อยู่ภายใต้กฎหมายแห่งราชอาณาจักรไทย ข้อพิพาทใดๆ จะถูกยื่นต่อศาลที่มีเขตอำนาจในประเทศไทย
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">11. ติดต่อเรา</h2>
              <p className="text-slate-600 leading-relaxed">
                หากท่านมีคำถามเกี่ยวกับข้อกำหนดเหล่านี้ กรุณาติดต่อเราที่:
              </p>
              <p className="text-slate-600 mt-2">
                <strong>อีเมล:</strong> support@debtmanager.app<br />
                <strong>เว็บไซต์:</strong> https://debtmanager.app
              </p>
            </section>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-200 flex flex-wrap gap-4">
            <Link href="/privacy">
              <Button variant="outline" className="rounded-full">
                นโยบายความเป็นส่วนตัว
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
