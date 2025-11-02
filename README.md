# Greater - A Modern Mastodon Client

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![CI](https://github.com/aron23/greater/workflows/CI/badge.svg)](https://github.com/aron23/greater/actions)
[![Deploy](https://github.com/aron23/greater/workflows/Deploy/badge.svg)](https://github.com/aron23/greater/actions)

Greater is a modern, high-performance web client for Mastodon-compatible instances (including Lesser). Built with Astro, Svelte 5, and powered by GraphQL, it's deployed on Cloudflare's edge network for lightning-fast performance globally.

**Tech Stack:** Astro + Svelte 5 + GraphQL (Lesser adapter) + @equaltoai/greater-components + Cloudflare Workers

## ✨ Features

- 🚀 **Lightning Fast**: Sub-second load times globally with edge computing
- 🎨 **Beautiful UI**: Modern, accessible design with light/dark themes from @equaltoai/greater-components
- 📱 **Mobile First**: Responsive design that works perfectly on all devices
- 🔒 **Privacy Focused**: No tracking, no analytics without explicit consent
- 🌐 **Multi-Instance**: Connect to multiple Mastodon instances simultaneously
- ♿ **Accessible**: WCAG 2.1 AA compliant with full keyboard navigation
- 🌍 **International**: Support for 20+ languages
- 📱 **PWA Ready**: Install as a native app on any platform
- 🔌 **Mastodon Compatible**: Works with any Mastodon v3.0+ instance
- ⚡ **GraphQL-First**: Powered by Lesser GraphQL API for efficient data fetching
- 🧩 **Component Library**: Built with @equaltoai/greater-components primitives
- 🧵 **Threaded Conversations**: Full thread context with ancestors and descendants
- 🏷️ **Hashtag Browsing**: Dedicated hashtag timelines with pagination

## 🚀 Quick Start

### Using Greater

Visit [greater.website](https://greater.website) and connect your Mastodon account to get started!

### Self-Hosting

```bash
# Clone the repository
git clone https://github.com/aron23/greater.git
cd greater

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Run development server
pnpm run dev
```

Visit `http://localhost:4321` to see your local instance.

## 🛠️ Development

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0 (required - this project uses pnpm workspaces)
- Git >= 2.30.0
- Access to a Lesser GraphQL endpoint (or Mastodon REST API fallback)

### Setup

```bash
# Install dependencies
pnpm install

# Configure environment
cp env.example .env
# Edit .env with your Lesser GraphQL endpoints:
# LESSER_GRAPHQL_HTTP_ENDPOINT=https://your-instance/graphql
# LESSER_GRAPHQL_WS_ENDPOINT=wss://your-instance/graphql

# Run development server
pnpm run dev         # Standard dev server
pnpm run dev:cf      # Dev server with Cloudflare bindings

# Run tests
pnpm test            # Unit tests (Vitest)
pnpm test:e2e        # E2E tests (Playwright)
pnpm test:coverage   # Coverage report

# Type checking and linting
pnpm typecheck       # TypeScript validation
pnpm lint            # ESLint + Prettier
pnpm format          # Auto-format code

# Build for production
pnpm run build       # Cloudflare Workers build
pnpm run preview     # Preview production build
```

### Project Structure

```
greater/
├── src/
│   ├── components/       # UI components (Svelte 5)
│   │   ├── islands/      # Client-side interactive components
│   │   └── core/         # Server-rendered components
│   ├── layouts/          # Page layouts
│   ├── pages/            # Route pages (Astro)
│   ├── lib/
│   │   ├── api/          # GraphQL client & adapters
│   │   ├── stores/       # Svelte stores (state management)
│   │   ├── components/   # Greater Components wrappers
│   │   └── mappers/      # GraphQL-to-Mastodon data mapping
│   └── types/            # TypeScript types
├── public/               # Static assets
├── functions/            # Cloudflare Workers (auth, middleware)
├── infrastructure/       # Pulumi deployment configs
└── tests/
    ├── unit/             # Vitest unit tests
    └── e2e/              # Playwright E2E tests
```

### Technology Stack

**Frontend:**
- **Framework**: Astro 5 (SSR/SSG)
- **UI Library**: Svelte 5 (with runes)
- **Component Library**: @equaltoai/greater-components
- **Styling**: Tailwind CSS
- **State**: Svelte stores + nanostores

**Backend/API:**
- **API Protocol**: GraphQL (Lesser adapter)
- **GraphQL Client**: Apollo Client (via @equaltoai/greater-components)
- **Fallback**: Mastodon REST API (legacy support)
- **Auth**: OAuth 2.0 (via Cloudflare Workers)

**Infrastructure:**
- **Hosting**: Cloudflare Workers (serverless)
- **CDN**: Cloudflare CDN
- **Build**: Vite + Astro build pipeline
- **Deployment**: Pulumi (infrastructure as code)

**Development:**
- **Package Manager**: pnpm (workspaces)
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Type Checking**: TypeScript 5.3+
- **Linting**: ESLint + Prettier
- **Git Hooks**: Husky + lint-staged

## 📚 Documentation

- [User Guide](docs/user-guide/README.md)
- [Developer Guide](DEVELOPER_GUIDELINES.md)
- [API Documentation](docs/api/README.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Architecture Overview](TECHNICAL_ARCHITECTURE.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## 🗺️ Roadmap

### Phase 1: Foundation ✅
- [x] Project setup and infrastructure
- [ ] OAuth authentication
- [ ] Basic timeline display
- [ ] Profile pages

### Phase 2: Core Features 🚧
- [ ] Post composition
- [ ] Media uploads
- [ ] Notifications
- [ ] Search functionality

### Phase 3: Advanced Features 📋
- [ ] Real-time updates
- [ ] Multiple accounts
- [ ] Offline support
- [ ] Custom themes

See our [Implementation Tasks](GREATER_IMPLEMENTATION_TASKS.md) for detailed progress.

## 📊 Performance

Greater is designed for exceptional performance:

- **Lighthouse Score**: 95+
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 2.5s
- **Bundle Size**: < 100KB initial

## 🔐 Security

- **AGPL-3.0 Licensed**: Ensures freedom and transparency
- **No Tracking**: No analytics without explicit consent
- **Secure by Default**: Content Security Policy enabled
- **Regular Updates**: Automated dependency updates

## 💖 Support

- **Discord**: [Join our community](https://discord.gg/greater)
- **Matrix**: #greater:matrix.org
- **Mastodon**: [@greater@mastodon.social](https://mastodon.social/@greater)
- **GitHub Issues**: [Report bugs or request features](https://github.com/aron23/greater/issues)

## 📄 License

This project is licensed under the GNU Affero General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- The Mastodon team for the amazing protocol
- The Astro team for the fantastic framework
- Cloudflare for the edge infrastructure
- All our contributors and supporters

---

Made with ❤️ by the Greater community