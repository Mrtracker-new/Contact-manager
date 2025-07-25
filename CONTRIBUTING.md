# Contributing to Contact Manager

Thank you for your interest in contributing to Contact Manager! This document provides guidelines and instructions for contributing to the project.

## 🎯 Ways to Contribute

- 🐛 **Bug Reports**: Help us find and fix issues
- ✨ **Feature Requests**: Suggest new features or improvements
- 💻 **Code Contributions**: Submit bug fixes or new features
- 📖 **Documentation**: Improve documentation and examples
- 🎨 **Design**: Contribute UI/UX improvements
- 🧪 **Testing**: Help improve test coverage

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git
- Basic knowledge of React, TypeScript, and modern web development

### Setup Development Environment

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/contact-manager.git
   cd contact-manager
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Run Tests**
   ```bash
   npm test
   ```

## 📝 Code Style Guidelines

### General Rules

- Use **TypeScript** for all new code
- Follow the existing code style and patterns
- Write clear, self-documenting code
- Add comments for complex logic
- Keep functions small and focused

### Naming Conventions

- **Components**: PascalCase (`ContactCard.tsx`)
- **Files**: camelCase for utilities, PascalCase for components
- **Functions**: camelCase (`getUserContacts`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Interfaces/Types**: PascalCase (`ContactData`)

### File Organization

```
src/
├── components/     # Reusable UI components
├── pages/         # Route components
├── services/      # Business logic
├── utils/         # Utility functions
├── types/         # Type definitions
├── store/         # State management
└── db/           # Database operations
```

## 🔧 Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 2. Make Your Changes

- Write clean, tested code
- Follow the existing patterns
- Update documentation if needed
- Add tests for new features

### 3. Test Your Changes

```bash
# Run tests
npm test

# Run linting
npm run lint

# Build the project
npm run build
```

### 4. Commit Your Changes

Use conventional commit messages:

```bash
git commit -m "feat: add contact export functionality"
git commit -m "fix: resolve search pagination issue"
git commit -m "docs: update API documentation"
```

### Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## 🐛 Bug Reports

When reporting bugs, please include:

### Required Information

- **Environment**: OS, browser, app version
- **Steps to Reproduce**: Clear, numbered steps
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Screenshots**: If applicable
- **Console Errors**: Any error messages

### Bug Report Template

```markdown
## Bug Description
Brief description of the issue

## Environment
- OS: [e.g., Windows 10, macOS Big Sur]
- Browser: [e.g., Chrome 96, Safari 15]
- App Version: [e.g., 2.0.0]

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What you expected to happen

## Actual Behavior
What actually happened

## Screenshots
If applicable, add screenshots

## Additional Context
Any other context about the problem
```

## ✨ Feature Requests

### Before Submitting

- Check if the feature already exists
- Search existing issues and discussions
- Consider if it fits the project scope

### Feature Request Template

```markdown
## Feature Description
Clear description of the feature

## Problem Statement
What problem does this solve?

## Proposed Solution
How should this feature work?

## Alternatives Considered
Other solutions you've considered

## Additional Context
Mockups, examples, or other context
```

## 🧪 Testing Guidelines

### Test Requirements

- Write tests for new features
- Ensure existing tests pass
- Aim for meaningful test coverage
- Test edge cases and error conditions

### Test Types

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests (if implemented)
npm run test:e2e
```

### Test Structure

```typescript
describe('ContactService', () => {
  it('should create a new contact', async () => {
    // Arrange
    const contactData = { name: 'John Doe' };
    
    // Act
    const result = await createContact(contactData);
    
    // Assert
    expect(result).toBeDefined();
    expect(result.name).toBe('John Doe');
  });
});
```

## 📖 Documentation

### Areas to Improve

- API documentation
- Component documentation
- Usage examples
- Deployment guides
- Architecture explanations

### Documentation Style

- Use clear, concise language
- Include code examples
- Add screenshots for UI features
- Keep it up to date with code changes

## 🎨 UI/UX Contributions

### Design Principles

- **Accessibility First**: WCAG 2.1 AA compliance
- **Mobile-First**: Responsive design
- **Performance**: Smooth animations, fast interactions
- **Consistency**: Follow existing design patterns

### Design Tools

- Figma files (link to be provided)
- Design system documentation
- Color palette and typography guidelines

## 🔍 Code Review Process

### What We Look For

- **Functionality**: Does it work as expected?
- **Code Quality**: Is it clean and maintainable?
- **Performance**: Any performance implications?
- **Security**: Are there security concerns?
- **Testing**: Are there adequate tests?
- **Documentation**: Is it properly documented?

### Review Checklist

- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No breaking changes (or properly documented)
- [ ] Performance impact is minimal
- [ ] Security best practices followed

## 🚀 Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Version numbers bumped
- [ ] Build artifacts generated
- [ ] Release notes prepared

## ❓ Getting Help

### Resources

- 📖 **Documentation**: [Wiki](https://github.com/Mrtracker-new/contact-manager/wiki)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/Mrtracker-new/contact-manager/discussions)
- 🐛 **Issues**: [GitHub Issues](https://github.com/Mrtracker-new/contact-manager/issues)

### Contact

- **Author**: [Rolan](https://rolan-rnr.netlify.app/)
- **GitHub**: [@Mrtracker-new](https://github.com/Mrtracker-new)

## 📜 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of background, experience level, or identity.

### Expected Behavior

- Be respectful and inclusive
- Provide constructive feedback
- Accept criticism gracefully
- Focus on the project's best interests
- Help newcomers get started

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Personal attacks
- Spam or off-topic content

## 🎉 Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes
- Project documentation
- Social media shout-outs

Thank you for contributing to Contact Manager! 🚀
