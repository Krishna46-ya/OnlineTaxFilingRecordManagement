import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import { Signup } from './pages/signup'
import { Signin } from './pages/signin'
import SignupForm from './pages/SignupForm'

function App() {

    return (
        <>
            <BrowserRouter>
            <Routes>
                <Route element={<Signup></Signup>} path='/signup'></Route>
                <Route element={<Signin></Signin>} path='/signin'></Route>
                <Route element={<SignupForm></SignupForm>} path='/'></Route>
            </Routes>
            </BrowserRouter>
        </>
    )
}

export default App
