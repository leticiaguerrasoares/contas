import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Button,
  Hr,
  Row,
  Column,
} from "@react-email/components"
import type { WeeklySummaryData } from "../notification.types"
import { formatCurrency, formatDate } from "@/lib/utils"
import { BILL_CATEGORIES } from "@/types"

interface WeeklySummaryEmailProps {
  data: WeeklySummaryData
}

export function WeeklySummaryEmail({ data }: WeeklySummaryEmailProps) {
  const { occurrences, totalAmount, overdueCount, overdueAmount, weekStart, weekEnd, appUrl } = data

  return (
    <Html>
      <Head />
      <Preview>{`Resumo semanal: ${occurrences.length} conta${occurrences.length !== 1 ? "s" : ""} — ${formatCurrency(totalAmount)}`}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Heading style={headingStyle}>💳 Minhas Contas</Heading>
            <Text style={headerSubStyle}>
              Resumo da semana: {formatDate(weekStart)} – {formatDate(weekEnd)}
            </Text>
          </Section>

          <Section style={contentStyle}>
            <Heading as="h2" style={h2Style}>
              Suas contas desta semana
            </Heading>

            {/* Totais */}
            <Section style={totalsStyle}>
              <Row>
                <Column style={{ textAlign: "center" as const }}>
                  <Text style={totalLabelStyle}>Vencimentos</Text>
                  <Text style={totalValueStyle}>{occurrences.length}</Text>
                </Column>
                <Column style={{ textAlign: "center" as const, borderLeft: "1px solid #e5e7eb" }}>
                  <Text style={totalLabelStyle}>Total a pagar</Text>
                  <Text style={totalValueStyle}>{formatCurrency(totalAmount)}</Text>
                </Column>
                {overdueCount > 0 && (
                  <Column style={{ textAlign: "center" as const, borderLeft: "1px solid #e5e7eb" }}>
                    <Text style={{ ...totalLabelStyle, color: "#dc2626" }}>Em atraso</Text>
                    <Text style={{ ...totalValueStyle, color: "#dc2626" }}>
                      {formatCurrency(overdueAmount)}
                    </Text>
                  </Column>
                )}
              </Row>
            </Section>

            <Hr style={hrStyle} />

            {/* Lista de vencimentos */}
            {occurrences.map((occ) => {
              const category = BILL_CATEGORIES.find((c) => c.value === occ.category)
              return (
                <Section key={occ.id} style={occurrenceRowStyle}>
                  <Row>
                    <Column style={{ width: "36px" }}>
                      <Text style={iconStyle}>{category?.icon ?? "📋"}</Text>
                    </Column>
                    <Column>
                      <Text style={occTitleStyle}>{occ.billTitle}</Text>
                      <Text style={occDateStyle}>{formatDate(occ.dueDate)}</Text>
                    </Column>
                    <Column style={{ textAlign: "right" as const }}>
                      <Text style={occAmountStyle}>{String(formatCurrency(occ.amount, occ.currency))}</Text>
                      {occ.status === "OVERDUE" && (
                        <Text style={overdueTagStyle}>ATRASADO</Text>
                      )}
                    </Column>
                  </Row>
                </Section>
              )
            })}

            {occurrences.length === 0 && (
              <Section style={{ padding: "24px", textAlign: "center" as const }}>
                <Text style={{ color: "#6b7280", fontSize: "14px" }}>
                  Nenhuma conta vence esta semana. ✅
                </Text>
              </Section>
            )}

            <Hr style={hrStyle} />

            <Button href={`${appUrl}/dashboard`} style={buttonStyle}>
              Ver no dashboard
            </Button>
          </Section>

          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              Minhas Contas — Resumo enviado toda segunda-feira às 8h
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const bodyStyle = {
  backgroundColor: "#f9fafb",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
}

const containerStyle = {
  maxWidth: "580px",
  margin: "40px auto",
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  overflow: "hidden",
  border: "1px solid #e5e7eb",
}

const headerStyle = {
  backgroundColor: "#4f46e5",
  padding: "24px 32px",
}

const headingStyle = {
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: "700",
  margin: "0 0 4px",
}

const headerSubStyle = {
  color: "#c7d2fe",
  fontSize: "13px",
  margin: "0",
}

const contentStyle = {
  padding: "32px",
}

const h2Style = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#111827",
  margin: "0 0 20px",
}

const totalsStyle = {
  backgroundColor: "#f3f4f6",
  borderRadius: "12px",
  padding: "16px",
  marginBottom: "20px",
}

const totalLabelStyle = {
  fontSize: "11px",
  color: "#6b7280",
  margin: "0 0 4px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
}

const totalValueStyle = {
  fontSize: "18px",
  fontWeight: "700",
  color: "#111827",
  margin: "0",
}

const hrStyle = {
  borderColor: "#e5e7eb",
  margin: "20px 0",
}

const occurrenceRowStyle = {
  padding: "10px 0",
  borderBottom: "1px solid #f3f4f6",
}

const iconStyle = {
  fontSize: "20px",
  margin: "0",
}

const occTitleStyle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#111827",
  margin: "0 0 2px",
}

const occDateStyle = {
  fontSize: "12px",
  color: "#6b7280",
  margin: "0",
}

const occAmountStyle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#111827",
  margin: "0",
}

const overdueTagStyle = {
  fontSize: "10px",
  color: "#dc2626",
  fontWeight: "700",
  margin: "2px 0 0",
}

const buttonStyle = {
  backgroundColor: "#4f46e5",
  color: "#ffffff",
  padding: "12px 24px",
  borderRadius: "10px",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  display: "inline-block",
}

const footerStyle = {
  backgroundColor: "#f9fafb",
  padding: "20px 32px",
  borderTop: "1px solid #e5e7eb",
}

const footerTextStyle = {
  fontSize: "12px",
  color: "#9ca3af",
  margin: "0",
  textAlign: "center" as const,
}
