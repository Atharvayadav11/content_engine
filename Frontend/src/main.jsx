import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, useNavigate } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import { ClerkProvider } from '@clerk/clerk-react'
import App from "./App.jsx"
import "./index.css"

// Import your publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  console.error("Missing VITE_CLERK_PUBLISHABLE_KEY environment variable")
  // Don't throw error in production, show a message instead
}

function ClerkProviderWithRouter({ children }) {
  const navigate = useNavigate()
  
  return (
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      navigate={(to) => {
        console.log('🔄 Clerk navigate called with:', to)
        if (to === '/dashboard') {
          // Force a full page reload to dashboard
          window.location.href = '/dashboard'
        } else {
          navigate(to)
        }
      }}
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
      signInUrl="/sign-in"
      signUpUrl="/sign-in"
    >
      {children}
    </ClerkProvider>
  )
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ClerkProviderWithRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#363636",
              color: "#fff",
            },
          }}
        />
      </ClerkProviderWithRouter>
    </BrowserRouter>
  </React.StrictMode>,
)
