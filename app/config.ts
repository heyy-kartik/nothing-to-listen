const env = import.meta.env as unknown as {
  VITE_TELEMETRY_ENABLED?: string
  VITE_TELEMETRY_ENDPOINT?: string
  VITE_APP_VERSION?: string
}

export default {
  lastFmBaseUrl: 'https://www.last.fm/music',
  sourceCodeUrl: 'https://github.com/heyy-kartik/nothing-to-listen',
  contactEmail: 'kartikjagdale0511@gmail.com',
  disableUI: false,
  telemetry: {
    enabled:
      env?.VITE_TELEMETRY_ENABLED === '1' ||
      env?.VITE_TELEMETRY_ENABLED === 'true',
    endpoint: env?.VITE_TELEMETRY_ENDPOINT || undefined,
    appVersion: env?.VITE_APP_VERSION || undefined,
  },
}
