import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import  Signup  from './pages/signup'
import  Signin  from './pages/signin'
import TaxPortal from './pages/TaxPortal'
import Dashboard from './pages/dashboard'

function App() {

    return (
        <>
            <BrowserRouter>
            <Routes>
                <Route element={<Signup></Signup>} path='/signup'></Route>
                <Route element={<Signin></Signin>} path='/signin'></Route>
                <Route element={<TaxPortal></TaxPortal>} path='/'></Route>
                <Route element={<Dashboard></Dashboard>} path='/dashboard'></Route>
            </Routes>
            </BrowserRouter>
        </>
    )
}

export default App
