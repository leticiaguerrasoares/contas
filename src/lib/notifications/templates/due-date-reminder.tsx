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
import type { DueDateReminderData } from "../notification.types"
import { formatCurrency, formatDate } from "@/lib/utils"

interface DueDateReminderEmailProps {
  data: DueDateReminderData
}

export function DueDateReminderEmail({ data }: DueDateReminderEmailProps) {
  const { billTitle, dueDate, amount, currency, barcodeNumber, pixKey, pixQrCode, occurrenceId, appUrl } = data

  return (
    <Html>
      <Head />
      <Preview>{`Lembrete: ${billTitle} vence hoje — ${formatCurrency(amount, currency)}`}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Heading style={headingStyle}>💳 Minhas Contas</Heading>
          </Section>

          {/* Content */}
          <Section style={contentStyle}>
            <Heading as="h2" style={h2Style}>
              Conta vencendo hoje
            </Heading>

            <Section style={billCardStyle}>
              <Row>
                <Column>
                  <Text style={billTitleStyle}>{billTitle}</Text>
                  <Text style={billDateStyle}>Vencimento: {formatDate(dueDate)}</Text>
                </Column>
                <Column style={{ textAlign: "right" as const }}>
                  <Text style={amountStyle}>{String(formatCurrency(amount, currency))}</Text>
                </Column>
              </Row>
            </Section>

            {/* Dados de pagamento */}
            {(barcodeNumber || pixKey || pixQrCode) && (
              <>
                <Hr style={hrStyle} />
                <Text style={sectionTitleStyle}>Dados para pagamento</Text>

                {barcodeNumber && (
                  <Section style={dataBoxStyle}>
                    <Text style={dataLabelStyle}>Linha digitável</Text>
                    <Text style={dataValueStyle}>{barcodeNumber}</Text>
                  </Section>
                )}

                {pixKey && (
                  <Section style={dataBoxStyle}>
                    <Text style={dataLabelStyle}>Chave PIX</Text>
                    <Text style={dataValueStyle}>{pixKey}</Text>
                  </Section>
                )}

                {pixQrCode && (
                  <Section style={dataBoxStyle}>
                    <Text style={dataLabelStyle}>PIX Copia e Cola</Text>
                    <Text style={{ ...dataValueStyle, wordBreak: "break-all" as const }}>
                      {pixQrCode}
                    </Text>
                  </Section>
                )}
              </>
            )}

            <Hr style={hrStyle} />

            <Button href={`${appUrl}/occurrences/${occurrenceId}`} style={buttonStyle}>
              Ver detalhes e pagar
            </Button>
          </Section>

          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              Minhas Contas — App pessoal de gerenciamento de contas
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

const billCardStyle = {
  backgroundColor: "#f3f4f6",
  borderRadius: "12px",
  padding: "16px 20px",
  marginBottom: "20px",
}

const billTitleStyle = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#111827",
  margin: "0 0 4px",
}

const billDateStyle = {
  fontSize: "13px",
  color: "#6b7280",
  margin: "0",
}

const amountStyle = {
  fontSize: "20px",
  fontWeight: "700",
  color: "#111827",
  margin: "0",
}

const hrStyle = {
  borderColor: "#e5e7eb",
  margin: "20px 0",
}

const sectionTitleStyle = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#6b7280",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 12px",
}

const dataBoxStyle = {
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "12px 16px",
  marginBottom: "8px",
}

const dataLabelStyle = {
  fontSize: "11px",
  color: "#9ca3af",
  margin: "0 0 4px",
}

const dataValueStyle = {
  fontSize: "13px",
  color: "#111827",
  fontFamily: "monospace",
  margin: "0",
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
