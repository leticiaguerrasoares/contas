import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { prisma } from "@/lib/prisma"
import { startOfDay } from "date-fns"

async function getOverdueCount() {
  try {
    const count = await prisma.billOccurrence.count({
      where: {
        dueDate: { lt: startOfDay(new Date()) },
        status: { in: ["PENDING", "OVERDUE"] },
      },
    })
    return count
  } catch {
    return 0
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const overdueCount = await getOverdueCount()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar overdueCount={overdueCount} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <MobileNav overdueCount={overdueCount} />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl px-4 py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
