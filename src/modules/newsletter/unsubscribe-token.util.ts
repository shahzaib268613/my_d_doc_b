import { createHmac, timingSafeEqual } from 'node:crypto'

type TokenPayload = {
  sid: string
  exp: number
}

function toBase64Url(value: string | Buffer) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  return Buffer.from(padded + pad, 'base64').toString('utf8')
}

export function createUnsubscribeToken(
  subscriberId: string,
  secret: string,
  ttlSeconds = 60 * 60 * 24 * 365,
) {
  const payload: TokenPayload = {
    sid: subscriberId,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  }
  const body = toBase64Url(JSON.stringify(payload))
  const signature = toBase64Url(
    createHmac('sha256', secret).update(body).digest(),
  )
  return `${body}.${signature}`
}

export function verifyUnsubscribeToken(
  token: string,
  secret: string,
): TokenPayload | null {
  const [body, signature] = token.split('.')
  if (!body || !signature) return null

  const expected = toBase64Url(
    createHmac('sha256', secret).update(body).digest(),
  )
  const left = Buffer.from(signature)
  const right = Buffer.from(expected)
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return null
  }

  try {
    const payload = JSON.parse(fromBase64Url(body)) as TokenPayload
    if (!payload.sid || typeof payload.exp !== 'number') return null
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}
