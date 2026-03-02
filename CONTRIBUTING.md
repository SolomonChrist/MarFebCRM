# Contributing to MarFebCRM

Thank you for your interest in contributing! Here's how to get started.

## Development Setup

1. **Fork & Clone**
```bash
git clone https://github.com/YOUR_USERNAME/MarFebCRM.git
cd MarFebCRM
```

2. **Install Dependencies**
```bash
npm install
```

3. **Start Development Server**
```bash
npm run dev
```

4. **Open in Browser**
```
http://localhost:5173
```

## Making Changes

### Code Style
- Use TypeScript for all new files
- Follow existing component patterns
- Use Tailwind CSS for styling
- Keep components small and focused

### File Structure
```
src/
├── pages/          # Page components
├── components/     # Reusable components
├── services/       # Business logic
├── store/          # Zustand stores
└── index.css       # Global styles
```

### Before Committing
```bash
npm run lint        # Check for lint errors
npm run build       # Verify production build works
```

## Creating a Pull Request

1. **Create a feature branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes**
- Keep commits atomic and focused
- Write clear commit messages
- Update README if needed

3. **Push to your fork**
```bash
git push origin feature/your-feature-name
```

4. **Open a Pull Request**
- Describe what changed and why
- Link any related issues
- Include before/after screenshots if UI changes

## Commit Message Format

```
Brief description of changes

Longer explanation if needed. Explain the why, not just the what.

- Bullet point for specific changes
- Another change
```

## Testing

Test your changes locally:
1. Create/edit contacts
2. Test search and filtering
3. Add/remove tags
4. Export and import data
5. Test on mobile device
6. Check console for errors

## Questions?

- Open an issue for bugs
- Discussions tab for questions
- Check existing issues first

Thank you for contributing! 🎉
