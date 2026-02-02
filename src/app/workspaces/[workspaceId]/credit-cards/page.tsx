import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Props {
  params: { workspaceId: string };
}

export default async function CreditCardsPage({ params }: Props) {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const workspace = await prisma.workspace.findFirst({
    where: {
      id: params.workspaceId,
      members: { some: { userId: session.user.id } },
    },
  });

  if (!workspace) {
    notFound();
  }

  const cards = await prisma.creditCard.findMany({
    where: { workspaceId: params.workspaceId },
    include: {
      statements: {
        where: { isPaid: false },
        orderBy: { dueDate: "asc" },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen bg-muted">
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href={`/workspaces/${params.workspaceId}`} className="text-muted-foreground hover:text-foreground">
                ← {workspace.name}
              </Link>
              <h1 className="text-2xl font-bold">บัตรเครดิต</h1>
            </div>
            <Link href={`/workspaces/${params.workspaceId}/credit-cards/new`}>
              <Button>+ เพิ่มบัตร</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {cards.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">ยังไม่มีบัตรเครดิต</p>
              <Link href={`/workspaces/${params.workspaceId}/credit-cards/new`}>
                <Button>เพิ่มบัตรใบแรก</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card) => {
              const nextStatement = card.statements[0];
              const availableCredit = card.creditLimit - card.currentBalance;
              const usagePercent = (card.currentBalance / card.creditLimit) * 100;

              return (
                <Link
                  key={card.id}
                  href={`/workspaces/${params.workspaceId}/credit-cards/${card.id}`}
                >
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-medium text-lg">{card.name}</h3>
                          {card.cardNumber && (
                            <p className="text-sm text-muted-foreground">
                              **** {card.cardNumber}
                            </p>
                          )}
                        </div>
                        <Badge variant={usagePercent > 80 ? "destructive" : "secondary"}>
                          {usagePercent.toFixed(0)}% ใช้ไป
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">ยอดใช้จ่าย</span>
                          <span className="font-medium">{formatCurrency(card.currentBalance)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">วงเงินคงเหลือ</span>
                          <span className="font-medium text-green-600">
                            {formatCurrency(availableCredit)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">วงเงินทั้งหมด</span>
                          <span>{formatCurrency(card.creditLimit)}</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            usagePercent > 80 ? "bg-destructive" : "bg-primary"
                          }`}
                          style={{ width: `${Math.min(usagePercent, 100)}%` }}
                        />
                      </div>

                      <div className="mt-4 pt-4 border-t text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">วันตัดรอบ</span>
                          <span>วันที่ {card.statementCutDay}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">ครบกำหนดชำระ</span>
                          <span>+{card.paymentDueDays} วัน</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
