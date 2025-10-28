'use client'

import { useState, useEffect } from 'react'
import { Plus, TrendingUp, TrendingDown, DollarSign, Calendar, Filter, Edit2, Trash2, Target, Settings, AlertTriangle, PieChart, BarChart3, CheckCircle } from 'lucide-react'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  description: string
  category: string
  date: string
  paymentMethod?: string
}

interface Category {
  id: string
  name: string
  type: 'income' | 'expense'
  limit?: number
  color: string
}

interface Goal {
  id: string
  title: string
  targetAmount: number
  currentAmount: number
  deadline: string
  type: 'save' | 'spend'
}

const defaultCategories: Category[] = [
  // Receitas
  { id: '1', name: 'Salário', type: 'income', color: '#10B981' },
  { id: '2', name: 'Freelance', type: 'income', color: '#059669' },
  { id: '3', name: 'Investimentos', type: 'income', color: '#047857' },
  { id: '4', name: 'Outros', type: 'income', color: '#065F46' },
  // Despesas
  { id: '5', name: 'Alimentação', type: 'expense', limit: 800, color: '#EF4444' },
  { id: '6', name: 'Transporte', type: 'expense', limit: 400, color: '#F97316' },
  { id: '7', name: 'Moradia', type: 'expense', limit: 1500, color: '#8B5CF6' },
  { id: '8', name: 'Saúde', type: 'expense', limit: 300, color: '#06B6D4' },
  { id: '9', name: 'Educação', type: 'expense', limit: 200, color: '#84CC16' },
  { id: '10', name: 'Lazer', type: 'expense', limit: 500, color: '#F59E0B' },
  { id: '11', name: 'Compras', type: 'expense', limit: 600, color: '#EC4899' },
  { id: '12', name: 'Outros', type: 'expense', limit: 300, color: '#6B7280' }
]

const paymentMethods = ['Dinheiro', 'Cartão de Débito', 'Cartão de Crédito', 'PIX', 'Transferência']

export default function FinanceControl() {
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: '1', type: 'income', amount: 5000, description: 'Salário', category: 'Salário', date: '2024-01-15', paymentMethod: 'Transferência' },
    { id: '2', type: 'expense', amount: 1200, description: 'Aluguel', category: 'Moradia', date: '2024-01-10', paymentMethod: 'Transferência' },
    { id: '3', type: 'expense', amount: 300, description: 'Supermercado', category: 'Alimentação', date: '2024-01-12', paymentMethod: 'Cartão de Débito' },
    { id: '4', type: 'income', amount: 800, description: 'Freelance', category: 'Freelance', date: '2024-01-20', paymentMethod: 'PIX' },
    { id: '5', type: 'expense', amount: 150, description: 'Combustível', category: 'Transporte', date: '2024-01-18', paymentMethod: 'Cartão de Crédito' },
    { id: '6', type: 'expense', amount: 80, description: 'Cinema', category: 'Lazer', date: '2024-01-22', paymentMethod: 'Dinheiro' },
    { id: '7', type: 'expense', amount: 250, description: 'Consulta médica', category: 'Saúde', date: '2024-01-25', paymentMethod: 'Cartão de Débito' }
  ])
  
  const [categories, setCategories] = useState<Category[]>(defaultCategories)
  const [goals, setGoals] = useState<Goal[]>([
    { id: '1', title: 'Reserva de Emergência', targetAmount: 10000, currentAmount: 3500, deadline: '2024-12-31', type: 'save' },
    { id: '2', title: 'Viagem de Férias', targetAmount: 5000, currentAmount: 1200, deadline: '2024-07-01', type: 'save' }
  ])
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'categories' | 'goals'>('dashboard')
  const [showModal, setShowModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  
  // Filtros
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'week' | 'month' | 'year'>('month')
  const [filterPayment, setFilterPayment] = useState<string>('all')
  const [currentDate, setCurrentDate] = useState('')
  
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    description: '',
    category: '',
    date: '',
    paymentMethod: ''
  })

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense',
    limit: '',
    color: '#EF4444'
  })

  const [goalFormData, setGoalFormData] = useState({
    title: '',
    targetAmount: '',
    deadline: '',
    type: 'save' as 'save' | 'spend'
  })

  // Definir data atual apenas no cliente para evitar erro de hidratação
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    setCurrentDate(today)
    setFormData(prev => ({ ...prev, date: today }))
  }, [])

  // Filtrar transações por período
  const getFilteredTransactionsByPeriod = () => {
    const now = new Date()
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date)
      
      switch (filterPeriod) {
        case 'week':
          return transactionDate >= startOfWeek
        case 'month':
          return transactionDate >= startOfMonth
        case 'year':
          return transactionDate >= startOfYear
        default:
          return true
      }
    })
  }

  // Cálculos financeiros baseados no período
  const periodTransactions = getFilteredTransactionsByPeriod()
  
  const totalIncome = periodTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalExpenses = periodTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const balance = totalIncome - totalExpenses

  // Transações filtradas
  const filteredTransactions = periodTransactions.filter(transaction => {
    const typeMatch = filterType === 'all' || transaction.type === filterType
    const categoryMatch = filterCategory === 'all' || transaction.category === filterCategory
    const paymentMatch = filterPayment === 'all' || transaction.paymentMethod === filterPayment
    return typeMatch && categoryMatch && paymentMatch
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Gastos por categoria com limites
  const expensesByCategory = periodTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount
      return acc
    }, {} as Record<string, number>)

  // Alertas inteligentes
  const getAlerts = () => {
    const alerts = []
    
    // Verificar limites de categoria
    categories.filter(c => c.type === 'expense' && c.limit).forEach(category => {
      const spent = expensesByCategory[category.name] || 0
      const percentage = (spent / category.limit!) * 100
      
      if (percentage >= 80) {
        alerts.push({
          type: 'warning' as const,
          message: `Você já gastou ${percentage.toFixed(0)}% do limite da categoria ${category.name}`
        })
      }
    })

    // Comparar com mês anterior (simulado)
    const lastMonthExpenses = totalExpenses * 0.8 // Simulação
    if (totalExpenses > lastMonthExpenses * 1.2) {
      alerts.push({
        type: 'danger' as const,
        message: `Você gastou 20% a mais que o mês anterior`
      })
    }

    return alerts
  }

  const alerts = getAlerts()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const transaction: Transaction = {
      id: editingTransaction?.id || `${Date.now()}-${Math.random()}`,
      type: formData.type,
      amount: parseFloat(formData.amount),
      description: formData.description,
      category: formData.category,
      date: formData.date,
      paymentMethod: formData.paymentMethod
    }

    if (editingTransaction) {
      setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? transaction : t))
    } else {
      setTransactions(prev => [...prev, transaction])
    }

    setShowModal(false)
    setEditingTransaction(null)
    setFormData({
      type: 'expense',
      amount: '',
      description: '',
      category: '',
      date: currentDate,
      paymentMethod: ''
    })
  }

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const category: Category = {
      id: editingCategory?.id || `${Date.now()}-${Math.random()}`,
      name: categoryFormData.name,
      type: categoryFormData.type,
      limit: categoryFormData.limit ? parseFloat(categoryFormData.limit) : undefined,
      color: categoryFormData.color
    }

    if (editingCategory) {
      setCategories(prev => prev.map(c => c.id === editingCategory.id ? category : c))
    } else {
      setCategories(prev => [...prev, category])
    }

    setShowCategoryModal(false)
    setEditingCategory(null)
    setCategoryFormData({
      name: '',
      type: 'expense',
      limit: '',
      color: '#EF4444'
    })
  }

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const goal: Goal = {
      id: editingGoal?.id || `${Date.now()}-${Math.random()}`,
      title: goalFormData.title,
      targetAmount: parseFloat(goalFormData.targetAmount),
      currentAmount: editingGoal?.currentAmount || 0,
      deadline: goalFormData.deadline,
      type: goalFormData.type
    }

    if (editingGoal) {
      setGoals(prev => prev.map(g => g.id === editingGoal.id ? goal : g))
    } else {
      setGoals(prev => [...prev, goal])
    }

    setShowGoalModal(false)
    setEditingGoal(null)
    setGoalFormData({
      title: '',
      targetAmount: '',
      deadline: '',
      type: 'save'
    })
  }

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      description: transaction.description,
      category: transaction.category,
      date: transaction.date,
      paymentMethod: transaction.paymentMethod || ''
    })
    setShowModal(true)
  }

  const handleDelete = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  const openModal = () => {
    setEditingTransaction(null)
    setFormData({
      type: 'expense',
      amount: '',
      description: '',
      category: '',
      date: currentDate,
      paymentMethod: ''
    })
    setShowModal(true)
  }

  const openCategoryModal = () => {
    setEditingCategory(null)
    setCategoryFormData({
      name: '',
      type: 'expense',
      limit: '',
      color: '#EF4444'
    })
    setShowCategoryModal(true)
  }

  const openGoalModal = () => {
    setEditingGoal(null)
    setGoalFormData({
      title: '',
      targetAmount: '',
      deadline: '',
      type: 'save'
    })
    setShowGoalModal(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              FinSync
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Controle Inteligente de Finanças Pessoais
            </p>
          </div>
          <button
            onClick={openModal}
            className="mt-4 sm:mt-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            Nova Transação
          </button>
        </div>

        {/* Navegação por Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'transactions', label: 'Transações', icon: DollarSign },
            { id: 'categories', label: 'Categorias', icon: Settings },
            { id: 'goals', label: 'Metas', icon: Target }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Alertas */}
        {alerts.length > 0 && (
          <div className="mb-8 space-y-3">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl flex items-center gap-3 ${
                  alert.type === 'warning'
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                }`}
              >
                <AlertTriangle className={`w-5 h-5 ${
                  alert.type === 'warning' ? 'text-yellow-600' : 'text-red-600'
                }`} />
                <span className={`text-sm font-medium ${
                  alert.type === 'warning' ? 'text-yellow-800 dark:text-yellow-200' : 'text-red-800 dark:text-red-200'
                }`}>
                  {alert.message}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <>
            {/* Filtro de Período */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-slate-700 mb-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Período:</span>
                </div>
                
                <select
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="all">Todo o período</option>
                  <option value="week">Esta semana</option>
                  <option value="month">Este mês</option>
                  <option value="year">Este ano</option>
                </select>
              </div>
            </div>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Receitas</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      R$ {totalIncome.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Despesas</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      R$ {totalExpenses.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-xl">
                    <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Saldo</p>
                    <p className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                      R$ {balance.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${balance >= 0 ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                    <DollarSign className={`w-6 h-6 ${balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`} />
                  </div>
                </div>
              </div>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Gastos por Categoria */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-6">
                  <PieChart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Gastos por Categoria</h3>
                </div>
                <div className="space-y-4">
                  {Object.entries(expensesByCategory).map(([categoryName, amount]) => {
                    const category = categories.find(c => c.name === categoryName)
                    const percentage = (amount / totalExpenses) * 100
                    const isOverLimit = category?.limit && amount > category.limit
                    
                    return (
                      <div key={categoryName} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category?.color || '#6B7280' }}
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[100px]">
                              {categoryName}
                            </span>
                            <div className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                              <div
                                className="h-2 rounded-full transition-all duration-500"
                                style={{ 
                                  width: `${percentage}%`,
                                  backgroundColor: category?.color || '#6B7280'
                                }}
                              />
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <span className={`text-sm font-semibold ${isOverLimit ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                              R$ {amount.toLocaleString('pt-BR')}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 block">
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        {category?.limit && (
                          <div className="ml-6 text-xs text-gray-500 dark:text-gray-400">
                            Limite: R$ {category.limit.toLocaleString('pt-BR')} 
                            {isOverLimit && <span className="text-red-500 ml-1">(Excedido!)</span>}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Progresso das Metas */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-6">
                  <Target className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Metas</h3>
                </div>
                <div className="space-y-4">
                  {goals.slice(0, 3).map(goal => {
                    const progress = (goal.currentAmount / goal.targetAmount) * 100
                    const isCompleted = progress >= 100
                    
                    return (
                      <div key={goal.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {goal.title}
                          </span>
                          {isCompleted && <CheckCircle className="w-4 h-4 text-green-500" />}
                        </div>
                        <div className="bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              isCompleted ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>R$ {goal.currentAmount.toLocaleString('pt-BR')}</span>
                          <span>R$ {goal.targetAmount.toLocaleString('pt-BR')}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <>
            {/* Filtros */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-slate-700 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtros:</span>
                </div>
                
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'all' | 'income' | 'expense')}
                  className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="all">Todos os tipos</option>
                  <option value="income">Receitas</option>
                  <option value="expense">Despesas</option>
                </select>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="all">Todas as categorias</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.name}>{category.name}</option>
                  ))}
                </select>

                <select
                  value={filterPayment}
                  onChange={(e) => setFilterPayment(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="all">Todas as formas</option>
                  {paymentMethods.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lista de Transações */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700">
              <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Transações</h3>
              </div>
              
              <div className="divide-y divide-gray-100 dark:divide-slate-700">
                {filteredTransactions.map((transaction) => {
                  const category = categories.find(c => c.name === transaction.category)
                  
                  return (
                    <div key={transaction.id} className="p-6 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div 
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: `${category?.color}20` }}
                          >
                            {transaction.type === 'income' ? (
                              <TrendingUp className="w-5 h-5" style={{ color: category?.color }} />
                            ) : (
                              <TrendingDown className="w-5 h-5" style={{ color: category?.color }} />
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {transaction.description}
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                              <span>{transaction.category}</span>
                              <span>•</span>
                              <span>{transaction.paymentMethod}</span>
                              <span>•</span>
                              <span>{new Date(transaction.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className={`font-bold text-lg ${
                            transaction.type === 'income' 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}R$ {transaction.amount.toLocaleString('pt-BR')}
                          </span>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(transaction)}
                              className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(transaction.id)}
                              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gerenciar Categorias</h2>
              <button
                onClick={openCategoryModal}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nova Categoria
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Categorias de Despesas */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Despesas</h3>
                <div className="space-y-3">
                  {categories.filter(c => c.type === 'expense').map(category => {
                    const spent = expensesByCategory[category.name] || 0
                    const limitPercentage = category.limit ? (spent / category.limit) * 100 : 0
                    
                    return (
                      <div key={category.id} className="p-4 border border-gray-200 dark:border-slate-600 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="font-medium text-gray-900 dark:text-white">{category.name}</span>
                          </div>
                          <button
                            onClick={() => {
                              setEditingCategory(category)
                              setCategoryFormData({
                                name: category.name,
                                type: category.type,
                                limit: category.limit?.toString() || '',
                                color: category.color
                              })
                              setShowCategoryModal(true)
                            }}
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {category.limit && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">
                                R$ {spent.toLocaleString('pt-BR')} / R$ {category.limit.toLocaleString('pt-BR')}
                              </span>
                              <span className={`font-medium ${limitPercentage > 80 ? 'text-red-600' : 'text-gray-600'}`}>
                                {limitPercentage.toFixed(0)}%
                              </span>
                            </div>
                            <div className="bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-500 ${
                                  limitPercentage > 100 ? 'bg-red-500' : limitPercentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(limitPercentage, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Categorias de Receitas */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Receitas</h3>
                <div className="space-y-3">
                  {categories.filter(c => c.type === 'income').map(category => (
                    <div key={category.id} className="p-4 border border-gray-200 dark:border-slate-600 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="font-medium text-gray-900 dark:text-white">{category.name}</span>
                        </div>
                        <button
                          onClick={() => {
                            setEditingCategory(category)
                            setCategoryFormData({
                              name: category.name,
                              type: category.type,
                              limit: category.limit?.toString() || '',
                              color: category.color
                            })
                            setShowCategoryModal(true)
                          }}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Metas Financeiras</h2>
              <button
                onClick={openGoalModal}
                className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-700 transition-all duration-300 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nova Meta
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {goals.map(goal => {
                const progress = (goal.currentAmount / goal.targetAmount) * 100
                const isCompleted = progress >= 100
                const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                
                return (
                  <div key={goal.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Target className={`w-5 h-5 ${isCompleted ? 'text-green-500' : 'text-blue-500'}`} />
                        <h3 className="font-semibold text-gray-900 dark:text-white">{goal.title}</h3>
                      </div>
                      {isCompleted && <CheckCircle className="w-5 h-5 text-green-500" />}
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-gray-200 dark:bg-slate-700 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ${
                            isCompleted ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          R$ {goal.currentAmount.toLocaleString('pt-BR')}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          R$ {goal.targetAmount.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      
                      <div className="text-center">
                        <span className={`text-2xl font-bold ${isCompleted ? 'text-green-500' : 'text-blue-500'}`}>
                          {progress.toFixed(1)}%
                        </span>
                      </div>
                      
                      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                        {isCompleted ? (
                          <span className="text-green-500 font-medium">Meta concluída! 🎉</span>
                        ) : daysLeft > 0 ? (
                          <span>{daysLeft} dias restantes</span>
                        ) : (
                          <span className="text-red-500">Prazo vencido</span>
                        )}
                      </div>
                      
                      <button
                        onClick={() => {
                          setEditingGoal(goal)
                          setGoalFormData({
                            title: goal.title,
                            targetAmount: goal.targetAmount.toString(),
                            deadline: goal.deadline,
                            type: goal.type
                          })
                          setShowGoalModal(true)
                        }}
                        className="w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        Editar Meta
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal de Transação */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'income' | 'expense', category: '' }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="expense">Despesa</option>
                  <option value="income">Receita</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valor
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  placeholder="0,00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descrição
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  placeholder="Ex: Aluguel, Salário..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categoria
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.filter(c => c.type === formData.type).map(category => (
                    <option key={category.id} value={category.name}>{category.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Forma de Pagamento
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Selecione a forma</option>
                  {paymentMethods.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
                >
                  {editingTransaction ? 'Salvar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Categoria */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </h3>
            
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  placeholder="Ex: Alimentação, Salário..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo
                </label>
                <select
                  value={categoryFormData.type}
                  onChange={(e) => setCategoryFormData(prev => ({ ...prev, type: e.target.value as 'income' | 'expense' }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="expense">Despesa</option>
                  <option value="income">Receita</option>
                </select>
              </div>

              {categoryFormData.type === 'expense' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Limite Mensal (opcional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={categoryFormData.limit}
                    onChange={(e) => setCategoryFormData(prev => ({ ...prev, limit: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    placeholder="0,00"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cor
                </label>
                <input
                  type="color"
                  value={categoryFormData.color}
                  onChange={(e) => setCategoryFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full h-10 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300"
                >
                  {editingCategory ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Meta */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {editingGoal ? 'Editar Meta' : 'Nova Meta'}
            </h3>
            
            <form onSubmit={handleGoalSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  value={goalFormData.title}
                  onChange={(e) => setGoalFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  placeholder="Ex: Reserva de Emergência"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valor Alvo
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={goalFormData.targetAmount}
                  onChange={(e) => setGoalFormData(prev => ({ ...prev, targetAmount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  placeholder="0,00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prazo
                </label>
                <input
                  type="date"
                  value={goalFormData.deadline}
                  onChange={(e) => setGoalFormData(prev => ({ ...prev, deadline: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo
                </label>
                <select
                  value={goalFormData.type}
                  onChange={(e) => setGoalFormData(prev => ({ ...prev, type: e.target.value as 'save' | 'spend' }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="save">Economizar</option>
                  <option value="spend">Gastar</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-300"
                >
                  {editingGoal ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}