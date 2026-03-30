# Mark System

A modern student management system built with React, TypeScript, and Firebase.

## Features

- Student enrollment and management
- Subject management
- Announcement system
- Secure authentication
- Responsive design
- Real-time updates
- Role-based access control

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account
- Modern web browser

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mark-system.git
cd mark-system
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory and add your Firebase configuration:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

## Project Structure

```
src/
├── components/     # Reusable components
├── pages/         # Page components
├── utils/         # Utility functions
├── contexts/      # React contexts
├── types/         # TypeScript types
└── assets/        # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

## Security Features

- CORS protection
- Security headers
- XSS protection
- CSRF protection
- Rate limiting
- Input sanitization

## Performance Optimizations

- Code splitting
- Lazy loading
- Image optimization
- Caching strategies
- Bundle size optimization

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@marksystem.com or create an issue in the repository.
