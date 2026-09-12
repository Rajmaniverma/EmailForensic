import React from 'react'

const App = () => {
  return (
  
      <Routes>
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
<Route path="/terms" element={<Terms />} />
      </Routes>

    
  )
}

export default App