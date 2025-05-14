import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/components/AuthProvider'

// Optimize font loading
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
})

export const metadata = {
  title: 'InstaClone',
  description: 'A social media platform for sharing photos',
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#ffffff',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Preconnect to domains for faster resource loading */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        
        {/* Preload critical assets */}
        <link 
          rel="preload" 
          href="/logo.svg" 
          as="image" 
          type="image/svg+xml"
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}