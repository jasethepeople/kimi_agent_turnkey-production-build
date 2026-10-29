import { motion } from 'framer-motion'
import { Download, FileDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export interface Invoice {
  id: string
  date: string
  description: string
  amount: string
  status: 'Paid' | 'Refunded'
}

export const MOCK_INVOICES: Invoice[] = [
  { id: 'INV-2025-011', date: 'Nov 1, 2025', description: 'Legacy Tier — monthly', amount: '$29.00', status: 'Paid' },
  { id: 'INV-2025-010', date: 'Oct 1, 2025', description: 'Legacy Tier — monthly', amount: '$29.00', status: 'Paid' },
  { id: 'INV-2025-009', date: 'Sep 1, 2025', description: 'Legacy Tier — monthly', amount: '$29.00', status: 'Paid' },
  { id: 'INV-2025-008', date: 'Aug 1, 2025', description: 'Legacy Tier — monthly', amount: '$29.00', status: 'Paid' },
  { id: 'INV-2025-007', date: 'Jul 1, 2025', description: 'Legacy Tier — monthly', amount: '$29.00', status: 'Paid' },
  { id: 'INV-2025-006', date: 'Jun 1, 2025', description: 'Legacy Tier — monthly', amount: '$29.00', status: 'Refunded' },
  { id: 'INV-2025-005', date: 'May 1, 2025', description: 'Legacy Tier — monthly', amount: '$29.00', status: 'Paid' },
  { id: 'INV-2025-004', date: 'Apr 1, 2025', description: 'Legacy Tier — first month', amount: '$29.00', status: 'Paid' },
]

export default function InvoiceTable({ invoices }: { invoices: Invoice[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-stroke bg-ink-900/80">
      <div className="flex items-center justify-between border-b border-stroke/60 px-5 py-4">
        <h3 className="font-display text-xl font-semibold text-parchment">
          Billing history
        </h3>
        <button className="flex items-center gap-2 rounded-full border border-parchment/25 px-4 py-1.5 text-xs text-parchment transition-colors hover:border-spectral hover:text-spectral">
          <FileDown className="h-3.5 w-3.5" /> Download all
        </button>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-stroke/60 hover:bg-transparent">
            <TableHead className="text-parchment-dim">Date</TableHead>
            <TableHead className="text-parchment-dim">Description</TableHead>
            <TableHead className="text-parchment-dim">Amount</TableHead>
            <TableHead className="text-parchment-dim">Status</TableHead>
            <TableHead className="text-right text-parchment-dim">Invoice</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((inv, i) => (
            <motion.tr
              key={inv.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i, duration: 0.35 }}
              className="border-stroke/50 transition-colors hover:bg-spectral/5"
            >
              <TableCell className="font-mono text-xs text-parchment-dim">
                {inv.date}
              </TableCell>
              <TableCell className="text-sm text-parchment">
                {inv.description}
              </TableCell>
              <TableCell className="font-mono text-sm text-parchment">
                {inv.amount}
              </TableCell>
              <TableCell>
                <span
                  className={cn(
                    'inline-flex rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider',
                    inv.status === 'Paid'
                      ? 'border-verdant/50 bg-verdant/10 text-verdant'
                      : 'border-ink-700 bg-ink-800 text-parchment-dim',
                  )}
                >
                  {inv.status}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <motion.button
                  whileHover={{ rotate: [0, -8, 8, 0] }}
                  transition={{ duration: 0.3 }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-stroke text-parchment-dim transition-colors hover:border-spectral hover:text-spectral"
                  aria-label={`Download ${inv.id}`}
                >
                  <Download className="h-3.5 w-3.5" />
                </motion.button>
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
