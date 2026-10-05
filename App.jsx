import { Navigate, Route, Routes } from 'react-router-dom'
import Navigator from './app/Navigator'
import Chrome from './app/Chrome'
import FullscreenGate from './app/FullscreenGate'
import { useNav } from './app/nav'
import { usePointerDrift } from './hooks/usePointerDrift'
import Landing from './screens/Landing'
import Menu from './screens/Menu'
import Overview from './screens/Overview'
import Residences from './screens/Residences'
import Amenities from './screens/Amenities'
import Views from './screens/Views'
import Location from './screens/Location'
import Specifications from './screens/Specifications'
import Enquire from './screens/Enquire'

function Stage() {
  const { shown } = useNav()
  return (
    <main className="fixed inset-0 overflow-hidden">
      {/* renders the location the curtain has committed to, not the live URL */}
      <Routes location={shown}>
        <Route path="/" element={<Landing />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/overview" element={<Overview />} />
        <Route path="/residences" element={<Residences />} />
        <Route path="/amenities" element={<Amenities />} />
        <Route path="/views" element={<Views />} />
        <Route path="/location" element={<Location />} />
        <Route path="/specifications" element={<Specifications />} />
        <Route path="/enquire" element={<Enquire />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  )
}

export default function App() {
  usePointerDrift()
  return (
    <Navigator>
      <Stage />
      <Chrome />
      <FullscreenGate />
      <div className="grain pointer-events-none fixed inset-0 z-95 hidden opacity-[0.22] mix-blend-soft-light pointer-fine:block" aria-hidden="true" />
    </Navigator>
  )
}
