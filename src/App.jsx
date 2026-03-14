import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import BlogPost from './pages/BlogPost'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            {/* 404 */}
            <Route
              path="*"
              element={
                <main className="flex-1 flex items-center justify-center min-h-[60vh] px-4">
                  <div className="text-center">
                    <p className="text-5xl font-semibold text-gray-200 mb-4">404</p>
                    <h1 className="text-xl font-semibold text-gray-900 mb-2">Page not found</h1>
                    <p className="text-gray-500 mb-6">The page you're looking for doesn't exist.</p>
                    <a href="/" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                      Go home 
                    </a>
                  </div>
                </main>
              }
            />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  )
}