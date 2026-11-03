import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// Floor Plans is now part of Residences: an old link opens the same view there
if (/^\/floorplans\/?$/.test(location.pathname)) history.replaceState(history.state, '', `/residences${location.search}`)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
