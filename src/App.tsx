import { Route, Routes} from 'react-router-dom'
import './App.css'

import AuthLayout from './_auth/AuthLayout'
import SignInForm from './_auth/form/SignInForm'
import SignUpForm from './_auth/form/SignUpForm'
import RootLayout from './_root/RootLayout'
import Home from './_root/Route/Home'
import AuthorManament from './_root/Route/AuthorManament'
import WorkManament from './_root/Route/WorkManament'
import InstitutionManament from './_root/Route/institutionsManament'
import AwardManament from './_root/Route/AwardManament'

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
          <Route index element={<Home />} />
          <Route path='/Author' element={<AuthorManament />} />
          <Route path='/Work' element={<WorkManament />} />
          <Route path='/Institution' element={<InstitutionManament />} />
          <Route path='/Award' element={<AwardManament />} />
        </Route>
      </Routes>
    </main>
  )
}

export default App
