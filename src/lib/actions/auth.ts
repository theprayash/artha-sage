'use server'

import { db } from '@/lib/db'
import { adminUsers } from '@/lib/db/schema'
import { signOut } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export async function createFirstAdmin(formData: FormData): Promise<{ error?: string }> {
  const existing = await db.select({ id: adminUsers.id }).from(adminUsers).limit(1)
  if (existing.length > 0) {
    return { error: 'An admin account already exists. Please log in.' }
  }

  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').toLowerCase().trim()
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm') ?? '')

  if (!name || !email || !password) return { error: 'All fields are required.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Invalid email address.' }
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' }
  if (password !== confirm) return { error: 'Passwords do not match.' }

  const passwordHash = await bcrypt.hash(password, 12)
  await db.insert(adminUsers).values({ name, email, passwordHash })

  redirect('/login?setup=done')
}

export async function addAuthor(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').toLowerCase().trim()
  const password = String(formData.get('password') ?? '')

  if (!name || !email || !password) return { error: 'All fields are required.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Invalid email address.' }
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' }

  const existing = await db.select({ id: adminUsers.id }).from(adminUsers).where(eq(adminUsers.email, email))
  if (existing.length > 0) return { error: 'An account with that email already exists.' }

  const passwordHash = await bcrypt.hash(password, 12)
  await db.insert(adminUsers).values({ name, email, passwordHash })
  revalidatePath('/admin/settings')
  return { success: true }
}

export async function removeAuthor(id: string): Promise<{ error?: string }> {
  const all = await db.select({ id: adminUsers.id }).from(adminUsers)
  if (all.length <= 1) return { error: 'Cannot remove the only admin account.' }
  await db.delete(adminUsers).where(eq(adminUsers.id, id))
  revalidatePath('/admin/settings')
  return {}
}

export async function logOut() {
  await signOut({ redirectTo: '/login' })
}
