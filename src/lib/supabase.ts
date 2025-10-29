import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para o banco de dados
export interface Transaction {
  id?: string
  type: 'income' | 'expense'
  amount: number
  category: string
  date: string
  paymentMethod: string
  description?: string
  created_at?: string
  updated_at?: string
}

export interface Category {
  id?: string
  name: string
  limit: number
  color: string
  icon: string
  created_at?: string
  updated_at?: string
}

export interface Goal {
  id?: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline: string
  created_at?: string
  updated_at?: string
}

// Funções para transações
export const transactionService = {
  async getAll(): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
      
      if (error) {
        console.error('Erro ao carregar transações:', error)
        return []
      }
      
      return (data || []).map(item => ({
        ...item,
        paymentMethod: item.payment_method || ''
      }))
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      return []
    }
  },

  async create(transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        ...transaction,
        payment_method: transaction.paymentMethod
      }])
      .select()
      .single()
    
    if (error) throw error
    return {
      ...data,
      paymentMethod: data.payment_method
    }
  },

  async update(id: string, transaction: Partial<Transaction>): Promise<Transaction> {
    const updateData: any = { ...transaction }
    if (transaction.paymentMethod) {
      updateData.payment_method = transaction.paymentMethod
      delete updateData.paymentMethod
    }

    const { data, error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return {
      ...data,
      paymentMethod: data.payment_method
    }
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Funções para categorias
export const categoryService = {
  async getAll(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')
      
      if (error) {
        console.error('Erro ao carregar categorias:', error)
        return []
      }
      
      return (data || []).map(item => ({
        ...item,
        limit: item.limit_amount || 0
      }))
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      return []
    }
  },

  async create(category: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert([{
        ...category,
        limit_amount: category.limit
      }])
      .select()
      .single()
    
    if (error) throw error
    return {
      ...data,
      limit: data.limit_amount || 0
    }
  },

  async update(id: string, category: Partial<Category>): Promise<Category> {
    const updateData: any = { ...category }
    if (category.limit !== undefined) {
      updateData.limit_amount = category.limit
      delete updateData.limit
    }

    const { data, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return {
      ...data,
      limit: data.limit_amount || 0
    }
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Funções para metas
export const goalService = {
  async getAll(): Promise<Goal[]> {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .order('deadline')
      
      if (error) {
        console.error('Erro ao carregar metas:', error)
        return []
      }
      
      return (data || []).map(item => ({
        ...item,
        targetAmount: item.target_amount,
        currentAmount: item.current_amount
      }))
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      return []
    }
  },

  async create(goal: Omit<Goal, 'id' | 'created_at' | 'updated_at'>): Promise<Goal> {
    const { data, error } = await supabase
      .from('goals')
      .insert([{
        name: goal.name,
        target_amount: goal.targetAmount,
        current_amount: goal.currentAmount,
        deadline: goal.deadline
      }])
      .select()
      .single()
    
    if (error) throw error
    return {
      ...data,
      targetAmount: data.target_amount,
      currentAmount: data.current_amount
    }
  },

  async update(id: string, goal: Partial<Goal>): Promise<Goal> {
    const updateData: any = { ...goal }
    if (goal.targetAmount !== undefined) {
      updateData.target_amount = goal.targetAmount
      delete updateData.targetAmount
    }
    if (goal.currentAmount !== undefined) {
      updateData.current_amount = goal.currentAmount
      delete updateData.currentAmount
    }

    const { data, error } = await supabase
      .from('goals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return {
      ...data,
      targetAmount: data.target_amount,
      currentAmount: data.current_amount
    }
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}