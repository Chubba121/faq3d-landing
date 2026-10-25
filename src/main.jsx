import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// El pedido del CSV de Google Sheets arranca en el index.html (script inline),
// antes de que se descargue este bundle: la red y la descarga del resto de los
// recursos avanzan en paralelo y el catálogo aparece en el primer frame.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
