import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/landing.jsx'
import Authentication from './pages/Authentication.jsx'
import { AuthProvider } from './contexts/AuthContexts.jsx'
import VideoMeet from './pages/VideoMeet.jsx'
import Home from './pages/home.jsx'
import History from './pages/history.jsx'

function App() {
  return (
    <>
    
      <Router>
        <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<Authentication />} />
          <Route path='/:url' element={<VideoMeet/>}/>
          <Route path='/home'element={<Home/>}/>
          <Route path='/history'element={<History/>}/>


        </Routes>
        </AuthProvider>
      </Router>
    </>
  )
}

export default App
