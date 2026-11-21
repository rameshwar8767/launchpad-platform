import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { AlertCircle } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

export const LoginPage: React.FC = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null)
    try {
      await login(data)
      navigate('/dashboard')
    } catch (err: any) {
      setServerError(err.message || 'Authentication failed. Please check credentials.')
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white tracking-tight">Operator Sign In</h2>
        <p className="text-xs text-slate-400 mt-1">
          Authenticate to manage workloads and track system tasks.
        </p>
      </div>

      {serverError && (
        <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Input
            label="Email Address"
            type="email"
            placeholder="operator@launchpad.io"
            error={errors.email?.message}
            {...register('email')}
          />
        </div>

        <div>
          <Input
            label="Password"
            type="password"
            placeholder="••••••••••••"
            error={errors.password?.message}
            {...register('password')}
          />
        </div>

        <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isSubmitting}>
          Sign In to Platform
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
        <p className="text-xs text-slate-400">
          Need a workspace account?{' '}
          <Link
            to="/register"
            className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  )
}
