import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import StockSection from './components/StockSection.jsx'
import CatalogSection from './components/CatalogSection.jsx'
import HowToBuy from './components/HowToBuy.jsx'
import ShippingBanner from './components/ShippingBanner.jsx'
import Footer from './components/Footer.jsx'
import WhatsAppFab from './components/WhatsAppFab.jsx'
import CartDrawer from './components/CartDrawer.jsx'
import CartNotice from './components/CartNotice.jsx'
import { CatalogProvider } from './context/CatalogContext.jsx'
import { CartProvider } from './context/CartContext.jsx'

export default function App() {
  return (
    <CatalogProvider>
      <CartProvider>
      <div className="relative min-h-screen overflow-x-hidden">
      <a
        href="#stock"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-sky-500 focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
      >
        Ir al stock disponible
      </a>

      <Navbar />

      <main>
        <Hero />
        <StockSection />
        <CatalogSection />
        <HowToBuy />
        <ShippingBanner />
      </main>

        <Footer />
        <WhatsAppFab />
        <CartDrawer />
        <CartNotice />
      </div>
      </CartProvider>
    </CatalogProvider>
  )
}
