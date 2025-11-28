# Secret Messages - Farcaster Mini App 💬

Anonymous messaging platform built as a Farcaster/Base mini app. Users create unique links and receive 100% anonymous messages from friends.

## 🎯 Features

- **Farcaster Mini App** - Native SDK integration with `sdk.actions.ready()`
- **Web3 Wallet Integration** - Connect with Coinbase Wallet, MetaMask, or WalletConnect
- **Base Chain** - Built on Base L2 network with smart contract integration
- **424×695px Viewport** - Optimized for Farcaster mini app specs
- **Anonymous Messaging** - No tracking, 100% private
- **Social Sharing** - WhatsApp, Instagram integration
- **Message Dashboard** - View, copy, share as image, delete
- **Shareable Cards** - Beautiful PNG generation with html2canvas
- **Supabase Backend** - Real-time PostgreSQL with RLS

## 🛠️ Tech Stack

React 18 • Vite • TailwindCSS • Farcaster SDK • Wagmi v2 • Viem v2 • Base Chain • Supabase • React Router • html2canvas • nanoid

## 🚀 Quick Start

```bash
# Install
npm install

# Configure .env
VITE_SUPABASE_URL=https://tviarqwjubiargwhbzvs.supabase.co
VITE_SUPABASE_ANON_KEY=your_key

# Run dev server
npm run dev
```

Visit http://localhost:5173

## 💼 Wallet Integration

The app uses Wagmi v2 for Web3 wallet connections on Base chain.

**Contract**: `0x0df3135d5fe00dc5b4afd9e1ff2fa862d78b7350`

**Flow**:
1. User enters name and agrees to terms
2. Clicks "Create your Link" → triggers wallet connection
3. After wallet connects, automatically creates link with wallet address
4. Wallet address stored in Supabase `users.wallet_address` column

**Supported Wallets**:
- Coinbase Wallet
- MetaMask
- WalletConnect

**Configuration**: [src/lib/wagmi.js](src/lib/wagmi.js)

## 📦 Database Schema

### Users Table
Add `wallet_address` column to store user's wallet:

```sql
ALTER TABLE users
ADD COLUMN wallet_address TEXT;
```

### Messages Table
Add columns to store onchain transaction data:

```sql
ALTER TABLE messages
ADD COLUMN tx_hash TEXT,
ADD COLUMN sender_address TEXT;
```

**Note**: Messages are now written to the Base blockchain using the OnchainConfessions contract, then the transaction hash is stored in Supabase for the dashboard.

## 📦 Farcaster Setup

### 1. Update farcaster.json

File: `public/.well-known/farcaster.json`

Replace placeholders:
- `REPLACE_WITH_YOUR_BASE_WALLET_ADDRESS`
- All `https://your-domain.com` URLs

### 2. Generate Account Association

1. Deploy to production (Vercel)
2. Go to Base Build's account association tool
3. Enter your URL → Verify → Generate credentials
4. Copy `header`, `payload`, `signature` to farcaster.json

### 3. Update Embed Metadata

File: `index.html`

Update `fc:miniapp` meta tag URLs to your production domain

## 📱 Mini App Integration

**SDK Call** (in App.jsx):
```javascript
import { sdk } from '@farcaster/miniapp-sdk'

useEffect(() => {
  sdk.actions.ready() // Signals app is loaded
}, [])
```

**Manifest**: `.well-known/farcaster.json`
**Viewport**: 424px × 695px (set in CSS)
**Embed Tag**: `fc:miniapp` meta tag in index.html

## 🎨 Design

- Purple-pink neon gradients (#667eea → #764ba2)
- Compact spacing for mini app
- Glass-morphism cards
- Smooth hover animations
- Mobile-optimized text sizes

## 📂 Routes

- `/` - Landing (name input)
- `/success/:uniqueId` - Share page
- `/u/:uniqueId` - Message form
- `/u/:uniqueId/messages` - Dashboard

## 🚀 Deploy

```bash
npm run build
vercel --prod
```

Set env vars in Vercel:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 📖 Documentation

- [Farcaster Mini Apps](https://miniapps.farcaster.xyz/)
- [Base Migration Guide](https://docs.base.org/mini-apps/quickstart/migrate-existing-apps)

---

**Built with 💜 for Farcaster**
