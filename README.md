# MarFebCRM - Personal Relationship Manager

A fast, privacy-first personal CRM for managing contacts, interactions, notes, and follow-ups. **100% local, no backend required.**

![Build Status](https://github.com/your-username/MarFebCRM/actions/workflows/build.yml/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-blue.svg)

## ✨ Features

### Contact Management
- 📇 **Full CRUD** - Create, view, edit, delete contacts with ease
- 🏷️ **Unlimited Tags** - Organize with tags like "Friends", "Business", "Family"
- ⭐ **Favorites** - Quick access to important contacts
- 📦 **Archive** - Safely archive without deleting
- 🔍 **Search & Filter** - Find contacts by name or tags instantly
- 📊 **HQ Score** - Track relationship strength (0-10 scale)

### Activity & Timeline
- 📝 **Notes** - Add timestamped notes to contacts
- ✅ **Next Steps** - Create actionable follow-up items with completion tracking
- 📋 **Activity Timeline** - Combined view of all interactions
- ⚡ **Quick Entry** - Fast note-taking while reviewing contacts

### Quick Paste (MVP Feature)
- 🎯 **Floating Button** - Access from any page (always accessible)
- 📋 **Smart Parsing** - Extract contacts from pasted text
- 📞 **Auto-Extract** - Intelligently identifies phone, email, company
- 🗂️ **Source Tracking** - Remember where you met them (meeting type)

### Data Management
- 💾 **Persistent Storage** - All data saved locally in browser
- 💿 **Export/Import** - Full backup and restore capabilities
- 🔄 **Smart Merge** - Import adds/updates without deleting existing data
- 🔒 **No Cloud Dependency** - Your data, your device, your rules

### User Experience
- 🌙 **Dark/Light Mode** - Theme toggle
- 📱 **Responsive Design** - Works on mobile and desktop
- ⚡ **Fast & Smooth** - Instant interactions, no waiting
- 🔔 **Toast Notifications** - Feedback on every action

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- No database, no server, no API keys required

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/MarFebCRM.git
cd MarFebCRM

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

### First Time Setup

1. **Login** - Create credentials (stored locally, encrypted)
2. **Dashboard** - See overview and quick stats
3. **Add Contacts** - Use "Quick Paste" to add contacts from notes
4. **Organize** - Create tags and assign to contacts
5. **Backup** - Export your data regularly

## 📦 Build & Deploy

### Production Build
```bash
npm run build
```

Output in `dist/` directory (~135 KB gzipped)

### Deploy Anywhere
- **Vercel** (recommended) - `vercel`
- **Netlify** - `netlify deploy --prod --dir=dist`
- **GitHub Pages** - Configure in repo settings
- **AWS S3 + CloudFront** - S3 bucket + distribution
- **Any static host** - Just serve the `dist` folder

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | React 19 + TypeScript |
| **Build** | Vite 5 |
| **Styling** | Tailwind CSS |
| **State** | Zustand |
| **Storage** | localStorage (browser native) |
| **Icons** | Lucide React |
| **Router** | React Router v7 |

## 📂 Project Structure

```
src/
├── pages/           # Route components
│   ├── Dashboard.tsx
│   ├── Contacts.tsx
│   ├── ContactDetail.tsx
│   ├── Groups.tsx
│   └── ...
├── components/      # Reusable UI
│   ├── FloatingPasteButton.tsx
│   ├── paste/
│   ├── layout/
│   └── ui/
├── services/        # Business logic
│   ├── contacts/
│   ├── storage/
│   ├── parser/
│   └── ...
├── store/           # Zustand stores
│   ├── useContactStore.ts
│   ├── useAuthStore.ts
│   └── ...
├── App.tsx
├── main.tsx
└── index.css
```

## 🔐 Security & Privacy

✅ **No Backend** - No server to breach
✅ **Local First** - All data stays on your device
✅ **No Tracking** - Zero telemetry or analytics
✅ **No Cloud** - Optional export only, your choice
✅ **Open Source** - Transparent, auditable code

## 🌐 Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Full support |
| Firefox | 88+ | ✅ Full support |
| Safari | 15+ | ✅ Full support |
| Edge | 90+ | ✅ Full support |

## 📊 Performance

- **Bundle Size**: 428 KB (130 KB gzipped)
- **Startup Time**: <1s on modern browsers
- **Data Storage**: 5-10 MB localStorage limit (easily store 1000+ contacts)
- **No External API calls** - Blazing fast, works offline

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for:
- Development setup
- Code style guide
- PR process
- Testing requirements

## 📝 Roadmap

### Phase 1: MVP ✅
- [x] Contact CRUD
- [x] Tags & groups system
- [x] Notes & activity timeline
- [x] Quick paste feature
- [x] Export/import data
- [x] Dark mode
- [x] Dashboard with stats

### Phase 2: Enhancement
- [ ] Reminders & notifications
- [ ] Contact relationships (linked contacts)
- [ ] Advanced search
- [ ] Bulk operations
- [ ] Email integration

### Phase 3: Sync (Optional)
- [ ] Cloud backup (encrypted)
- [ ] Multi-device sync
- [ ] Collaborative features
- [ ] Mobile app

## 📄 License

MIT License - See [LICENSE](./LICENSE) file

## 🐛 Troubleshooting

**Data not saving?**
- Check if localStorage is enabled in browser
- Try a different browser or private window
- Check browser storage quota

**Import removed my data?**
- This shouldn't happen! Import merges data
- Check if you imported from an older backup
- Export current data before importing

**Need help?**
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment issues
- Open an [issue on GitHub](https://github.com/yourusername/MarFebCRM/issues)
- See [CONTRIBUTING.md](./CONTRIBUTING.md) for development questions

## 📞 Support

- 📧 **Issues** - Report bugs or request features
- 💬 **Discussions** - Ask questions and share ideas
- 🔗 **GitHub** - https://github.com/yourusername/MarFebCRM

---

**Built with ❤️ for personal relationship management**

**Status**: Production Ready | **Last Updated**: March 2026
