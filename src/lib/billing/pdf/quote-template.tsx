import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from '@react-pdf/renderer'

/* ─── Props ─────────────────────────────────────────────────────── */

export interface QuotePDFProps {
  quoteNumber: string
  date: string
  validUntil: string
  business: {
    name: string
    phone?: string
    email?: string
    website?: string
    address?: any
  }
  client?: { name: string; email?: string; phone?: string }
  lineItems: Array<{
    description: string
    quantity: number
    unitPriceCents: number
    totalCents: number
  }>
  subtotalCents: number
  taxCents: number
  taxRate: number
  totalCents: number
  notes?: string
}

/* ─── Helpers ───────────────────────────────────────────────────── */

const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`

/* ─── Colors ────────────────────────────────────────────────────── */

const C = {
  primary: '#1d1d1f',
  primaryLight: '#f5f5f7',
  dark: '#1d1d1f',
  secondary: '#86868b',
  lightBg: '#f5f5f7',
  border: '#d2d2d7',
  white: '#ffffff',
  rowAlt: '#f5f5f7',
} as const

/* ─── Styles ────────────────────────────────────────────────────── */

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: C.dark,
    backgroundColor: C.white,
    paddingTop: 48,
    paddingBottom: 60,
    paddingHorizontal: 48,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  businessName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 22,
    color: C.dark,
    marginBottom: 6,
  },
  businessInfo: {
    fontSize: 9,
    color: C.secondary,
    lineHeight: 1.6,
  },
  quoteLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 28,
    color: C.primary,
    textAlign: 'right' as const,
    marginBottom: 4,
  },
  quoteNumber: {
    fontSize: 11,
    color: C.secondary,
    textAlign: 'right' as const,
  },

  /* Divider */
  divider: {
    height: 2,
    backgroundColor: C.primary,
    marginBottom: 24,
  },
  thinDivider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 16,
  },

  /* Client + Meta row */
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  infoBlock: {
    flex: 1,
  },
  infoLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: C.primary,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 10,
    color: C.dark,
    lineHeight: 1.6,
  },
  infoValueSecondary: {
    fontSize: 9,
    color: C.secondary,
    lineHeight: 1.6,
  },

  /* Table */
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: C.primary,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tableHeaderText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: C.white,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tableRowAlt: {
    backgroundColor: C.rowAlt,
  },
  colDesc: { flex: 3 },
  colQty: { flex: 0.7, textAlign: 'center' as const },
  colUnit: { flex: 1.2, textAlign: 'right' as const },
  colTotal: { flex: 1.2, textAlign: 'right' as const },
  cellText: {
    fontSize: 10,
    color: C.dark,
  },
  cellTextSecondary: {
    fontSize: 10,
    color: C.secondary,
  },

  /* Totals */
  totalsWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  totalsBox: {
    width: 220,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  totalsLabel: {
    fontSize: 10,
    color: C.secondary,
  },
  totalsValue: {
    fontSize: 10,
    color: C.dark,
  },
  totalsDivider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 4,
  },
  grandTotalLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 13,
    color: C.dark,
  },
  grandTotalValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 13,
    color: C.primary,
  },

  /* Notes */
  notesBox: {
    marginTop: 28,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    padding: 14,
    backgroundColor: C.lightBg,
  },
  notesTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: C.primary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  notesText: {
    fontSize: 9,
    color: C.secondary,
    lineHeight: 1.6,
  },

  /* Footer */
  footer: {
    position: 'absolute' as const,
    bottom: 30,
    left: 48,
    right: 48,
    textAlign: 'center' as const,
  },
  footerLine: {
    height: 1,
    backgroundColor: C.border,
    marginBottom: 10,
  },
  footerText: {
    fontSize: 8,
    color: C.secondary,
  },
  footerBrand: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: C.primary,
  },
})

/* ─── Component ─────────────────────────────────────────────────── */

export function QuotePDF(props: QuotePDFProps) {
  const {
    quoteNumber,
    date,
    validUntil,
    business,
    client,
    lineItems,
    subtotalCents,
    taxCents,
    taxRate,
    totalCents,
    notes,
  } = props

  const addressLines: string[] = []
  if (business.address) {
    const a = business.address
    if (a.street) addressLines.push(a.street)
    const cityLine = [a.city, a.state, a.zip].filter(Boolean).join(', ')
    if (cityLine) addressLines.push(cityLine)
  }

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* ── Header ── */}
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={s.businessName}>{business.name}</Text>
            <View>
              {addressLines.map((line, i) => (
                <Text key={i} style={s.businessInfo}>
                  {line}
                </Text>
              ))}
              {business.phone && (
                <Text style={s.businessInfo}>{business.phone}</Text>
              )}
              {business.email && (
                <Text style={s.businessInfo}>{business.email}</Text>
              )}
              {business.website && (
                <Text style={s.businessInfo}>{business.website}</Text>
              )}
            </View>
          </View>

          <View style={{ alignItems: 'flex-end' as const }}>
            <Text style={s.quoteLabel}>QUOTE</Text>
            <Text style={s.quoteNumber}>{quoteNumber}</Text>
          </View>
        </View>

        {/* ── Divider ── */}
        <View style={s.divider} />

        {/* ── Client + Meta ── */}
        <View style={s.infoRow}>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Quote For</Text>
            {client ? (
              <>
                <Text style={s.infoValue}>{client.name}</Text>
                {client.email && (
                  <Text style={s.infoValueSecondary}>{client.email}</Text>
                )}
                {client.phone && (
                  <Text style={s.infoValueSecondary}>{client.phone}</Text>
                )}
              </>
            ) : (
              <Text style={s.infoValueSecondary}>--</Text>
            )}
          </View>

          <View style={{ flex: 1, alignItems: 'flex-end' as const }}>
            <Text style={s.infoLabel}>Details</Text>
            <Text style={s.infoValue}>Date: {date}</Text>
            <Text style={s.infoValue}>Valid Until: {validUntil}</Text>
            <Text style={s.infoValue}>Quote #: {quoteNumber}</Text>
          </View>
        </View>

        {/* ── Line Items Table ── */}
        <View>
          {/* Header row */}
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderText, s.colDesc]}>Description</Text>
            <Text style={[s.tableHeaderText, s.colQty]}>Qty</Text>
            <Text style={[s.tableHeaderText, s.colUnit]}>Unit Price</Text>
            <Text style={[s.tableHeaderText, s.colTotal]}>Total</Text>
          </View>

          {/* Data rows */}
          {lineItems.map((item, idx) => (
            <View
              key={idx}
              style={[s.tableRow, idx % 2 === 1 ? s.tableRowAlt : {}]}
            >
              <Text style={[s.cellText, s.colDesc]}>{item.description}</Text>
              <Text style={[s.cellTextSecondary, s.colQty]}>
                {item.quantity}
              </Text>
              <Text style={[s.cellTextSecondary, s.colUnit]}>
                {fmt(item.unitPriceCents)}
              </Text>
              <Text style={[s.cellText, s.colTotal]}>
                {fmt(item.totalCents)}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Totals ── */}
        <View style={s.totalsWrapper}>
          <View style={s.totalsBox}>
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>Subtotal</Text>
              <Text style={s.totalsValue}>{fmt(subtotalCents)}</Text>
            </View>

            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>Tax ({taxRate}%)</Text>
              <Text style={s.totalsValue}>{fmt(taxCents)}</Text>
            </View>

            <View style={s.totalsDivider} />

            <View style={s.totalsRow}>
              <Text style={s.grandTotalLabel}>Total</Text>
              <Text style={s.grandTotalValue}>{fmt(totalCents)}</Text>
            </View>
          </View>
        </View>

        {/* ── Notes ── */}
        {notes && (
          <View style={s.notesBox}>
            <Text style={s.notesTitle}>Notes</Text>
            <Text style={s.notesText}>{notes}</Text>
          </View>
        )}

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <View style={s.footerLine} />
          <Text style={s.footerText}>
            Thank you for your business!
          </Text>
          <Text style={s.footerBrand}>{business.name}</Text>
        </View>
      </Page>
    </Document>
  )
}
