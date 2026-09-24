import { Navigate, Route, Routes } from 'react-router-dom'
import Navigator from './app/Navigator'
import Chrome from './app/Chrome'
import FullscreenGate from './app/FullscreenGate'
import { useNav } from './app/nav'
import { usePointerDrift } from './hooks/usePointerDrift'
import Landing from './screens/Landing'
import Home from './screens/Home'
import Overview from './screens/Overview'
import Residences from './screens/Residences'
import Amenities from './screens/Amenities'
import Views from './screens/Views'
import Location from './screens/Location'
import Specifications from './screens/Specifications'
import Enquire from './screens/Enquire'

function Screen({ location }) {
  return (
    <Routes location={location}>
      <Route path="/" element={<Landing />} />
      <Route path="/home" element={<Home />} />
      <Route path="/menu" element={<Navigate to="/home" replace />} />
      <Route path="/overview" element={<Overview />} />
      <Route path="/residences" element={<Residences />} />
      <Route path="/amenities" element={<Amenities />} />
      <Route path="/views" element={<Views />} />
      <Route path="/location" element={<Location />} />
      <Route path="/specifications" element={<Specifications />} />
      <Route path="/enquire" element={<Enquire />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function Stage() {
  const { stage } = useNav()
  // while a transition runs the outgoing screen stays mounted underneath the incoming one
  const layers = stage.prev ? [stage.prev, stage.cur] : [stage.cur]
  return (
    <main className="fixed inset-0 overflow-hidden">
      {layers.map((loc) => (
        <div key={loc.key} data-layer={loc.key} className={`absolute inset-0 ${loc === stage.cur ? '' : 'pointer-events-none'}`}>
          <Screen location={loc} />
        </div>
      ))}
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
