'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { translations } from '@/translations'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Coins } from 'lucide-react'
import { format } from 'date-fns'

interface Transaction {
  id: string
  amount: number
  balance: number
  type: 'CREDIT' | 'DEBIT'
  reason: string
  description: string | null
  status: string
  createdAt: string
}

interface PaginationInfo {
  total: number
  page: number
  limit: number
  totalPages: number
}

interface TransactionsComponentProps {
  transactions: Transaction[]
  pagination: PaginationInfo
  handlePageChange: (page: number) => void
  getTransactionIcon: (type: string) => JSX.Element
  formatAmount: (amount: number, type: string) => string
  t: any
  format: any
}

export default function TransactionsComponent({
  transactions,
  pagination,
  handlePageChange,
  getTransactionIcon,
  formatAmount,
  t,
  format
}: TransactionsComponentProps) {
  if (transactions.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        {t.payment.history.empty}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">{t.transactionHistory}</h2>
      </div>

      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">{t.type}</TableHead>
              <TableHead>{t.description}</TableHead>
              <TableHead>{t.amount}</TableHead>
              <TableHead>{t.balance}</TableHead>
              <TableHead>{t.date}</TableHead>
              <TableHead>{t.status}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {getTransactionIcon(transaction.type)}
                    {transaction.reason}
                  </div>
                </TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell className={transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}>
                  {formatAmount(transaction.amount, transaction.type)}
                </TableCell>
                <TableCell>{transaction.balance}</TableCell>
                <TableCell>{format(new Date(transaction.createdAt), 'dd/MM/yyyy HH:mm')}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    transaction.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    transaction.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {transaction.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm">
          {t.page} {pagination.page} {t.of} {pagination.totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page === pagination.totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
