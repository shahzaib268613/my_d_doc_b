import { Injectable } from '@nestjs/common'

export const HEALTH_MESSAGE =
  'My Diabetes Doctor server is running - maintained by Senew Tech'

@Injectable()
export class HealthService {
  getMessage(): string {
    return HEALTH_MESSAGE
  }

  getStatusPage(): string {
    const message = this.getMessage()
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>My Diabetes Doctor · Server Status</title>
    <style>
      :root {
        color-scheme: light;
        --navy: #021b44;
        --blue: #2f7fb0;
        --soft: #eaf0f8;
        --muted: #5b6b7c;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 1.5rem;
        font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
        background:
          radial-gradient(circle at 15% 20%, rgba(47, 127, 176, 0.18), transparent 40%),
          radial-gradient(circle at 85% 80%, rgba(2, 27, 68, 0.12), transparent 45%),
          linear-gradient(160deg, #f7fafc 0%, var(--soft) 100%);
        color: var(--navy);
      }
      main {
        width: min(100%, 36rem);
        padding: 2rem 1.75rem;
        border-radius: 1.25rem;
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid rgba(2, 27, 68, 0.08);
        box-shadow: 0 18px 40px rgba(2, 27, 68, 0.08);
        text-align: center;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1.25rem;
        padding: 0.35rem 0.75rem;
        border-radius: 999px;
        background: rgba(47, 127, 176, 0.12);
        color: var(--blue);
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .dot {
        width: 0.55rem;
        height: 0.55rem;
        border-radius: 999px;
        background: #22c55e;
        box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.18);
      }
      h1 {
        margin: 0;
        font-size: clamp(1.35rem, 4vw, 1.75rem);
        line-height: 1.35;
        font-weight: 700;
      }
      p {
        margin: 0.85rem 0 0;
        color: var(--muted);
        font-size: 0.95rem;
        line-height: 1.5;
      }
    </style>
  </head>
  <body>
    <main>
      <div class="badge"><span class="dot" aria-hidden="true"></span> Online</div>
      <h1>${message}</h1>
      <p>Health check endpoint · My Diabetes Doctor API</p>
    </main>
  </body>
</html>`
  }
}
