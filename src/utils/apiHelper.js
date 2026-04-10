// ── API Helper — Network error fix for login/register/guest ──
// Retry + Timeout + Better error messages

const DEFAULT_TIMEOUT = 12000  // 12 seconds
const MAX_RETRIES     = 2

function getNetworkErrorMsg(err) {
  const msg = err?.message?.toLowerCase() || ''
  if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('network request failed')) {
    return 'Server se connect nahi ho pa raha. Internet check karo ya thodi der baad try karo.'
  }
  if (msg.includes('timeout') || msg.includes('aborted')) {
    return 'Request timeout ho gayi. Internet slow hai — dobara try karo.'
  }
  return 'Network error. Internet check karo aur dobara try karo.'
}

export async function apiFetch(url, options = {}, retries = MAX_RETRIES) {
  const controller = new AbortController()
  const timeoutId  = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT)

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return res
  } catch (err) {
    clearTimeout(timeoutId)

    const isAbort   = err?.name === 'AbortError'
    const isNetwork = !isAbort

    // Retry on network errors (not on abort/timeout)
    if (isNetwork && retries > 0) {
      // Wait 1s before retry
      await new Promise(r => setTimeout(r, 1000))
      return apiFetch(url, options, retries - 1)
    }

    // Throw friendly error
    throw new Error(getNetworkErrorMsg(err))
  }
}
