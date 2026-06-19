'use client'

import { useState, useTransition } from 'react'
import { saveSettings } from '@/lib/actions/settings'
import { addAuthor, removeAuthor } from '@/lib/actions/auth'
import type { SettingKey } from '@/lib/settings-keys'
import { Globe, User, Mail, Shield, Check, ChevronDown, ChevronUp, UserPlus, Trash2 } from 'lucide-react'

interface Author { id: string; name: string; email: string }

interface Props {
  initial: Record<SettingKey, string>
  gmailConfigured: boolean
  nextauthConfigured: boolean
  adminEmail: string
  adminName: string
  authors: Author[]
}

function Section({ title, icon: Icon, children, defaultOpen = true }: {
  title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 transition-colors hover:opacity-80"
        style={{ borderBottom: open ? '1px solid var(--border)' : 'none', background: 'var(--surface2)' }}
      >
        <div className="flex items-center gap-2">
          <Icon size={15} className="text-accent" />
          <span className="font-display font-bold text-sm" style={{ color: 'var(--text)' }}>{title}</span>
        </div>
        {open ? <ChevronUp size={14} style={{ color: 'var(--text-faint)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-faint)' }} />}
      </button>
      {open && (
        <div className="p-5 space-y-5" style={{ background: 'var(--surface)' }}>
          {children}
        </div>
      )}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[200px_1fr] items-start gap-6">
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{label}</p>
        {hint && <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-faint)' }}>{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-accent/40 transition-all"
      style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
    />
  )
}

function Textarea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-accent/40 transition-all resize-none"
      style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
    />
  )
}

export default function SettingsClient({ initial, gmailConfigured, nextauthConfigured, adminEmail, adminName, authors: initialAuthors }: Props) {
  const [values, setValues] = useState(initial)
  const [saved, setSaved] = useState(false)
  const [, startTransition] = useTransition()

  // Authors state
  const [authors, setAuthors] = useState<Author[]>(initialAuthors)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [authorError, setAuthorError] = useState('')
  const [authorSuccess, setAuthorSuccess] = useState('')
  const [authorLoading, setAuthorLoading] = useState(false)

  const set = (key: SettingKey) => (v: string) => setValues(prev => ({ ...prev, [key]: v }))

  const handleAddAuthor = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthorError(''); setAuthorSuccess(''); setAuthorLoading(true)
    const fd = new FormData()
    fd.append('name', newName); fd.append('email', newEmail); fd.append('password', newPassword)
    const res = await addAuthor(fd)
    setAuthorLoading(false)
    if (res.error) { setAuthorError(res.error); return }
    setAuthors(prev => [...prev, { id: Date.now().toString(), name: newName, email: newEmail }])
    setNewName(''); setNewEmail(''); setNewPassword('')
    setAuthorSuccess('Author added successfully.')
    setTimeout(() => setAuthorSuccess(''), 3000)
  }

  const handleRemoveAuthor = (id: string) => {
    if (!confirm('Remove this author?')) return
    startTransition(async () => {
      const res = await removeAuthor(id)
      if (res.error) { setAuthorError(res.error); return }
      setAuthors(prev => prev.filter(a => a.id !== id))
    })
  }

  const handleSave = () => {
    startTransition(async () => {
      await saveSettings(values)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    })
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-3xl" style={{ color: 'var(--text)' }}>Settings</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Configure your blog site.</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2 bg-accent text-black font-semibold text-sm rounded-lg hover:bg-[#b08838] transition-colors"
        >
          {saved ? <><Check size={14} /> Saved</> : 'Save Changes'}
        </button>
      </div>

      {/* General */}
      <Section title="General" icon={Globe}>
        <Field label="Site Name" hint="Displayed in the browser tab and footer.">
          <Input value={values.site_name} onChange={set('site_name')} placeholder="Artha Saya" />
        </Field>
        <Field label="Tagline" hint="Short description shown in hero and meta tags.">
          <Input value={values.site_tagline} onChange={set('site_tagline')} placeholder="Share market insights explained simply." />
        </Field>
        <Field label="Contact Email" hint="Shown on the terms/contact page.">
          <Input value={values.contact_email} onChange={set('contact_email')} type="email" placeholder="hello@example.com" />
        </Field>
      </Section>

      {/* Author */}
      <Section title="Author" icon={User}>
        <Field label="Author Name" hint="Your name — shown on articles and about sections.">
          <Input value={values.author_name} onChange={set('author_name')} placeholder="Your Name" />
        </Field>
        <Field label="Author Bio" hint="A short bio (1–2 sentences).">
          <Textarea value={values.author_bio} onChange={set('author_bio')} placeholder="I write about share markets..." rows={2} />
        </Field>
      </Section>

      {/* Newsletter */}
      <Section title="Newsletter" icon={Mail}>
        <Field label="CTA Headline" hint="Headline shown on the newsletter sign-up section.">
          <Input value={values.newsletter_headline} onChange={set('newsletter_headline')} placeholder="Market insights in your inbox" />
        </Field>
        <Field label="CTA Subtext" hint="Supporting text below the headline.">
          <Textarea value={values.newsletter_subtext} onChange={set('newsletter_subtext')} placeholder="Weekly round-up..." rows={2} />
        </Field>
      </Section>

      {/* Email / OTP */}
      <Section title="Email (OTP Login)" icon={Mail} defaultOpen={!gmailConfigured}>
        <Field
          label="Gmail Status"
          hint="OTP codes are sent via Gmail SMTP."
        >
          <span
            className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg border"
            style={gmailConfigured
              ? { color: '#C8A756', background: 'rgba(200,167,86,0.1)', borderColor: 'rgba(200,167,86,0.3)' }
              : { color: 'var(--text-faint)', borderColor: 'var(--border)' }
            }
          >
            {gmailConfigured ? <><Check size={12} /> Configured</> : '⚠ Not configured'}
          </span>
        </Field>

        {!gmailConfigured && (
          <div className="rounded-lg p-4 space-y-3 text-sm" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
            <p className="font-semibold" style={{ color: 'var(--text)' }}>How to set up Gmail OTP:</p>
            <ol className="space-y-2 list-decimal list-inside" style={{ color: 'var(--text-muted)' }}>
              <li>Enable <strong style={{ color: 'var(--text)' }}>2-Step Verification</strong> on your Google account at <span className="font-mono text-accent">myaccount.google.com/security</span></li>
              <li>Go to <span className="font-mono text-accent">myaccount.google.com/apppasswords</span> and create an App Password for &ldquo;Mail&rdquo;</li>
              <li>Add these to your <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg)' }}>.env</span> file and restart Docker:</li>
            </ol>
            <pre className="text-xs font-mono rounded-lg p-3 mt-2 leading-relaxed" style={{ background: 'var(--bg)', color: '#C8A756' }}>
{`GMAIL_USER=your@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx`}
            </pre>
          </div>
        )}

        <Field label="Admin Account" hint="The email that receives OTP codes.">
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>{adminEmail || '—'}</span>
            {adminName && <span className="text-xs" style={{ color: 'var(--text-faint)' }}>({adminName})</span>}
          </div>
        </Field>
      </Section>

      {/* Authors */}
      <Section title="Authors" icon={UserPlus} defaultOpen={true}>
        {/* Existing authors */}
        <div className="space-y-2">
          {authors.map(a => (
            <div key={a.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{a.name}</p>
                <p className="text-xs font-mono" style={{ color: 'var(--text-faint)' }}>{a.email}</p>
              </div>
              {authors.length > 1 && (
                <button onClick={() => handleRemoveAuthor(a.id)} className="p-1.5 rounded-lg hover:bg-danger/10 text-danger transition-colors">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add new author */}
        <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--text-faint)' }}>Add Author</p>
          <form onSubmit={handleAddAuthor} className="space-y-2">
            <Input value={newName} onChange={setNewName} placeholder="Full name" />
            <Input value={newEmail} onChange={setNewEmail} placeholder="Email address" type="email" />
            <Input value={newPassword} onChange={setNewPassword} placeholder="Password (min 8 chars)" type="password" />
            {authorError && <p className="text-xs text-danger">{authorError}</p>}
            {authorSuccess && <p className="text-xs text-accent">{authorSuccess}</p>}
            <button
              type="submit"
              disabled={authorLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-accent text-black text-sm font-semibold rounded-lg hover:bg-[#b08838] transition-colors disabled:opacity-50"
            >
              <UserPlus size={13} /> {authorLoading ? 'Adding...' : 'Add Author'}
            </button>
          </form>
        </div>
      </Section>

      {/* Security */}
      <Section title="Security" icon={Shield} defaultOpen={false}>
        <Field label="2FA / OTP" hint="A 6-digit code is emailed on every admin login.">
          <span
            className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg border"
            style={gmailConfigured
              ? { color: '#C8A756', background: 'rgba(200,167,86,0.1)', borderColor: 'rgba(200,167,86,0.3)' }
              : { color: 'var(--text-faint)', borderColor: 'var(--border)' }
            }
          >
            {gmailConfigured ? <><Check size={12} /> Active</> : 'Requires Gmail config'}
          </span>
        </Field>
        <Field label="Session" hint="Sessions are managed by NextAuth with a secure secret.">
          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
            {nextauthConfigured ? 'Secret configured ✓' : '⚠ Set NEXTAUTH_SECRET in .env'}
          </span>
        </Field>
      </Section>

      {/* Save (bottom) */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2 bg-accent text-black font-semibold text-sm rounded-lg hover:bg-[#b08838] transition-colors"
        >
          {saved ? <><Check size={14} /> Saved!</> : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
