# TechTorio Frontend

This is the frontend application for TechTorio, an escrow payment platform. It's built with React.js and TypeScript.

## Technology Stack

- **Framework**: React.js with TypeScript
- **State Management**: React Context + Hooks pattern
- **API Integration**: Axios with interceptors for JWT token handling and refresh
- **UI Components**: Material UI
- **Routing**: React Router for client-side navigation
- **Form Handling**: React Hook Form + Zod for validation
- **Build System**: Vite for development and production builds

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the Frontend directory
3. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

### Development

To start the development server:

```bash
npm run dev
# or
yarn dev
```

The application will be available at http://localhost:3000.

### Build

To build the application for production:

```bash
npm run build
# or
yarn build
```

The build output will be generated in the `dist` directory.

## Project Structure

- `/src` - Source code
  - `/components` - Reusable UI components
  - `/context` - React Context providers
  - `/hooks` - Custom React hooks
  - `/layouts` - Page layout components
  - `/pages` - Page components
  - `/services` - API services
  - `/types` - TypeScript type definitions
  - `/utils` - Utility functions

## Features

### Phase 1: Authentication and User Management

- User authentication (login/register)
- JWT token management with refresh
- Password reset
- User profile management
- Role-based UI rendering

## Development Guidelines

- Follow the component-based architecture
- Keep components small and focused
- Use TypeScript for type safety
- Follow Material UI design patterns
- Test components for accessibilitypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
