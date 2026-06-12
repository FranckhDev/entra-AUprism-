'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button, Text, Divider } from '@fluentui/react-components'
import {
  Home20Regular, Home20Filled,
  People20Regular, People20Filled,
  PeopleTeam20Regular, PeopleTeam20Filled,
  Desktop20Regular, Desktop20Filled,
  WeatherSunny20Regular, WeatherMoon20Regular, CircleHalfFill20Regular,
} from '@fluentui/react-icons'
import { AUSwitcher } from './AUSwitcher'
import { useTheme, ThemeMode } from '@/context/ThemeContext'
import { useAuth } from '@/mocks/MockAuthProvider'

const NAV_ITEMS = [
  { href: '/dashboard', labelKey: 'home', Icon: Home20Regular, IconActive: Home20Filled },
  { href: '/members', labelKey: 'myTeam', Icon: People20Regular, IconActive: People20Filled },
  { href: '/teams', labelKey: 'groups', Icon: PeopleTeam20Regular, IconActive: PeopleTeam20Filled },
  { href: '/devices', labelKey: 'computers', Icon: Desktop20Regular, IconActive: Desktop20Filled },
]

const THEME_OPTIONS: { mode: ThemeMode; icon: React.ReactNode; key: string }[] = [
  { mode: 'light', icon: <WeatherSunny20Regular />, key: 'light' },
  { mode: 'system', icon: <CircleHalfFill20Regular />, key: 'system' },
  { mode: 'dark', icon: <WeatherMoon20Regular />, key: 'dark' },
]

export function Sidebar() {
  const t = useTranslations('nav')
  const tTheme = useTranslations('theme')
  const pathname = usePathname()
  const { mode, setMode } = useTheme()
  const { signOut } = useAuth()

  return (
    <nav style={{
      width: '240px', flexShrink: 0, height: '100vh', display: 'flex', flexDirection: 'column',
      borderRight: '1px solid var(--colorNeutralStroke2)', backgroundColor: 'var(--colorNeutralBackground2)',
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 8px' }}>
        <Text size={500} weight="bold" style={{ color: 'var(--colorBrandForeground1)' }}>
          AUPrism
        </Text>
      </div>

      <Divider style={{ margin: '4px 0' }} />

      {/* AU Switcher */}
      <AUSwitcher />

      <Divider style={{ margin: '4px 0' }} />

      {/* Nav items */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', padding: '8px' }}>
        {NAV_ITEMS.map(({ href, labelKey, Icon, IconActive }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href} style={{ textDecoration: 'none' }}>
              <Button
                appearance={isActive ? 'subtle' : 'transparent'}
                icon={isActive ? <IconActive /> : <Icon />}
                style={{
                  width: '100%', justifyContent: 'flex-start',
                  backgroundColor: isActive ? 'var(--colorNeutralBackground1Selected)' : undefined,
                  fontWeight: isActive ? '600' : undefined,
                }}
              >
                {t(labelKey as 'home' | 'myTeam' | 'groups' | 'computers')}
              </Button>
            </Link>
          )
        })}
      </div>

      {/* Theme switcher */}
      <div style={{ padding: '8px 12px' }}>
        <Text size={200} style={{ color: 'var(--colorNeutralForeground3)', display: 'block', marginBottom: '6px' }}>
          Theme
        </Text>
        <div style={{ display: 'flex', gap: '4px' }}>
          {THEME_OPTIONS.map(({ mode: m, icon, key }) => (
            <Button
              key={key}
              appearance={mode === m ? 'primary' : 'subtle'}
              icon={icon}
              size="small"
              title={tTheme(key as 'light' | 'dark' | 'system')}
              onClick={() => setMode(m)}
            />
          ))}
        </div>
      </div>

      <Divider style={{ margin: '4px 0' }} />

      {/* Sign out */}
      <div style={{ padding: '8px' }}>
        <Button appearance="transparent" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={signOut}>
          {t('signOut')}
        </Button>
      </div>
    </nav>
  )
}
