import { Route, Routes } from 'react-router-dom'
import './App.css'

import AuthLayout from './_auth/AuthLayout'
import SignInForm from './_auth/form/SignInForm'
import SignUpForm from './_auth/form/SignUpForm'
import RootLayout from './_root/RootLayout'

function App() {

  return (
    <main className='flex h-screen'>
      <Routes>
        {/* public route */}
        <Route element={<AuthLayout/>}>
          <Route path="/sign-in" element={<SignInForm/>} />
          <Route path="/sign-up" element={<SignUpForm/>} />
        </Route>



        {/* private route */}
        <Route element={<RootLayout />}>

        </Route>
      </Routes>
    </main>
  )
}

export default App
