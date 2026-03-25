'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateUserRole(userId: string, newRole: string) {
  const supabase = await createClient()
  
  // RLS (Superadmins update policy) will automatically block this if not superadmin.
  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)
    
  if (error) {
    return { error: 'Nepodarilo sa zmeniť rolu: ' + error.message }
  }
  
  revalidatePath('/portal/admin')
  return { success: true }
}

export async function updateUserPlan(userId: string, newPlan: string) {
  const supabase = await createClient()
  
  let tokensLimit = 0
  if (newPlan === 'pro') tokensLimit = 300
  if (newPlan === 'enterprise') tokensLimit = 2000

  const { error } = await supabase
    .from('profiles')
    .update({ plan: newPlan, tokens_limit: tokensLimit })
    .eq('id', userId)
    
  if (error) {
    return { error: 'Nepodarilo sa zmeniť plán: ' + error.message }
  }
  
  revalidatePath('/portal/admin')
  return { success: true }
}
