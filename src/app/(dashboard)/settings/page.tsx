import { Metadata } from "next"
import { Settings, Mail, Bell, Shield } from "lucide-react"
import { Separator } from "@/components/ui/separator"

export const metadata: Metadata = { title: "Configurações" }

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Preferências e informações do sistema
        </p>
      </div>

      {/* Notificações */}
      <div className="rounded-2xl border bg-card p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 text-primary">
            <Bell className="w-4.5 h-4.5" strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Notificações</h2>
            <p className="text-xs text-muted-foreground">Como e quando você recebe alertas</p>
          </div>
        </div>
        <Separator />

        <div className="space-y-4 text-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Resumo semanal</p>
              <p className="text-xs text-muted-foreground">Toda segunda-feira às 8h com as contas da semana</p>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
              Ativo
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Lembrete no vencimento</p>
              <p className="text-xs text-muted-foreground">No dia do vencimento se ainda não pago</p>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
              Ativo
            </span>
          </div>
        </div>
      </div>

      {/* Email */}
      <div className="rounded-2xl border bg-card p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 text-primary">
            <Mail className="w-4.5 h-4.5" strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Email</h2>
            <p className="text-xs text-muted-foreground">Configuração de envio de emails</p>
          </div>
        </div>
        <Separator />

        <div className="space-y-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Email de destino</p>
            <p className="font-mono text-xs bg-muted px-3 py-2 rounded-lg">
              {process.env.NOTIFICATION_EMAIL_TO || "Não configurado"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Remetente</p>
            <p className="font-mono text-xs bg-muted px-3 py-2 rounded-lg">
              {process.env.NOTIFICATION_EMAIL_FROM || "Não configurado"}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Para alterar o email, edite as variáveis de ambiente <code className="font-mono">NOTIFICATION_EMAIL_TO</code> e <code className="font-mono">NOTIFICATION_EMAIL_FROM</code>.
          </p>
        </div>
      </div>

      {/* Auth */}
      <div className="rounded-2xl border bg-card p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 text-primary">
            <Shield className="w-4.5 h-4.5" strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Acesso</h2>
            <p className="text-xs text-muted-foreground">Segurança e autenticação</p>
          </div>
        </div>
        <Separator />

        <div className="text-sm space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">Tipo de acesso</p>
            <span className="font-medium">Senha única</span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">Sessão</p>
            <span className="font-medium">30 dias (cookie seguro)</span>
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            A senha é configurada pela variável de ambiente <code className="font-mono">AUTH_PASSWORD</code>.
          </p>
        </div>
      </div>
    </div>
  )
}
