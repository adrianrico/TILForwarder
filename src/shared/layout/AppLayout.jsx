import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Drawer, Button, Menu } from 'antd'
import { MenuOutlined, LogoutOutlined } from '@ant-design/icons'
import { menuItems } from '@/app/navigation'
import TILLogo from '@/shared/components/TILLogo'
import { useAuth } from '@/features/auth/AuthContext'
import ServerStatus from '@/shared/components/ServerStatus'

/**
 * Estructura visual común: barra superior (menú horizontal en escritorio,
 * cajón lateral en móvil) y área de contenido donde se renderiza la página activa.
 */
const { Header, Content } = Layout

const GLASS = {
  nav:           'rgba(0, 10, 28, 0.72)',
  navBorder:     '1px solid rgba(6, 149, 228, 0.2)',
  navShadow:     '0 4px 24px rgba(0, 0, 0, 0.3)',
  content:       'rgba(0, 14, 38, 0.45)',
  contentBorder: '1px solid rgba(6, 149, 228, 0.18)',
  contentShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
  blur:          'blur(8px)',
}

// CSS targets wrapper divs, never AntD internals — avoids display conflicts
const NAV_STYLES = `
  .maylob-nav-menu      { display: block; }
  .maylob-nav-hamburger { display: none;  }

  @media (max-width: 1099px) {
    .maylob-nav-menu      { display: none;  }
    .maylob-nav-hamburger { display: flex; align-items: center; }
  }

  /* Desktop header: borderless glass — mobile/tablet keep the separator line */
  .maylob-header { border-bottom: ${GLASS.navBorder}; }

  @media (min-width: 1100px) {
    .maylob-header { border-bottom: none; }
  }

  /* Desktop: tighter main padding so full-height pages (e.g. Dashboard) fit without vertical scroll */
  .maylob-content { padding: 24px; }

  @media (min-width: 1100px) {
    .maylob-content { padding: 12px 20px; }
  }

  /* Mobile: minimal padding/margin so pages use the full available width/height */
  @media (max-width: 575px) {
    .maylob-content {
      padding:    10px;
      margin:     8px !important;
      min-height: calc(100vh - 80px) !important;
    }
  }
`

export default function AppLayout() {
  const navigate              = useNavigate()
  const { logout }            = useAuth()
  const location              = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Close drawer when viewport grows past the desktop breakpoint
  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 1100) setDrawerOpen(false) }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return (
    <>
      <style>{NAV_STYLES}</style>

      <Layout style={{ minHeight: '100vh', background: 'transparent', position: 'relative', zIndex: 1 }}>

        {/* ── Top navbar ── */}
        <Header
          className="maylob-header"
          style={{
            position:             'sticky',
            top:                  0,
            zIndex:               100,
            display:              'flex',
            alignItems:           'center',
            gap:                  16,
            height:               64,
            padding:              '0 24px',
            background:           GLASS.nav,
            backdropFilter:       GLASS.blur,
            WebkitBackdropFilter: GLASS.blur,
            boxShadow:            GLASS.navShadow,
          }}
        >
          {/* Logo — always left */}
          <TILLogo height={34} style={{ flexShrink: 0 }} />

          {/* Spacer pushes everything else to the right */}
          <div style={{ flex: 1 }} />

          {/* Desktop ≥ 1100px: horizontal menu */}
          <div className="maylob-nav-menu">
            <Menu
              mode="horizontal"
              selectedKeys={[location.pathname]}
              items={menuItems}
              onClick={({ key }) => navigate(key)}
              style={{
                background: 'transparent',
                border:     'none',
                lineHeight: '63px',
              }}
            />
          </div>

          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={() => { logout(); navigate('/login', { replace: true }) }}
            title="Cerrar sesión"
            style={{ color: '#7aafc8' }}
          />

          {/* Mobile / tablet < 1100px: hamburger */}
          <div className="maylob-nav-hamburger">
            <Button
              type="text"
              icon={<MenuOutlined style={{ fontSize: 20 }} />}
              onClick={() => setDrawerOpen(true)}
              style={{ color: '#7aafc8' }}
            />
          </div>
        </Header>

        {/* ── Drawer (mobile / tablet) ── */}
        <Drawer
          placement="right"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          styles={{
            wrapper: { width: 240 },
            body:    { padding: 0, background: 'rgba(3, 51, 112, 0.82)', backdropFilter: GLASS.blur, WebkitBackdropFilter: GLASS.blur },
            header:  { background: 'rgba(3, 51, 112, 0.82)', backdropFilter: GLASS.blur, WebkitBackdropFilter: GLASS.blur, borderBottom: GLASS.navBorder },
          }}
          title={<TILLogo height={28} />}
        >
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => { navigate(key); setDrawerOpen(false) }}
            style={{ height: '100%', borderRight: 0, background: 'transparent' }}
          />
        </Drawer>

        {/* ── Page content ── */}
        <Content
          className="maylob-content"
          style={{
            margin:               '24px',
            display:              'flex',
            flexDirection:        'column',
            background:           GLASS.content,
            backdropFilter:       GLASS.blur,
            WebkitBackdropFilter: GLASS.blur,
            borderRadius:         12,
            border:               GLASS.contentBorder,
            boxShadow:            GLASS.contentShadow,
            minHeight:            'calc(100vh - 112px)',
          }}
        >
          <ServerStatus />
          <Outlet />
        </Content>

      </Layout>
    </>
  )
}
