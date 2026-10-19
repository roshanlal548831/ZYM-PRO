import { format, isValid } from 'date-fns'

export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.data
  if (Array.isArray(data?.errors) && data.errors.length) {
    const details = data.errors.map((item) => item.message).filter(Boolean).join(' ')
    return details ? `${data.message || 'Please check your input.'} ${details}` : data.message
  }
  if (data?.message) return data.message
  if (error?.status === 'FETCH_ERROR') return 'Could not reach the gym server. Check that it is running and try again.'
  if (error?.status === 'TIMEOUT_ERROR') return 'The request took too long. Please try again.'
  return fallback
}

export function formatINR(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value) || 0)
}

export function formatDate(value) {
  if (!value) return 'Not available'
  const date = new Date(value)
  return isValid(date) ? format(date, 'd MMM yyyy') : 'Not available'
}

export function unwrapList(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  return []
}