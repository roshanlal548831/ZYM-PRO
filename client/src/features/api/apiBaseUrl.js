const localApiUrl = 'http://localhost:4000/api/v1'
const productionApiUrl = 'https://zym-pro.onrender.com/api/v1'
const configuredApiUrl = import.meta.env.VITE_API_BASE_URL?.trim()

function isLoopbackUrl(value) {
  if (!value) return false
  try {
    return ['localhost', '127.0.0.1', '::1'].includes(new URL(value).hostname)
  } catch {
    return false
  }
}

export const API_BASE_URL = import.meta.env.DEV
  ? configuredApiUrl || localApiUrl
  : configuredApiUrl && !isLoopbackUrl(configuredApiUrl)
    ? configuredApiUrl
    : productionApiUrl
