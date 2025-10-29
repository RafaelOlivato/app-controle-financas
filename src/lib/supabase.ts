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

// Função para inicializar as tabelas
export const initializeTables = async () => {
  try {
    // Criar tabela de transações
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.transactions (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          type text NOT NULL CHECK (type IN ('income', 'expense')),
          amount numeric NOT NULL,
          category text NOT NULL,
          date date NOT NULL,
          payment_method text,
          description text,
          created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
        );
      `
    })

    // Criar tabela de categorias
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.categories (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          name text NOT NULL UNIQUE,
          limit_amount numeric DEFAULT 0,
          color text NOT NULL DEFAULT '#EF4444',
          icon text NOT NULL DEFAULT 'MoreHorizontal',
          created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
        );
      `
    })

    // Criar tabela de metas
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.goals (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          name text NOT NULL,
          target_amount numeric NOT NULL,
          current_amount numeric DEFAULT 0,
          deadline date NOT NULL,
          created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
        );
      `
    })

    // Inserir categorias padrão se não existirem
    const { data: existingCategories } = await supabase
      .from('categories')
      .select('id')
      .limit(1)

    if (!existingCategories || existingCategories.length === 0) {
      await supabase.from('categories').insert([
        { name: 'Alimentação', color: '#EF4444', icon: 'Utensils', limit_amount: 800 },
        { name: 'Transporte', color: '#F59E0B', icon: 'Car', limit_amount: 400 },
        { name: 'Moradia', color: '#10B981', icon: 'Home', limit_amount: 1200 },
        { name: 'Saúde', color: '#3B82F6', icon: 'Heart', limit_amount: 300 },
        { name: 'Educação', color: '#8B5CF6', icon: 'BookOpen', limit_amount: 200 },
        { name: 'Lazer', color: '#EC4899', icon: 'Gamepad2', limit_amount: 300 },
        { name: 'Salário', color: '#059669', icon: 'DollarSign', limit_amount: 0 },
        { name: 'Freelance', color: '#0891B2', icon: 'Briefcase', limit_amount: 0 }
      ])
    }

    console.log('Tabelas inicializadas com sucesso!')
  } catch (error) {
    console.error('Erro ao inicializar tabelas:', error)
  }
}

// Funções para transações
export const transactionService = {
  async getAll(): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })
    
    if (error) throw error
    return data || []
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
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    
    if (error) throw error
    return (data || []).map(item => ({
      ...item,
      limit: item.limit_amount || 0
    }))
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
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .order('deadline')
    
    if (error) throw error
    return (data || []).map(item => ({
      ...item,
      targetAmount: item.target_amount,
      currentAmount: item.current_amount
    }))
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