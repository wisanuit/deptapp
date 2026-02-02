import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, Plus, Users, ChevronRight, 
  Phone, Mail, FileText, TrendingUp
} from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: { workspaceId: string };
}

// Avatar component
function Avatar({ name, size = "lg", imageUrl }: { name: string; size?: "sm" | "md" | "lg" | "xl"; imageUrl?: string | null }) {
  const initials = name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-xl"
  };
  
  if (imageUrl) {
    return (
      <img src={imageUrl} alt={name} className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-background shadow-sm`} />
    );
  }
  
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-primary to-blue-600 text-white flex items-center justify-center font-semibold ring-2 ring-background shadow-sm`}>
      {initials}
    </div>
  );
}

export default async function ContactsPage({ params }: Props) {
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

  const contacts = await prisma.contact.findMany({
    where: { workspaceId: params.workspaceId },
    include: {
      _count: {
        select: { loansAsBorrower: true, loansAsLender: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const typeConfig: Record<string, { label: string; className: string; icon: string }> = {
    INDIVIDUAL: { label: "บุคคล", className: "bg-blue-100 text-blue-700", icon: "👤" },
    COMPANY: { label: "บริษัท", className: "bg-purple-100 text-purple-700", icon: "🏢" },
    BOTH: { label: "ทั้งคู่", className: "bg-green-100 text-green-700", icon: "🔄" },
    BORROWER: { label: "ผู้กู้", className: "bg-orange-100 text-orange-700", icon: "📥" },
    LENDER: { label: "ผู้ให้กู้", className: "bg-emerald-100 text-emerald-700", icon: "📤" },
  };

  // Summary calculations
  const totalBorrowCount = contacts.reduce((sum, c) => sum + c._count.loansAsBorrower, 0);
  const totalLendCount = contacts.reduce((sum, c) => sum + c._count.loansAsLender, 0);
  const activeContacts = contacts.filter(c => c._count.loansAsBorrower > 0 || c._count.loansAsLender > 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Facebook-style Header */}
      <header className="bg-card sticky top-0 z-50 shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Link 
                href={`/workspaces/${params.workspaceId}`} 
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-semibold">ผู้ติดต่อ</h1>
              </div>
            </div>
            <Link href={`/workspaces/${params.workspaceId}/contacts/new`}>
              <Button className="rounded-full gap-2">
                <Plus className="h-4 w-4" />
                เพิ่มผู้ติดต่อ
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Contact List */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">รายชื่อผู้ติดต่อ ({contacts.length})</h2>
            </div>

            {contacts.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-lg text-muted-foreground mb-4">ยังไม่มีผู้ติดต่อ</p>
                  <Link href={`/workspaces/${params.workspaceId}/contacts/new`}>
                    <Button className="rounded-full gap-2">
                      <Plus className="h-4 w-4" />
                      เพิ่มผู้ติดต่อคนแรก
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {contacts.map((contact) => {
                  const type = typeConfig[contact.type] || typeConfig.BOTH;
                  const hasLoans = contact._count.loansAsBorrower > 0 || contact._count.loansAsLender > 0;
                  return (
                    <Link
                      key={contact.id}
                      href={`/workspaces/${params.workspaceId}/contacts/${contact.id}`}
                    >
                      <Card className="hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all cursor-pointer group h-full">
                        <CardContent className="p-4">
                          {/* Header: Avatar + Name + Type */}
                          <div className="flex items-start gap-3 mb-3">
                            <Avatar name={contact.name} size="lg" imageUrl={contact.imageUrl} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold truncate">{contact.name}</h3>
                              </div>
                              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${type.className}`}>
                                {type.icon} {type.label}
                              </span>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </div>

                          {/* Contact Info */}
                          <div className="space-y-2 mb-3">
                            {contact.phone && (
                              <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Phone className="h-4 w-4 text-primary" />
                                {contact.phone}
                              </p>
                            )}
                            {contact.email && (
                              <p className="text-sm text-muted-foreground flex items-center gap-2 truncate">
                                <Mail className="h-4 w-4 text-primary" />
                                {contact.email}
                              </p>
                            )}
                          </div>

                          {/* Loan Stats */}
                          <div className={`rounded-lg p-3 ${hasLoans ? 'bg-muted/50' : 'bg-gray-50'}`}>
                            <div className="flex justify-between items-center">
                              <div className="text-center flex-1">
                                <p className={`text-xl font-bold ${contact._count.loansAsBorrower > 0 ? 'text-orange-600' : 'text-muted-foreground'}`}>
                                  {contact._count.loansAsBorrower}
                                </p>
                                <p className="text-xs text-muted-foreground">เป็นผู้กู้</p>
                              </div>
                              <div className="w-px h-8 bg-border" />
                              <div className="text-center flex-1">
                                <p className={`text-xl font-bold ${contact._count.loansAsLender > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                                  {contact._count.loansAsLender}
                                </p>
                                <p className="text-xs text-muted-foreground">เป็นผู้ให้กู้</p>
                              </div>
                            </div>
                          </div>

                          {/* Note */}
                          {contact.note && (
                            <p className="mt-3 text-sm text-muted-foreground line-clamp-2 flex items-start gap-2">
                              <FileText className="h-4 w-4 flex-shrink-0 mt-0.5 text-primary" />
                              {contact.note}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Summary Stats */}
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  ภาพรวม
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      ผู้ติดต่อทั้งหมด
                    </span>
                    <span className="text-xl font-bold">{contacts.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      มีสัญญาที่ใช้งาน
                    </span>
                    <span className="text-xl font-bold text-green-600">{activeContacts.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">จำนวนเป็นผู้กู้</span>
                    <span className="text-lg font-bold text-orange-600">{totalBorrowCount} สัญญา</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted-foreground">จำนวนเป็นผู้ให้กู้</span>
                    <span className="text-lg font-bold text-emerald-600">{totalLendCount} สัญญา</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Types Summary */}
            <Card className="border-blue-200 bg-blue-50/30">
              <CardContent className="p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  ประเภทผู้ติดต่อ
                </h3>
                <div className="space-y-2">
                  {Object.entries(
                    contacts.reduce((acc, c) => {
                      acc[c.type] = (acc[c.type] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([type, count]) => {
                    const config = typeConfig[type] || typeConfig.BOTH;
                    return (
                      <div key={type} className="flex justify-between items-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
                          {config.icon} {config.label}
                        </span>
                        <span className="font-semibold">{count} คน</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold mb-4">การดำเนินการ</h3>
                <div className="space-y-2">
                  <Link href={`/workspaces/${params.workspaceId}/contacts/new`} className="block">
                    <Button className="w-full rounded-lg gap-2">
                      <Plus className="h-4 w-4" />
                      เพิ่มผู้ติดต่อ
                    </Button>
                  </Link>
                  <Link href={`/workspaces/${params.workspaceId}/loans`} className="block">
                    <Button variant="outline" className="w-full rounded-lg gap-2">
                      <FileText className="h-4 w-4" />
                      ดูสัญญาทั้งหมด
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
