# Contributing to jsont

We welcome contributions to the jsont project! This document explains how to effectively contribute to the project.

## 🚀 Development Environment Setup

### Prerequisites
- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher
- **Git**: Latest version recommended

### Setup Steps
```bash
# 1. Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/jsont.git
cd jsont

# 2. Install dependencies
npm install

# 3. Start in development mode
npm run dev

# 4. Run tests
npm run test
```

## 📋 Development Workflow

### Branch Strategy
- `master`: Production branch (pull request target)
- `feature/feature-name`: New feature development branch
- `fix/fix-description`: Bug fix branch
- `docs/content`: Documentation update branch

### Development Process
```bash
# 1. Create development branch from latest master
git checkout master
git pull origin master
git checkout -b feature/your-feature-name

# 2. Implement changes
# Code implementation, test creation

# 3. Code quality check
npm run check        # lint + format + type check
npm run test:run     # Run all tests

# 4. Commit
git add .
git commit -m "feat: implement new feature"

# 5. Push and create pull request
git push origin feature/your-feature-name
```

## 🧪 Testing Strategy

### Running Tests
```bash
npm run test          # Test in watch mode
npm run test:run      # Run tests once
npm run test:ui       # Run with test UI
npm run test:ci       # CI environment execution (memory optimized)
```

### Test Creation Guidelines
- **Unit Tests**: Each feature/utility function covered in `.spec.ts` files
- **Integration Tests**: Feature interaction placed under `src/integration/`
- **Performance Tests**: Performance verification for large data processing
- **Coverage**: Maintain 85%+ test coverage for new code

### Test Examples
```typescript
// src/features/search/utils/searchUtils.spec.ts
describe('searchInJsonWithScope', () => {
  it('should search in keys only when scope is keys', () => {
    const data = { name: "test", value: "name" };
    const results = searchInJsonWithScope(data, "name", "keys");
    expect(results).toHaveLength(1);
    expect(results[0].path).toEqual(["name"]);
  });
  
  it('should handle complex nested structures', () => {
    const data = { users: [{ profile: { name: "Alice" } }] };
    const results = searchInJsonWithScope(data, "Alice", "values");
    expect(results[0].path).toEqual(["users", "0", "profile", "name"]);
  });
});
```

## 💻 Code Quality Standards

### TypeScript
- **Strictest Configuration**: Inherits `@tsconfig/strictest` settings
- **Type Safety**: Minimize use of `any` type
- **Interfaces**: Clear type definitions and documentation

### Code Style (Biome)
```bash
npm run check        # All checks (lint + format + type)
npm run check:write  # Apply automatic fixes
npm run lint         # Run linter
npm run format       # Run formatter
```

### Architecture Principles
- **Feature-Driven Design**: Implementation and testing by feature
- **Clean Architecture**: Layer separation and dependency management
- **Performance-Focused**: Smooth operation even with large data
- **Extensibility**: Support for plugin system and customization features

## 🐛 Issues and Pull Requests

### Issue Reporting
When creating a new issue, please use the following templates:

#### Bug Report
```markdown
## 🐛 Bug Summary
Brief description of the bug

## 📋 Reproduction Steps
1. Run `echo '{"test": true}' | jsont`
2. Press `S` key
3. Error occurs

## 💡 Expected Behavior
Schema view should display normally

## 😵 Actual Behavior
Error message is displayed

## 🔧 Environment Information
- OS: macOS 14.1
- Node.js: v18.19.0
- jsont version: 1.0.0
- Terminal: iTerm2
```

#### Feature Request
```markdown
## 🚀 Feature Summary
Brief description of the new feature

## 🎯 Use Cases
Situations where this feature is needed

## 💡 Proposed Implementation
Implementation proposal if available

## 📄 Additional Information
Reference materials or samples if available
```

### Pull Requests
- **Commit Messages**: Use Conventional Commits format
  - `feat:` New feature
  - `fix:` Bug fix
  - `docs:` Documentation update
  - `refactor:` Refactoring
  - `test:` Test addition/modification
  - `perf:` Performance improvement
- **Description**: Clearly state changes, reasons, and testing methods
- **Review**: Respond to feedback in code reviews

### Pull Request Template
```markdown
## 📝 Summary
Overview of changes

## 🔧 Change Type
- [ ] New feature (feat)
- [ ] Bug fix (fix)
- [ ] Documentation (docs)
- [ ] Refactoring (refactor)
- [ ] Test (test)
- [ ] Performance (perf)

## 🧪 Testing
- [ ] Added new tests
- [ ] Existing tests pass
- [ ] Manual testing conducted

## 📋 Checklist
- [ ] `npm run check` passes
- [ ] Test coverage is maintained
- [ ] Documentation is updated
- [ ] Breaking changes are documented if applicable
```

## 🎯 Development Guidelines

### Feature Development
1. **Understand Requirements**: Clarify requirements through issues or discussions
2. **Design Consideration**: Check consistency with existing architecture
3. **Prototype**: Create small prototypes for proof of concept
4. **Test-Driven Development**: Create tests before implementation
5. **Performance Verification**: Verify operation with large data
6. **Documentation Update**: Update README and help

### Code Review
- **Constructive Feedback**: Provide clear improvement suggestions and reasons
- **Knowledge Sharing**: Explain why implementations are good or bad
- **Learning Opportunity**: Improve each other's skills through reviews
- **Prompt Response**: Initial response within 24 hours of review request

## 🔧 Common Issues and Solutions

### Performance Test Failures
```bash
# Memory usage optimization
NODE_OPTIONS="--max-old-space-size=6144" npm run test:ci

# Skip specific tests
npm run test -- --exclude="performance"
```

### TypeScript Errors
```bash
# Run type check only
npm run type-check

# Incremental build
npx tsc --incremental
```

### Import Errors
- Use path aliases `@/*`, `@core/*`, `@features/*`
- Extensionless imports are required (build system requirement)

## 🌟 Recognition of Contributions

### Contributors
All contributors will be listed in the Contributors section of the README.

### Types of Contributions
- **Code**: New features, bug fixes, refactoring
- **Documentation**: Improvements to README, guides, comments
- **Testing**: Test additions, test case improvements
- **Issues**: Bug reports, feature requests, questions
- **Reviews**: Code reviews, design discussions
- **Translation**: Multi-language support, localization

## 📞 Communication

### Questions & Consultation
- **GitHub Issues**: Bug reports, feature requests
- **GitHub Discussions**: Design consultation, usage questions
- **Pull Requests**: Detailed discussions about code

### Contact Methods
- Both Japanese and English are supported
- Technical questions are recommended for public discussion in Issues
- Large design changes should be discussed in advance via Discussions

---

## 🙏 Thanks

Thank you for considering contributing to the jsont project!
Your contributions will help improve the productivity of many developers.

If you have any questions or concerns, please feel free to create an Issue.
Let's build better tools together!