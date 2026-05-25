import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import "./i18n/index.ts"

import App from "./App.tsx"
import "./styles/main.scss"
import { PricingModalProvider } from "./features/subscription/context/PricingModalContext"
import PricingModal from "./features/subscription/components/PricingModal"

ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>
    <BrowserRouter>
      <PricingModalProvider>
        <App />
        <PricingModal />
      </PricingModalProvider>
    </BrowserRouter>
  </React.StrictMode>
)
