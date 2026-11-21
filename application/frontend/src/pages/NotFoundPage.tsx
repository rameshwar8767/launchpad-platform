import React from 'react'
import { Link } from 'react-router-dom'
import { Rocket, ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui/Button'

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center mb-6">
        <Rocket className="w-8 h-8" />
      </div>

      <h1 className="text-6xl font-black text-white tracking-tight">404</h1>
      <h2 className="text-lg font-bold text-slate-200 mt-2">Workload Target Not Found</h2>
      <p className="text-sm text-slate-400 max-w-md mt-2 mb-8">
        The route or resource you requested does not exist or has been relocated within the
        LaunchPad Platform cluster.
      </p>

      <Link to="/dashboard">
        <Button variant="primary">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to Dashboard
        </Button>
      </Link>
    </div>
  )
}
