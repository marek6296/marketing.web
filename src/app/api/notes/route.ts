import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { project_id, date, content, color, importance } = await req.json()
    
    if (!project_id || !date || !content) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('calendar_notes')
      .insert({
        project_id,
        client_id: user.id,
        date,
        content,
        color: color || 'gray',
        importance: importance || 'normal'
      })
      .select('*')
      .single()

    if (error) {
      console.error('Note insertion err:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

    const { error } = await supabase
      .from('calendar_notes')
      .delete()
      .eq('id', id)
      .eq('client_id', user.id)

    if (error) {
      console.error('Note delete err:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
