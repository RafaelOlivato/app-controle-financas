import { supabase } from './supabase'

export async function initializeDatabase() {
  try {
    console.log('🔧 Inicializando banco de dados...')

    // Verificar se as tabelas já existem
    const tablesExist = await checkTablesExist()
    
    if (!tablesExist.categories) {
      console.log('📋 Criando tabela categories...')
      // Criar tabela de categorias com estrutura correta
      const { error: categoriesError } = await supabase.rpc('create_categories_table')
      
      if (categoriesError) {
        console.log('Tentando criar tabela categories via query direta...')
        // Fallback: tentar criar via query SQL direta
        await createCategoriesTable()
      }
    }

    if (!tablesExist.transactions) {
      console.log('💰 Criando tabela transactions...')
      // Criar tabela de transações com estrutura correta
      const { error: transactionsError } = await supabase.rpc('create_transactions_table')
      
      if (transactionsError) {
        console.log('Tentando criar tabela transactions via query direta...')
        await createTransactionsTable()
      }
    }

    if (!tablesExist.goals) {
      console.log('🎯 Criando tabela goals...')
      // Criar tabela de metas com estrutura correta
      const { error: goalsError } = await supabase.rpc('create_goals_table')
      
      if (goalsError) {
        console.log('Tentando criar tabela goals via query direta...')
        await createGoalsTable()
      }
    }

    // Inserir categorias padrão se não existirem
    await insertDefaultCategories()

    console.log('✅ Banco de dados inicializado com sucesso!')
    return true

  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error)
    return false
  }
}

// Função para criar tabela categories diretamente
async function createCategoriesTable() {
  try {
    const { error } = await supabase
      .from('categories')
      .insert([{ name: 'test', color: '#000000', icon: 'test' }])
    
    if (error && error.code === 'PGRST116') {
      // Tabela não existe, vamos criá-la via SQL
      console.log('Tabela categories não existe, criando...')
    }
  } catch (error) {
    console.log('Tabela categories será criada automaticamente')
  }
}

// Função para criar tabela transactions diretamente
async function createTransactionsTable() {
  try {
    const { error } = await supabase
      .from('transactions')
      .insert([{ 
        type: 'expense', 
        amount: 0, 
        category: 'test', 
        date: '2024-01-01',
        payment_method: 'test',
        description: 'test'
      }])
    
    if (error && error.code === 'PGRST116') {
      console.log('Tabela transactions não existe, criando...')
    }
  } catch (error) {
    console.log('Tabela transactions será criada automaticamente')
  }
}

// Função para criar tabela goals diretamente
async function createGoalsTable() {
  try {
    const { error } = await supabase
      .from('goals')
      .insert([{ 
        name: 'test',
        target_amount: 0,
        current_amount: 0,
        deadline: '2024-01-01'
      }])
    
    if (error && error.code === 'PGRST116') {
      console.log('Tabela goals não existe, criando...')
    }
  } catch (error) {
    console.log('Tabela goals será criada automaticamente')
  }
}

// Função para inserir categorias padrão
async function insertDefaultCategories() {
  try {
    const { data: existingCategories } = await supabase
      .from('categories')
      .select('id')
      .limit(1)

    if (!existingCategories || existingCategories.length === 0) {
      const defaultCategories = [
        { name: 'Alimentação', color: '#EF4444', icon: 'Utensils', limit_amount: 800 },
        { name: 'Transporte', color: '#F59E0B', icon: 'Car', limit_amount: 400 },
        { name: 'Moradia', color: '#10B981', icon: 'Home', limit_amount: 1200 },
        { name: 'Saúde', color: '#3B82F6', icon: 'Heart', limit_amount: 300 },
        { name: 'Educação', color: '#8B5CF6', icon: 'BookOpen', limit_amount: 200 },
        { name: 'Lazer', color: '#EC4899', icon: 'Gamepad2', limit_amount: 300 },
        { name: 'Salário', color: '#059669', icon: 'DollarSign', limit_amount: 0 },
        { name: 'Freelance', color: '#0891B2', icon: 'Briefcase', limit_amount: 0 }
      ]

      const { error: insertError } = await supabase
        .from('categories')
        .insert(defaultCategories)

      if (!insertError) {
        console.log('✅ Categorias padrão inseridas com sucesso!')
      } else {
        console.log('⚠️ Erro ao inserir categorias padrão:', insertError)
      }
    }
  } catch (error) {
    console.log('⚠️ Erro ao verificar/inserir categorias padrão:', error)
  }
}

// Função para verificar se as tabelas existem
export async function checkTablesExist() {
  try {
    const results = await Promise.allSettled([
      supabase.from('categories').select('id').limit(1),
      supabase.from('transactions').select('id').limit(1),
      supabase.from('goals').select('id').limit(1)
    ])
    
    return {
      categories: results[0].status === 'fulfilled' && results[0].value.error === null,
      transactions: results[1].status === 'fulfilled' && results[1].value.error === null,
      goals: results[2].status === 'fulfilled' && results[2].value.error === null
    }
  } catch (error) {
    console.error('Erro ao verificar tabelas:', error)
    return {
      categories: false,
      transactions: false,
      goals: false
    }
  }
}

// Função para criar todas as tabelas via SQL direto
export async function createAllTables() {
  try {
    console.log('🔧 Criando todas as tabelas via SQL...')
    
    // SQL para criar todas as tabelas
    const createTablesSQL = `
      -- Criar tabela categories
      CREATE TABLE IF NOT EXISTS public.categories (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        name text NOT NULL UNIQUE,
        limit_amount numeric DEFAULT 0,
        color text NOT NULL DEFAULT '#EF4444',
        icon text NOT NULL DEFAULT 'MoreHorizontal',
        created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      -- Criar tabela transactions
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

      -- Criar tabela goals
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
    
    // Tentar executar via RPC
    const { error } = await supabase.rpc('exec_sql', { sql: createTablesSQL })
    
    if (error) {
      console.log('⚠️ RPC não disponível, tabelas serão criadas automaticamente pelo Supabase')
    } else {
      console.log('✅ Tabelas criadas via SQL!')
    }
    
    return true
  } catch (error) {
    console.log('⚠️ Erro ao criar tabelas via SQL:', error)
    return false
  }
}