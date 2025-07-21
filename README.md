# Laurence Belzile Portfolio Website

A React-based portfolio webs### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   # Create .env file with:
   REACT_APP_FUNCTION_URL=your_netlify_functions_url
   ```

4. Start development server:
   ```bash
   npm start
   ```t Laurence Belzile, featuring an elegant gallery of artwork with multilingual support and integrated e-commerce functionality.

## Features

- **Responsive Portfolio Gallery**: Browse artwork with lazy loading, image optimization, and touch/swipe navigation
- **Multilingual Support**: Full French/English internationalization using react-i18next
- **Project Details**: Individual project pages with metadata (technique, dimensions, year, availability)
- **E-commerce Integration**: Purchase inquiries and availability tracking
- **Email Newsletter**: Subscription functionality with AWS backend integration
- **SEO Optimized**: React Helmet for meta tags and social media sharing
- **Interactive Navigation**: Touch gestures, keyboard shortcuts, and year-based anchoring
- **Contact & Resume**: Dedicated pages with social media integration and downloadable CV

## Tech Stack

- **Frontend**: React 16.9, React Router, Emotion (CSS-in-JS)
- **UI Components**: Ant Design, React Bootstrap
- **Animations**: React Spring, React Reveal
- **Internationalization**: i18next, react-i18next
- **Backend**: Netlify Functions (TypeScript)
- **Database**: AWS DynamoDB (email subscriptions)
- **Monitoring**: AWS CloudWatch
- **Deployment**: Netlify

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── NavBar.jsx      # Navigation with language switching
│   ├── Project.jsx     # Gallery project thumbnail
│   ├── ProjectAvailability.jsx  # Purchase/availability status
│   └── lib/            # Styled components library
├── pages/              # Route components
│   ├── Work.jsx        # Main gallery with filtering
│   ├── Project.jsx     # Individual project view
│   ├── Contact.jsx     # Contact form and social links
│   ├── Info.jsx        # Artist biography
│   └── Resume.jsx      # CV/resume page
├── hooks/              # Custom React hooks
│   └── useProjects.jsx # Project data management
├── service/            # API integrations
│   └── email-service.js # Newsletter subscription
├── utils/              # Helper functions
├── data/               # JSON data files (projects, resume)
├── i18n/               # Translation files (en.json, fr.json)
└── constants/          # App constants (routes, folders)

functions/              # Netlify serverless functions
├── email/              # Email subscription handler
└── utils/              # AWS integrations

public/
├── projects/           # Artwork images
├── resume/             # CV files
└── ...                 # Static assets
```

## Getting Started

### Prerequisites
- Node.js (>= 14.x)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   # Create .env file with:
   REACT_APP_FUNCTION_URL=your_netlify_functions_url
   ```

4. Start development server:
   ```bash
   npm start
   ```

## Development Commands

- `npm start` - Development server
- `npm build` - Production build  
- `npm test` - Run tests

## Key Features Implementation

### Gallery System
- Projects loaded from JSON data with lazy loading
- Multiple image support per project
- Touch/swipe navigation with React Spring animations
- Year-based filtering and anchor navigation

### Internationalization
- Dynamic language switching (French/English)
- Localized content for all text, including project descriptions
- Browser language detection

### E-commerce Integration
- Project availability status tracking
- Direct purchase inquiry links with pre-filled subject lines
- Price display with currency formatting

### Backend Integration
- Serverless functions for email subscriptions
- AWS DynamoDB for data persistence
- CloudWatch monitoring and metrics

## Deployment

The application is deployed on Netlify with:
- Automatic builds from the repository
- Serverless functions for backend functionality
- Environment variable configuration for AWS services


