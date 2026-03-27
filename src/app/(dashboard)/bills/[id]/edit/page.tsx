import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { buttonVariants } from "@/components/ui/button-variants"
import { BillForm } from "@/components/bills/bill-form"
import { prisma } from "@/lib/prisma"
import { cn, serialize } from "@/lib/utils"

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const bill = await prisma.bill.findUnique({ where: { id } })
  return { title: `Editar: ${bill?.title ?? "Conta"}` }
}

export default async function EditBillPage({ params }: Props) {
  const { id } = await params
  const bill = await prisma.bill.findUnique({ where: { id } })

  if (!bill) notFound()

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <Link href={`/bills/${bill.id}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar conta</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{bill.title}</p>
      </div>

      <BillForm bill={serialize(bill)} mode="edit" />
    </div>
  )
}
