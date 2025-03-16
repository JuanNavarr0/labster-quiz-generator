# Labster Quiz Generator Frontend

This is the frontend for the Labster Quiz Generator application, developed with React and Vite.

## Complete Project Information

For detailed information about the complete project, including backend setup and deployment instructions, please refer to the [main README in the project root](../README.md).

## Technologies Used

- **React**: Library for building user interfaces
- **Vite**: Build tool that provides a fast development server
- **CSS Modules**: For locally scoped styles

## Quick Setup

1. Install dependencies: `npm install`
2. Start the development server: `npm run dev`
3. Access the application at `http://localhost:5173`

## Frontend Structure

- `src/`: Main source code
  - `App.jsx`: Main component that manages state and logic
  - `App.css`: Styles for the application
  - `main.jsx`: React entry point

## Development Features

Vite provides the following features for development:

- Hot Module Replacement (HMR) for a smooth development experience
- Fast, optimized reloading
- Plugin support

## Available Plugins

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md): Uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc): Uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint Configuration

If you are developing a production application, we recommend using TypeScript and enabling type-aware lint rules. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) into your project.

## Production Build

To build the application for production, run:

```bash
npm run build
```

This will generate an optimized version of the application in the `dist/` directory that can be deployed to any static web server.
