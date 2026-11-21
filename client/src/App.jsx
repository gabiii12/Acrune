import StoreLayout from './components/StoreLayout.jsx'
import { useHashRoute } from './hooks/useHashRoute.js'
import AdminApp from './pages/admin/AdminApp.jsx'
import GuidePage from './pages/store/GuidePage.jsx'
import OrderPage from './pages/store/OrderPage.jsx'
import ServicesPage from './pages/store/ServicesPage.jsx'
import TrackPage from './pages/store/TrackPage.jsx'

// Routes (hash-based, so any static host works):
//   #/              services        #/order/:token   one order
//   #/guide         how it works    #/track          track by code
//   #/admin[/page]  admin dashboard (overview | orders | services)
export default function App() {
  const path = useHashRoute()

  if (path.startsWith('/admin')) return <AdminApp page={path.split('/')[2] || 'overview'} />

  if (path.startsWith('/order/')) return <StoreLayout active="track"><OrderPage token={path.slice('/order/'.length)} /></StoreLayout>
  if (path === '/track') return <StoreLayout active="track"><TrackPage /></StoreLayout>
  if (path === '/guide') return <StoreLayout active="guide"><GuidePage /></StoreLayout>
  return <StoreLayout active="services"><ServicesPage /></StoreLayout>
}
