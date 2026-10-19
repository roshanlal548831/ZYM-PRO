const localApiUrl = 'http://localhost:4000/api/v1'
const configuredApiUrl = import.meta.env.VITE_API_BASE_URL?.trim()

export const API_BASE_URL = configuredApiUrl || localApiUrl
