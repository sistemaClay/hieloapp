export interface DeviceInfo {
  user_agent: string
  platform: string
  screen_resolution: string
  browser: string
  os_name: string
  timestamp: string
  timezone: string
  language: string
}

export function getDeviceInfo(): DeviceInfo {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      user_agent: 'Unknown',
      platform: 'Unknown',
      screen_resolution: 'Unknown',
      browser: 'Unknown',
      os_name: 'Unknown',
      timestamp: new Date().toISOString(),
      timezone: 'Unknown',
      language: 'Unknown'
    }
  }

  const userAgent = navigator.userAgent
  const platform = navigator.platform || 'Unknown'
  const screenRes = `${screen.width}x${screen.height}`
  
  // Detectar navegador
  let browser = 'Unknown'
  if (userAgent.includes('Chrome')) {
    browser = 'Chrome'
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox'
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari'
  } else if (userAgent.includes('Edge')) {
    browser = 'Edge'
  }

  // Detectar sistema operativo
  let osName = 'Unknown'
  if (/Windows/.test(userAgent)) {
    osName = 'Windows'
  } else if (/Mac/.test(userAgent)) {
    osName = 'macOS'
  } else if (/Android/.test(userAgent)) {
    osName = 'Android'
  } else if (/iPhone|iPad/.test(userAgent)) {
    osName = 'iOS'
  } else if (/Linux/.test(userAgent)) {
    osName = 'Linux'
  }

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown'
  
  return {
    user_agent: userAgent,
    platform: platform,
    screen_resolution: screenRes,
    browser: browser,
    os_name: osName,
    timestamp: new Date().toISOString(),
    timezone: timezone,
    language: navigator.language
  }
}
