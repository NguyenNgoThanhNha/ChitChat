import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { SocketProvider } from './contexts/SocketContext.jsx'
import { ThemeProvider } from 'next-themes'
import { ThemedToaster } from './components/ThemedToaster.jsx'
import GlobalConfirmDialog from './components/GlobalConfirmDialog.jsx'

createRoot(document.getElementById('root')).render(
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem storageKey="syncronus-ui-theme" disableTransitionOnChange>
    <SocketProvider>
      <App />
      <ThemedToaster />
      <GlobalConfirmDialog />
    </SocketProvider>
  </ThemeProvider>
)
