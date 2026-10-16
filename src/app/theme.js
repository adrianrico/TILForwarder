/**
 * Tema de Ant Design (modo oscuro + paleta corporativa TIL).
 * Centralizado aquí para que ningún componente defina colores base por su cuenta.
 */
import { theme } from 'antd'

export const antdTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary:         '#0695E4',
    colorBgBase:          '#010d1a',
    colorBgLayout:        'transparent',
    colorBgContainer:     'rgba(0, 18, 48, 0.35)',
    colorBgElevated:      'rgba(0, 15, 40, 0.88)',
    colorBgSpotlight:     'rgba(0, 15, 40, 0.92)',
    colorBorder:          'rgba(6, 149, 228, 0.25)',
    colorBorderSecondary: 'rgba(6, 149, 228, 0.14)',
    colorText:            '#c9d8e8',
    colorTextHeading:     '#e8f4ff',
    colorTextSecondary:   '#7aafc8',
    borderRadius:         8,
  },
}
