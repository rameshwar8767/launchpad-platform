import React from 'react'
import { Card } from '../components/ui/Card'
import { Server, ShieldCheck, Database } from 'lucide-react'

export const SettingsPage: React.FC = () => {
  const apiBase = import.meta.env.VITE_API_BASE_URL || '/api/v1'

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Platform Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Workload configuration and environment diagnostics.
        </p>
      </div>

      <div className="space-y-4">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <Server className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">
              API Connection
            </h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Configured Base URL</span>
              <span className="font-mono text-indigo-300">{apiBase}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Protocol</span>
              <span className="text-slate-200">REST over HTTP / TLS</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Documentation Swagger UI</span>
              <a
                href="http://localhost:8000/docs"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:underline"
              >
                /docs
              </a>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">
              Database Configuration
            </h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Engine</span>
              <span className="text-slate-200">PostgreSQL 16 (ACID Relational)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Migration Pipeline</span>
              <span className="text-slate-200">Alembic (Zero-downtime expand/contract)</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Connection Pooling</span>
              <span className="text-slate-200">QueuePool (Pre-ping enabled, 1800s recycle)</span>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">
              Security Baseline
            </h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Password Encryption</span>
              <span className="text-slate-200">Bcrypt (Cost 12)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Access Token Lifespan</span>
              <span className="text-slate-200">15 Minutes (Short-lived JWT)</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Refresh Token Policy</span>
              <span className="text-slate-200">7 Days (Persisted SHA-256 hash, revocable)</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
