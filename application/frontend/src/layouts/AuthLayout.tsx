import React from 'react'
import { Outlet, Link } from 'react-router-dom'
import { Rocket } from 'lucide-react'

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-indigo-500 selection:text-white">
      {/* Background radial gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/40 group-hover:scale-105 transition-transform">
              <Rocket className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">
              Launch<span className="text-indigo-400">Pad</span>
            </span>
          </Link>
          <p className="text-xs text-slate-400 mt-2 uppercase tracking-widest font-semibold">
            Enterprise Task Management & DevOps Workload
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-7 shadow-2xl backdrop-blur-md">
          <Outlet />
        </div>

        <div className="text-center mt-6">
          <p className="text-xs text-slate-500">
            &copy; 2026 LaunchPad Platform &middot; Designed for Cloud-Native Workloads
          </p>
        </div>
      </div>
    </div>
  )
}
