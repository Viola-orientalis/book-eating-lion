import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { installMockDevTools } from './api/mockDevTools'
import { installDevAdminTools } from './utils/adminAccess'

if (import.meta.env.DEV) {
  installMockDevTools()
  // TODO: 배포 전 제거 필요 — window.enableDevAdmin()/disableDevAdmin() 개발 편의 오버라이드
  installDevAdminTools()
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
