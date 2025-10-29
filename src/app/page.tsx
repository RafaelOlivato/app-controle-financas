'use client'

import { useState, useEffect } from 'react'
import { Plus, TrendingUp, TrendingDown, DollarSign, Calendar, Filter, Edit2, Trash2, Target, Settings, AlertTriangle, PieChart, BarChart3, CheckCircle } from 'lucide-react'
import { supabase, transactionService, categoryService, goalService, initializeTables, Transaction, Category, Goal } from '@/lib/supabase'

const paymentMethods = ['Dinheiro', 'Cartão de Débito', 'Cartão de Crédito', 'PIX', 'Transferência']

export default function FinanceControl() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  
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
    limit: '',
    color: '#EF4444',
    icon: 'MoreHorizontal'
  })

  const [goalFormData, setGoalFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    deadline: ''
  })

  // Carregar dados do banco
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Inicializar tabelas primeiro
      await initializeTables()
      
      const [transactionsData, categoriesData, goalsData] = await Promise.all([
        transactionService.getAll(),
        categoryService.getAll(),
        goalService.getAll()
      ])
      
      setTransactions(transactionsData)
      setCategories(categoriesData)
      setGoals(goalsData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const today = new Date()
    setCurrentDate(today.toISOString().split('T')[0])
    setFormData(prev => ({ ...prev, date: today.toISOString().split('T')[0] }))
  }, [])

  // Filtrar transações
  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date + 'T00:00:00')
    const now = new Date()
    
    // Filtro por tipo
    if (filterType !== 'all' && transaction.type !== filterType) return false
    
    // Filtro por categoria
    if (filterCategory !== 'all' && transaction.category !== filterCategory) return false
    
    // Filtro por método de pagamento
    if (filterPayment !== 'all' && transaction.paymentMethod !== filterPayment) return false
    
    // Filtro por período
    if (filterPeriod !== 'all') {
      const diffTime = Math.abs(now.getTime() - transactionDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      switch (filterPeriod) {
        case 'week':
          if (diffDays > 7) return false
          break
        case 'month':
          if (diffDays > 30) return false
          break
        case 'year':
          if (diffDays > 365) return false
          break
      }
    }
    
    return true
  })

  // Calcular totais
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const balance = totalIncome - totalExpense

  // Calcular gastos por categoria
  const expensesByCategory = categories.map(category => {
    const categoryExpenses = filteredTransactions
      .filter(t => t.type === 'expense' && t.category === category.name)
      .reduce((sum, t) => sum + t.amount, 0)
    
    return {
      ...category,
      spent: categoryExpenses,
      percentage: category.limit ? (categoryExpenses / category.limit) * 100 : 0
    }
  }).filter(cat => cat.spent > 0)

  // Adicionar/Editar transação
  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const transactionData = {
        type: formData.type,
        amount: parseFloat(formData.amount),
        description: formData.description,
        category: formData.category,
        date: formData.date,
        paymentMethod: formData.paymentMethod
      }

      if (editingTransaction) {
        await transactionService.update(editingTransaction.id!, transactionData)
      } else {
        await transactionService.create(transactionData)
      }

      await loadData()
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
    } catch (error) {
      console.error('Erro ao salvar transação:', error)
    }
  }

  // Deletar transação
  const handleDeleteTransaction = async (id: string) => {
    try {
      await transactionService.delete(id)
      await loadData()
    } catch (error) {
      console.error('Erro ao deletar transação:', error)
    }
  }

  // Adicionar/Editar categoria
  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const categoryData = {
        name: categoryFormData.name,
        limit: parseFloat(categoryFormData.limit) || 0,
        color: categoryFormData.color,
        icon: categoryFormData.icon
      }

      if (editingCategory) {
        await categoryService.update(editingCategory.id!, categoryData)
      } else {
        await categoryService.create(categoryData)
      }

      await loadData()
      setShowCategoryModal(false)
      setEditingCategory(null)
      setCategoryFormData({
        name: '',
        limit: '',
        color: '#EF4444',
        icon: 'MoreHorizontal'
      })
    } catch (error) {
      console.error('Erro ao salvar categoria:', error)
    }
  }

  // Deletar categoria
  const handleDeleteCategory = async (id: string) => {
    try {
      await categoryService.delete(id)
      await loadData()
    } catch (error) {
      console.error('Erro ao deletar categoria:', error)
    }
  }

  // Adicionar/Editar meta
  const handleSubmitGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const goalData = {
        name: goalFormData.name,
        targetAmount: parseFloat(goalFormData.targetAmount),
        currentAmount: parseFloat(goalFormData.currentAmount) || 0,
        deadline: goalFormData.deadline
      }

      if (editingGoal) {
        await goalService.update(editingGoal.id!, goalData)
      } else {
        await goalService.create(goalData)
      }

      await loadData()
      setShowGoalModal(false)
      setEditingGoal(null)
      setGoalFormData({
        name: '',
        targetAmount: '',
        currentAmount: '',
        deadline: ''
      })
    } catch (error) {
      console.error('Erro ao salvar meta:', error)
    }
  }

  // Deletar meta
  const handleDeleteGoal = async (id: string) => {
    try {
      await goalService.delete(id)
      await loadData()
    } catch (error) {
      console.error('Erro ao deletar meta:', error)
    }
  }

  // Editar transação
  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      description: transaction.description || '',
      category: transaction.category,
      date: transaction.date,
      paymentMethod: transaction.paymentMethod || ''
    })
    setShowModal(true)
  }

  // Editar categoria
  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setCategoryFormData({
      name: category.name,
      limit: category.limit?.toString() || '',
      color: category.color,
      icon: category.icon
    })
    setShowCategoryModal(true)
  }

  // Editar meta
  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal)
    setGoalFormData({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      deadline: goal.deadline
    })
    setShowGoalModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-xl">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">FinSync</h1>
                <p className="text-sm text-gray-600">Controle Inteligente de Finanças</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Saldo Atual</p>
                <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: PieChart },
              { id: 'transactions', label: 'Transações', icon: TrendingUp },
              { id: 'categories', label: 'Categorias', icon: Settings },
              { id: 'goals', label: 'Metas', icon: Target }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Receitas</p>
                    <p className="text-3xl font-bold text-green-600">
                      R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Despesas</p>
                    <p className="text-3xl font-bold text-red-600">
                      R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="bg-red-100 p-3 rounded-full">
                    <TrendingDown className="h-8 w-8 text-red-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Economia</p>
                    <p className={`text-3xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${balance >= 0 ? 'bg-blue-100' : 'bg-red-100'}`}>
                    <DollarSign className={`h-8 w-8 ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
                  </div>
                </div>
              </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filtros
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value as any)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos os períodos</option>
                  <option value="week">Última semana</option>
                  <option value="month">Último mês</option>
                  <option value="year">Último ano</option>
                </select>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos os tipos</option>
                  <option value="income">Receitas</option>
                  <option value="expense">Despesas</option>
                </select>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todas as categorias</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.name}>{category.name}</option>
                  ))}
                </select>

                <select
                  value={filterPayment}
                  onChange={(e) => setFilterPayment(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos os métodos</option>
                  {paymentMethods.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Gastos por Categoria */}
            {expensesByCategory.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Gastos por Categoria
                </h3>
                <div className="space-y-4">
                  {expensesByCategory.map(category => (
                    <div key={category.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: category.color }}
                          ></div>
                          <span className="font-medium text-gray-900">{category.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-gray-900">
                            R$ {category.spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          {category.limit && (
                            <span className="text-sm text-gray-500 ml-2">
                              / R$ {category.limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          )}
                        </div>
                      </div>
                      {category.limit && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              category.percentage > 80 ? 'bg-red-500' : 
                              category.percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(category.percentage, 100)}%` }}
                          ></div>
                        </div>
                      )}
                      {category.percentage > 80 && (
                        <div className="flex items-center text-red-600 text-sm">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Atenção: {category.percentage.toFixed(0)}% do limite usado
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metas */}
            {goals.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Progresso das Metas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {goals.map(goal => {
                    const progress = (goal.currentAmount / goal.targetAmount) * 100
                    const isCompleted = progress >= 100
                    
                    return (
                      <div key={goal.id} className="border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900">{goal.name}</h4>
                          {isCompleted && <CheckCircle className="h-5 w-5 text-green-500" />}
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              R$ {goal.currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-gray-600">
                              R$ {goal.targetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className={`h-3 rounded-full transition-all duration-300 ${
                                isCompleted ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className={`font-medium ${isCompleted ? 'text-green-600' : 'text-blue-600'}`}>
                              {progress.toFixed(1)}% concluído
                            </span>
                            <span className="text-gray-500">
                              Prazo: {new Date(goal.deadline + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Transações</h2>
              <button
                onClick={() => setShowModal(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2 shadow-lg"
              >
                <Plus className="h-5 w-5" />
                <span>Nova Transação</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="lasy-highlight">{new Date(transaction.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`p-2 rounded-full mr-3 ${
                              transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              {transaction.type === 'income' ? 
                                <TrendingUp className="h-4 w-4 text-green-600" /> : 
                                <TrendingDown className="h-4 w-4 text-red-600" />
                              }
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.paymentMethod}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                            {transaction.type === 'income' ? '+' : '-'} R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditTransaction(transaction)}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTransaction(transaction.id!)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Categorias</h2>
              <button
                onClick={() => setShowCategoryModal(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2 shadow-lg"
              >
                <Plus className="h-5 w-5" />
                <span>Nova Categoria</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map(category => {
                const spent = transactions
                  .filter(t => t.type === 'expense' && t.category === category.name)
                  .reduce((sum, t) => sum + t.amount, 0)
                const percentage = category.limit ? (spent / category.limit) * 100 : 0

                return (
                  <div key={category.id} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: category.color + '20' }}
                        >
                          <div 
                            className="w-6 h-6 rounded-full"
                            style={{ backgroundColor: category.color }}
                          ></div>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{category.name}</h3>
                          <p className="text-sm text-gray-500">
                            Gasto: R$ {spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id!)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {category.limit && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Limite</span>
                          <span className="font-medium">
                            R$ {category.limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              percentage > 80 ? 'bg-red-500' : 
                              percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className={`font-medium ${
                            percentage > 80 ? 'text-red-600' : 
                            percentage > 60 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {percentage.toFixed(1)}% usado
                          </span>
                          <span className="text-gray-500">
                            Restante: R$ {Math.max(0, category.limit - spent).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        {percentage > 80 && (
                          <div className="flex items-center text-red-600 text-sm mt-2">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Atenção: Limite quase atingido!
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Metas Financeiras</h2>
              <button
                onClick={() => setShowGoalModal(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2 shadow-lg"
              >
                <Plus className="h-5 w-5" />
                <span>Nova Meta</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {goals.map(goal => {
                const progress = (goal.currentAmount / goal.targetAmount) * 100
                const isCompleted = progress >= 100
                const daysLeft = Math.ceil((new Date(goal.deadline + 'T00:00:00').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                
                return (
                  <div key={goal.id} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-full ${isCompleted ? 'bg-green-100' : 'bg-blue-100'}`}>
                          {isCompleted ? 
                            <CheckCircle className="h-6 w-6 text-green-600" /> :
                            <Target className="h-6 w-6 text-blue-600" />
                          }
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{goal.name}</h3>
                          <p className="text-sm text-gray-500">
                            {isCompleted ? 'Meta concluída!' : `${daysLeft > 0 ? daysLeft : 0} dias restantes`}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditGoal(goal)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(goal.id!)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-gray-900">
                          R$ {goal.currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-lg text-gray-600">
                          / R$ {goal.targetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div 
                          className={`h-4 rounded-full transition-all duration-300 ${
                            isCompleted ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        ></div>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className={`font-medium ${isCompleted ? 'text-green-600' : 'text-blue-600'}`}>
                          {progress.toFixed(1)}% concluído
                        </span>
                        <span className="text-gray-500">
                          Prazo: {new Date(goal.deadline + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </span>
                      </div>

                      {!isCompleted && (
                        <div className="text-sm text-gray-600">
                          Faltam: R$ {(goal.targetAmount - goal.currentAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* Modal de Transação */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
            </h3>
            <form onSubmit={handleSubmitTransaction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as 'income' | 'expense'})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="expense">Despesa</option>
                  <option value="income">Receita</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0,00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Descrição da transação"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.name}>{category.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pagamento</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecione um método</option>
                  {paymentMethods.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
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
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                >
                  {editingTransaction ? 'Atualizar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Categoria */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </h3>
            <form onSubmit={handleSubmitCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({...categoryFormData, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nome da categoria"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Limite Mensal (opcional)</label>
                <input
                  type="number"
                  step="0.01"
                  value={categoryFormData.limit}
                  onChange={(e) => setCategoryFormData({...categoryFormData, limit: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
                <input
                  type="color"
                  value={categoryFormData.color}
                  onChange={(e) => setCategoryFormData({...categoryFormData, color: e.target.value})}
                  className="w-full h-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false)
                    setEditingCategory(null)
                    setCategoryFormData({
                      name: '',
                      limit: '',
                      color: '#EF4444',
                      icon: 'MoreHorizontal'
                    })
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                >
                  {editingCategory ? 'Atualizar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Meta */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingGoal ? 'Editar Meta' : 'Nova Meta'}
            </h3>
            <form onSubmit={handleSubmitGoal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Meta</label>
                <input
                  type="text"
                  value={goalFormData.name}
                  onChange={(e) => setGoalFormData({...goalFormData, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Reserva de emergência"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor Objetivo</label>
                <input
                  type="number"
                  step="0.01"
                  value={goalFormData.targetAmount}
                  onChange={(e) => setGoalFormData({...goalFormData, targetAmount: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0,00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor Atual</label>
                <input
                  type="number"
                  step="0.01"
                  value={goalFormData.currentAmount}
                  onChange={(e) => setGoalFormData({...goalFormData, currentAmount: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prazo</label>
                <input
                  type="date"
                  value={goalFormData.deadline}
                  onChange={(e) => setGoalFormData({...goalFormData, deadline: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowGoalModal(false)
                    setEditingGoal(null)
                    setGoalFormData({
                      name: '',
                      targetAmount: '',
                      currentAmount: '',
                      deadline: ''
                    })
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                >
                  {editingGoal ? 'Atualizar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}