import './globals.css'

export const metadata = {
  title: 'SMC Job Board',
  description: "Sylvia's Magic Cleaning - Job Board & Worker Portal",
  manifest: '/manifest.json',
  themeColor: '#1b2d4f',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-brand-bg">
        <div className="max-w-md mx-auto min-h-screen bg-brand-bg relative">
          {children}
        </div>
      </body>
    </html>
  )
}
