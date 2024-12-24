'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { translations } from '@/translations'
import { Button } from "@/components/ui/button"
import { Coins } from 'lucide-react'
import { format } from 'date-fns'
import TransactionsComponent from '@/components/transactions'
import DashboardComponent from '@/components/dashboard'

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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { language } = useLanguage()
  const t = translations[language]

  const fetchTransactions = async (page: number) => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/transactions/history?page=${page}&limit=${pagination.limit}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch transactions')
      }
      
      setTransactions(data.transactions)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions(1)
  }, [])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchTransactions(newPage)
    }
  }

  const getTransactionIcon = (type: string) => {
    return <Coins className={`h-4 w-4 ${type === 'CREDIT' ? 'text-green-500' : 'text-red-500'}`} />
  }

  const formatAmount = (amount: number, type: string) => {
    const prefix = type === 'CREDIT' ? '+' : '-'
    return `${prefix}${Math.abs(amount)}`
  }

  if (loading) {
    return (
      <DashboardComponent>
        <div className="flex justify-center items-center min-h-[400px]">Loading...</div>
      </DashboardComponent>
    )
  }

  if (error) {
    return (
      <DashboardComponent>
        <div className="flex flex-col justify-center items-center min-h-[400px]">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => fetchTransactions(1)}>Try Again</Button>
        </div>
      </DashboardComponent>
    )
  }

  return (
    <DashboardComponent>
      <TransactionsComponent
        transactions={transactions}
        pagination={pagination}
        handlePageChange={handlePageChange}
        getTransactionIcon={getTransactionIcon}
        formatAmount={formatAmount}
        t={t}
        format={format}
      />
    </DashboardComponent>
  )
}
