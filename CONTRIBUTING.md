# Contributing to Greater

First off, thank you for considering contributing to Greater! It's people like you that make Greater such a great tool for the Fediverse community.

## Code of Conduct

This project and everyone participating in it is governed by the [Greater Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible.

**Bug Report Template:**
- **Description**: A clear and concise description of what the bug is
- **Steps to Reproduce**: Steps to reproduce the behavior
- **Expected Behavior**: What you expected to happen
- **Actual Behavior**: What actually happened
- **Screenshots**: If applicable, add screenshots
- **Environment**: Browser, OS, Greater version
- **Instance**: Which Mastodon instance you were connected to

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use Case**: Explain why this enhancement would be useful
- **Proposed Solution**: Describe the solution you'd like
- **Alternatives**: Describe alternatives you've considered
- **Additional Context**: Add any other context or screenshots

### Your First Code Contribution

Unsure where to begin contributing? You can start by looking through these issues:

- Issues labeled `good first issue` - should only require a few lines of code
- Issues labeled `help wanted` - more involved but accessible

### Pull Requests

1. Fork the repo and create your branch from `develop`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code follows the style guidelines
6. Issue that pull request!

## Development Process

1. **Set up your development environment**
   ```bash
   git clone https://github.com/your-username/greater.git
   cd greater
   npm install
   npm run dev
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Write code following our [Developer Guidelines](DEVELOPER_GUIDELINES.md)
   - Add tests for new functionality
   - Update documentation as needed

4. **Run checks locally**
   ```bash
   npm run ci
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat(scope): description of change"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Open a Pull Request**
   - Use the PR template
   - Link related issues
   - Request reviews from maintainers

## Styleguides

### Git Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only changes
- `style`: Code style changes (formatting, etc)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding missing tests
- `chore`: Changes to the build process or auxiliary tools

### TypeScript Styleguide

- Use TypeScript for all new code
- Enable strict mode
- Prefer interfaces over types for object shapes
- Use explicit return types for public APIs
- Document complex functions with JSDoc

### Component Styleguide

- Use Astro for static components
- Use Svelte exclusively for interactive islands
- Follow the single responsibility principle
- Include accessibility attributes
- Write unit tests for component logic

## Testing

- Write unit tests for utilities and business logic
- Write component tests for UI components
- Write E2E tests for critical user paths
- Maintain >80% code coverage

## Documentation

- Update the README.md if needed
- Add JSDoc comments for public APIs
- Update the changelog for notable changes
- Include examples for new features

## Community

- Join our [Discord server](https://discord.gg/greater)
- Follow [@greater@mastodon.social](https://mastodon.social/@greater)
- Participate in [GitHub Discussions](https://github.com/greater-social/greater/discussions)

## Recognition

Contributors will be recognized in:
- The project README
- Release notes
- Our website's contributors page

Thank you for contributing to Greater! 🎉