import { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { buttonVariants } from "@/components/ui/button-variants"
import { BillForm } from "@/components/bills/bill-form"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Nova Conta" }

export default function NewBillPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <Link href="/bills" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Contas
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nova conta</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Preencha os dados da conta que deseja acompanhar
        </p>
      </div>

      <BillForm mode="create" />
    </div>
  )
}
