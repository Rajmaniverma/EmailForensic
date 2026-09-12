import React from 'react'
import PrivacyPolicy from './PrivacyPolicy'
import { Routes, Route } from "react-router-dom";
import Terms from './Terms'

const App = () => {
  return (
  <div>
          <Routes>
<Route path="/privacy-policy" element={<PrivacyPolicy />} />
<Route path="/terms" element={<Terms />} />
      </Routes>
  </div>


    
  )
}

export default App