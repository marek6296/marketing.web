'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createProject(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = formData.get('name') as string
  if (!name?.trim()) return { error: 'Názov projektu je povinný' }

  const { data, error } = await supabase.from('projects').insert({
    client_id: user.id,
    name: name.trim(),
    description: formData.get('description') as string || null,
    brand_style_prompt: `Projekt ${name}. Moderný, profesionálny štýl. Slovenský jazyk.`,
  }).select().single()

  if (error) return { error: error.message }

  revalidatePath('/portal')
  return { project: data }
}

export async function updateProject(projectId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase.from('projects').update({
    name: formData.get('name') as string,
    description: formData.get('description') as string || null,
    brand_style_prompt: formData.get('brand_style_prompt') as string || null,
    project_type: formData.get('project_type') as string || 'restaurant',
    brand_colors: {
      primary: formData.get('primary_color') as string || '#F59E0B',
      secondary: formData.get('secondary_color') as string || '#FFFFFF',
    },
    image_style: {
      template: formData.get('image_template') as string || 'modern-minimal',
      mood: formData.get('image_mood') as string || 'warm',
      background: formData.get('image_background') as string || 'gradient',
      photoStyle: formData.get('image_photo_style') as string || 'studio-lighting',
    },
    facebook_page_id: formData.get('facebook_page_id') as string || null,
    instagram_account_id: formData.get('instagram_account_id') as string || null,
    meta_access_token: formData.get('meta_access_token') as string || null,
  }).eq('id', projectId).eq('client_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/portal')
  return { success: true }
}

export async function deleteProject(projectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase.from('projects')
    .delete()
    .eq('id', projectId)
    .eq('client_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/portal')
  return { success: true }
}
