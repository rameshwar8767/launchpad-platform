import React from 'react'
import { useAuth } from '../context/AuthContext'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { User, Shield, Mail, Key } from 'lucide-react'

export const ProfilePage: React.FC = () => {
  const { user } = useAuth()

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Operator Profile</h1>
        <p className="text-sm text-slate-400 mt-1">
          Identity details and role authorizations in this workspace.
        </p>
      </div>

      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-xl font-bold text-indigo-300">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{user?.full_name}</h2>
            <p className="text-xs text-slate-400">{user?.email}</p>
            <div className="mt-2">
              <Badge variant="info">{user?.role?.toUpperCase() || 'USER'}</Badge>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Account Specifications
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="flex items-center gap-2 text-xs font-medium text-slate-300">
                <User className="w-4 h-4 text-slate-500" />
                Identifier (UUID)
              </span>
              <span className="text-xs font-mono text-slate-400">{user?.id}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="flex items-center gap-2 text-xs font-medium text-slate-300">
                <Mail className="w-4 h-4 text-slate-500" />
                Verified Email
              </span>
              <span className="text-xs text-slate-300">{user?.email}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="flex items-center gap-2 text-xs font-medium text-slate-300">
                <Shield className="w-4 h-4 text-emerald-400" />
                Account Status
              </span>
              <span className="text-xs font-semibold text-emerald-400">Active</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="flex items-center gap-2 text-xs font-medium text-slate-300">
                <Key className="w-4 h-4 text-indigo-400" />
                Authentication Method
              </span>
              <span className="text-xs text-slate-400 font-mono">BCrypt + Stateless JWT</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
