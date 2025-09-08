# CarrierHub - Frontend

A modern Next.js 14 application for booking career consultation services with expert consultants.

## Features

- **Modern UI**: Built with Next.js 14, TailwindCSS, and shadcn/ui components
- **Dark/Light Mode**: Theme toggle with next-themes
- **Authentication**: Student signup and login with form validation
- **Booking System**: Complete booking flow with Razorpay payment integration
- **Dashboard**: Student dashboard to manage bookings and track status
- **Admin Panel**: Admin interface to manage bookings and update consultant status
- **Responsive Design**: Mobile-first design that works on all devices

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui + Radix UI
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod validation
- **Theme**: next-themes
- **Payments**: Razorpay
- **Animations**: Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running on `https://carrierhub-backend.onrender.com/api`

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd carrierhub
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

4. Update `.env.local` with your configuration:
```env
NEXT_PUBLIC_API_URL=https://carrierhub-backend.onrender.com/api
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id_here
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin panel
│   ├── book/[categoryId]/ # Booking flow
│   ├── dashboard/         # Student dashboard
│   ├── login/             # Login page
│   ├── signup/            # Signup page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   ├── navbar.tsx        # Navigation component
│   ├── theme-provider.tsx # Theme provider
│   └── theme-toggle.tsx  # Theme toggle component
└── lib/                  # Utilities
    ├── api.ts            # API client
    └── utils.ts          # Utility functions
```

## Pages & Features

### Home Page (`/`)
- Hero section with tagline
- Grid of consultancy categories
- Features section
- Responsive design

### Authentication (`/signup`, `/login`)
- Form validation with Zod
- JWT token storage
- Redirect to dashboard after login

### Booking Flow (`/book/[categoryId]`)
- Category-specific booking form
- Razorpay payment integration
- Form validation
- Authentication check

### Dashboard (`/dashboard`)
- View all bookings
- Filter by status (All, Pending, Completed)
- Payment and consultant status badges
- Statistics cards

### Admin Panel (`/admin`)
- View all bookings
- Search and filter functionality
- Update booking status
- Revenue tracking
- Simple password authentication

## API Integration

The app integrates with a backend API at `https://carrierhub-backend.onrender.com/api` with the following endpoints:

### Authentication
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login

### Bookings
- `POST /book` - Create booking
- `POST /book/verify` - Verify payment
- `GET /dashboard` - Get user bookings

### Admin
- `GET /admin/bookings` - Get all bookings
- `PATCH /admin/bookings/:id/status` - Update booking status

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay Key ID | Yes |

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Style

- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- TailwindCSS for styling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@carrierhub.com or create an issue in the repository.# carrierHub-FrontEnd
