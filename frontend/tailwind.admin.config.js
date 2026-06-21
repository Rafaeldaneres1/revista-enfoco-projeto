const baseConfig = require('./tailwind.config');

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...baseConfig,
  content: [
    './src/AdminApp.jsx',
    './src/pages/Admin*.jsx',
    './src/components/Admin*.jsx',
    './src/components/PrivateRoute.jsx',
    './src/components/RichTextEditor.jsx',
    './src/context/AuthContext.jsx'
  ]
};
