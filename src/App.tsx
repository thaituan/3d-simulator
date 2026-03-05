import { Navigate, Route, Routes } from 'react-router-dom'
import TopPage from '@/pages/TopPage'
import ProductPage from '@/pages/ProductPage'
import RoomCoordinator from '@/pages/RoomCoordinator'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<TopPage />} />
      <Route path="/product" element={<ProductPage />} />
      <Route path="/simulator" element={<RoomCoordinator />} />
      <Route path="/sofa" element={<Navigate to="/product" replace />} />
      <Route path="/room" element={<Navigate to="/simulator" replace />} />
    </Routes>
  )
}
