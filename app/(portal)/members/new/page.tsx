'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Title1, Text, Button, Input, Field, Select } from '@fluentui/react-components'
import { useRouter } from 'next/navigation'
import { useAUContext } from '@/context/AUContext'
import { useMembers } from '@/hooks/useMembers'
import { useToast } from '@/hooks/useToast'
import { CreateMemberInput } from '@/types/member'

const MOCK_DOMAIN = 'contoso.com'

type Step = 1 | 2 | 'summary' | 'success'

export default function NewMemberPage() {
  const t = useTranslations('newMember')
  const tc = useTranslations('common')
  const router = useRouter()
  const { activeAU } = useAUContext()
  const { createMember } = useMembers(activeAU?.id ?? '')
  const { showError } = useToast()

  const [step, setStep] = useState<Step>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [tempPassword, setTempPassword] = useState('')

  const [form, setForm] = useState<CreateMemberInput>({
    firstName: '', lastName: '', jobTitle: '', emailPrefix: '',
    domain: MOCK_DOMAIN, department: activeAU?.displayName ?? '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof CreateMemberInput, string>>>({})

  const update = (key: keyof CreateMemberInput, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const validateStep1 = () => {
    const e: typeof errors = {}
    if (!form.firstName.trim()) e.firstName = t('requiredField')
    if (!form.lastName.trim()) e.lastName = t('requiredField')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStep2 = () => {
    const e: typeof errors = {}
    if (!form.emailPrefix.trim()) e.emailPrefix = t('requiredField')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const { tempPassword: pw } = await createMember(form)
      setTempPassword(pw)
      setStep('success')
    } catch {
      showError(tc('errorGeneric'))
    } finally {
      setIsLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <div style={{ maxWidth: '520px' }}>
        <Title1 style={{ marginBottom: '8px', color: 'var(--colorStatusSuccessForeground1)' }}>
          {t('successTitle')}
        </Title1>
        <Text size={400} style={{ display: 'block', marginBottom: '24px' }}>
          {t('successBody', { name: `${form.firstName} ${form.lastName}` })}
        </Text>
        <div style={{ background: 'var(--colorNeutralBackground3)', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
          <Text size={200} style={{ color: 'var(--colorNeutralForeground3)', display: 'block', marginBottom: '4px' }}>
            {t('tempPasswordLabel')}
          </Text>
          <Text size={500} weight="bold" style={{ fontFamily: 'monospace', display: 'block', marginBottom: '8px' }}>
            {tempPassword}
          </Text>
          <Text size={200} style={{ color: 'var(--colorStatusWarningForeground1)' }}>
            ⚠ {t('tempPasswordWarning')}
          </Text>
        </div>
        <Button appearance="primary" onClick={() => router.push('/members')}>{tc('done')}</Button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '520px' }}>
      <Title1 style={{ marginBottom: '4px' }}>{t('pageTitle')}</Title1>
      <Text size={300} style={{ color: 'var(--colorNeutralForeground3)', display: 'block', marginBottom: '32px' }}>
        {step === 1 ? t('step1Title') : step === 2 ? t('step2Title') : t('summaryTitle')} — Step {step === 'summary' ? '3' : step} of 3
      </Text>

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Field label={t('fieldFirstName')} validationMessage={errors.firstName} required>
            <Input value={form.firstName} onChange={(_, d) => update('firstName', d.value)} />
          </Field>
          <Field label={t('fieldLastName')} validationMessage={errors.lastName} required>
            <Input value={form.lastName} onChange={(_, d) => update('lastName', d.value)} />
          </Field>
          <Field label={t('fieldJobTitle')}>
            <Input value={form.jobTitle} onChange={(_, d) => update('jobTitle', d.value)} />
          </Field>
          <Field label={t('fieldDepartment')}>
            <Input value={form.department} onChange={(_, d) => update('department', d.value)} />
          </Field>
          <Field label={t('fieldOfficeLocation')}>
            <Input value={form.officeLocation ?? ''} onChange={(_, d) => update('officeLocation', d.value)} />
          </Field>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <Button appearance="secondary" onClick={() => router.push('/members')}>{tc('cancel')}</Button>
            <Button appearance="primary" onClick={() => { if (validateStep1()) setStep(2) }}>{tc('next')}</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <Field label={t('fieldEmailPrefix')} validationMessage={errors.emailPrefix} required style={{ flex: 1 }}>
              <Input value={form.emailPrefix} onChange={(_, d) => update('emailPrefix', d.value)} />
            </Field>
            <Text size={400} style={{ paddingBottom: '6px' }}>@</Text>
            <Field label={t('fieldDomain')} style={{ flex: 1 }}>
              <Select value={form.domain} onChange={(_, d) => update('domain', d.value)}>
                <option value="contoso.com">contoso.com</option>
              </Select>
            </Field>
          </div>
          {form.emailPrefix && (
            <Text size={300} style={{ color: 'var(--colorNeutralForeground3)' }}>
              {t('emailPreview', { email: `${form.emailPrefix}@${form.domain}` })}
            </Text>
          )}
          <Text size={300} style={{ color: 'var(--colorNeutralForeground3)', padding: '8px', background: 'var(--colorNeutralBackground3)', borderRadius: '4px' }}>
            🔒 {t('passwordNote')}
          </Text>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <Button appearance="secondary" onClick={() => setStep(1)}>{tc('back')}</Button>
            <Button appearance="primary" onClick={() => { if (validateStep2()) setStep('summary') }}>{tc('next')}</Button>
          </div>
        </div>
      )}

      {step === 'summary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'var(--colorNeutralBackground3)', borderRadius: '8px', padding: '20px' }}>
            <Text size={400} style={{ display: 'block', marginBottom: '8px' }}>
              {t('summaryBody', { name: `${form.firstName} ${form.lastName}`, jobTitle: form.jobTitle || 'Team member' })}
            </Text>
            <Text size={300} style={{ color: 'var(--colorNeutralForeground3)' }}>
              Email: {form.emailPrefix}@{form.domain}
            </Text>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button appearance="secondary" onClick={() => setStep(2)}>{tc('back')}</Button>
            <Button appearance="primary" onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Creating...' : t('createButton')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
