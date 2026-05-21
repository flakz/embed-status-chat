# Marno Chat Widget — Client Documentation

## Overview

Marno Chat Widget is an embeddable AI chat interface that connects to your n8n workflow. Drop two script tags into any website and you get a fully branded, production-ready chat widget with:

- AI-powered conversations via your n8n backend
- Rich structured output cards (products, bookings, tasks, orders, calendar events)
- Real-time tool-call animations showing what the AI is doing
- Typing animation for AI responses
- Fully customizable branding (colors, logo, fonts, suggestions, greetings)
- Public JavaScript API for programmatic control

---

## Quick Start

Add these two script tags to any HTML page:

```html
<!-- 1. Configure the widget -->
<script>
  window.MarnoChatConfig = {
    webhookUrl: "https://your-n8n-instance.com/webhook/your-webhook-path",
    brandName: "Your Brand",
    primaryColor: "#0D72FF",
  };
</script>

<!-- 2. Load the widget -->
<script src="https://your-deployment.vercel.app/marno-chat-widget.js"></script>
```

That's it. A chat bubble appears in the bottom-right corner.

---

## Configuration Reference

All properties are **optional** — defaults are shown below.

```js
window.MarnoChatConfig = {

  // ── Required ──────────────────────────────────────

  webhookUrl: "https://n8n.marno.pro/webhook/marno-chat",
  // The n8n webhook URL that receives user messages


  // ── Branding ──────────────────────────────────────

  brandName: "Marno AI",
  // Displayed in the chat header

  brandLogo: "",
  // URL to a logo image (square, shown in header). If blank, shows a default icon.

  primaryColor: "#0D72FF",
  // Hex color. Used for header, user bubbles, send button, highlights

  toggleIcon: "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/green.jpg",
  // URL to the floating chat button icon (circular, 40×40)

  fontFamily: "Karla",
  // Any Google Fonts family name


  // ── AI Behavior ───────────────────────────────────

  kbSlug: "kbase",
  // Identifier passed to your n8n workflow (e.g., for knowledge base selection)

  suggestions: [
    { label: "Get started", prompt: "How do I get started?" },
    { label: "Pricing", prompt: "What are the pricing plans?" },
  ],
  // Quick-reply suggestion buttons shown after the greeting

  greetings: [
    "Hi! I'm an AI assistant.",
    "How can I help you today?",
  ],
  // Two greeting messages shown on first open. First message appears, then second.


  // ── Structured Output (Cards) ─────────────────────

  storeUrl: undefined,
  // Base URL for your Shopify store (e.g., "https://anarcx.in").
  // If set, product cards include a "View product →" link.
  // If not set, no links are rendered (products show info only).

  currencySymbol: "₹",
  // Currency symbol used in product price and order total formatting

  currencyLocale: "en-IN",
  // Locale for number formatting (e.g., "en-IN" → ₹1,23,456, "en-US" → $123,456.00)


  // ── Animation ─────────────────────────────────────

  animationSpeed: "normal",
  // "fast"   — minimal delays, instant feel
  // "normal" — smooth tool-step animations (default)
  // "off"    — no delays, everything appears instantly

};
```

---

## Structured Output Cards

When your n8n workflow returns a JSON response with structured data, the widget automatically renders rich cards. The expected output format is:

```json
{
  "output": {
    "message": "Here are the products you asked about:",

    "products": [
      {
        "title": "After Hours Oversized T-Shirt",
        "image": "https://cdn.shopify.com/...",
        "price": "999.00",
        "handle": "after-hours-oversized-tshirt",
        "description": "Premium cotton oversized fit"
      }
    ],

    "booking": {
      "summary": "Chatbot Demo",
      "start": "2026-05-23T11:00:00Z",
      "end": "2026-05-23T11:30:00Z",
      "attendees": "hello@marno.pro,biz.suheb@gmail.com",
      "description": "Product demo and Q&A",
      "status": "confirmed",
      "meet_url": "https://meet.google.com/abc-defg-hij"
    },

    "events": [
      {
        "summary": "Team Standup",
        "start": "2026-05-24T09:00:00Z",
        "end": "2026-05-24T09:30:00Z",
        "status": "confirmed"
      }
    ],

    "task": {
      "title": "Follow up with client",
      "notes": "Send the pricing proposal by Friday"
    },

    "orders": [
      {
        "id": "1234567890",
        "name": "#1001",
        "total_price": "1499.00",
        "created_at": "2026-05-20T08:30:00Z",
        "status": "fulfilled"
      }
    ]
  }
}
```

### Card Types

| Card | When Shown | Data Required |
|------|-----------|---------------|
| **Product Cards** | `products` array present | `title`, `image`, `price`, `handle` (optional `description`) |
| **Booking Card** | `booking` object present | `summary`, `start`, `end`, `status` (optional `attendees`, `description`, `meet_url`) |
| **Events List** | `events` array present | `summary`, `start`, `end`, `status` |
| **Task Card** | `task` object present | `title` (optional `notes`) |
| **Orders List** | `orders` array present | `id`, `name`, `total_price`, `created_at` (optional `status`) |

All fields are optional except `message`. The widget shows whichever cards have data.

### n8n Setup

To get structured output from your n8n workflow:

1. Add a **Structured Output Parser** node after your AI Agent
2. Use the JSON schema you paste into that node to define the output format
3. The schema should match the structure shown above

Ask us for the exact schema JSON you need to paste into your n8n Structured Output Parser.

---

## Tool Call Animations

When the AI agent uses tools (search, calendar, Shopify, etc.), the widget shows animated status bubbles:

| Tool Name Contains | Icon | Running | Complete |
|-------------------|------|---------|----------|
| `search`, `duck`, `google` | 🔍 | Searching… | Search complete |
| `create_event`, `book` | 📅 | Booking… | Appointment booked |
| `get_event`, `calendar`, `schedule` | 📆 | Checking schedule… | Schedule checked |
| `email`, `mail` | 📧 | Sending email… | Email sent |
| `product`, `shopify`, `store` | 🛍️ | Fetching products… | Products loaded |
| `create_task`, `todo` | ✅ | Creating task… | Task created |
| *anything else* | 🔧 | Running {name}… | {name} complete |

Internal formatting steps (`format_final_json_response`) are automatically hidden — they never appear as tool bubbles.

---

## JavaScript API

The widget exposes a public API on `window.marno`. You can control the chat from any JavaScript on the page.

### Methods

```js
marno.open()
// Opens the chat panel (same as clicking the floating button)

marno.close()
// Closes the chat panel

marno.toggle()
// Toggles the chat panel open/closed

marno.send("Your message here")
// Opens the chat (if closed) and sends a message to the AI
```

### Usage Examples

```html
<!-- Open chat from a navigation link -->
<a href="#" onclick="marno.open(); return false;">Chat with us</a>

<!-- Pre-fill a message from a pricing button -->
<button onclick="marno.send('I\'m interested in the Pro plan')">
  Talk to Sales
</button>

<!-- Open chat after a page action -->
<script>
  document.querySelector('#checkout-success').addEventListener('click', () => {
    marno.open();
  });
</script>
```

---

## Styling & Theming

All visible elements are styled through the config object:

| Config Field | What It Changes |
|-------------|-----------------|
| `primaryColor` | Header background, user message bubbles, send button, product prices, links, suggestion buttons, tool card border |
| `brandName` | Header title text, ARIA labels |
| `brandLogo` | Header logo image (26×26 circle) |
| `toggleIcon` | Floating chat button image (40×40 circle) |
| `fontFamily` | All text in the widget (loaded from Google Fonts) |

The widget's panel is fixed at **400px wide × 720px tall** (max-height: calc(100vh - 8rem)). The toggle button sits at the **bottom-right corner** (24px from bottom, 24px from right).

---

## Accessibility

The widget follows accessibility best practices:

- Floating toggle button has `aria-label` and `aria-expanded`
- Chat panel has `role="dialog"` with an accessible name
- Message area has `role="log"` with `aria-live="polite"` for screen reader announcements
- Input field has `aria-label="Type a message"`
- All action buttons have descriptive `aria-label` attributes
- Pressing **Escape** closes the chat panel
- Focus management follows natural tab order
- Stop button during streaming has `aria-label="Stop generating"`

---

## Browser Support

- All modern browsers (Chrome, Firefox, Safari, Edge) — latest 2 versions
- Requires ES2020+ (dynamic imports, optional chaining, nullish coalescing)
- No polyfills needed for modern browsers

---

## Supported n8n Tools

The widget auto-detects tool names and shows appropriate icons/labels. The following tool name patterns are recognized:

| Pattern | Card/Animation |
|---------|---------------|
| `search`, `duckduckgo`, `google`, `scrappa` | 🔍 Search animations |
| `create_event`, `book` | 📅 Booking → Appointment booked |
| `get_event`, `calendar`, `schedule` | 📆 Schedule check → Schedule checked |
| `email`, `mail` | 📧 Email → Email sent |
| `weather` | 🌤️ Weather |
| `product`, `shopify`, `inventory`, `store` | 🛍️ Products → Products loaded |
| `create_task`, `todo` | ✅ Task → Task created |
| `database`, `query` | 🗄️ Database |
| `code`, `api` | ⚙️ Code/API |
| `image`, `picture` | 🖼️ Image |
| `format_*`, `parser`, `json_response` | Hidden (internal) |

---

## Deployment

The widget builds into a single JavaScript file:

```bash
npm run build
# → dist/marno-chat-widget.js  (~472 KB, ~149 KB gzipped)
```

Deploy to any static host (Vercel, Netlify, Cloudflare Pages, S3). The script is an IIFE — it self-executes when loaded. No server-side rendering needed.

### Vercel

The project includes a `vercel.json` for zero-config deployment:

```bash
vercel --prod
```

---

## Troubleshooting

**Widget doesn't appear:**
- Check that both script tags are in the correct order (config _before_ widget script)
- Verify the widget script URL is accessible (no CORS issues for `.js` files)
- Open browser console for errors

**Widget shows default branding:**
- The config script must run _before_ the widget script loads
- If using `async` or `defer`, the widget may load before config — use synchronous `<script>` tags

**Cards not rendering:**
- Verify your n8n workflow returns the correct JSON structure
- The output must be inside an `output` key, e.g., `{ "output": { "products": [...] } }`
- Check browser console for parse errors

**Chat not responding:**
- Verify the `webhookUrl` is correct and the n8n instance is running
- Check n8n workflow executions for errors
- Ensure the webhook node is active

**Stop button doesn't stop:**
- Works only when the AI is still generating. Once the response is fully received, stopping is instant.

---

## Need Help?

Contact us at **hello@marno.pro** or visit **marno.pro** for support, custom integrations, and pricing.
