'use client'
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function LoginPage(){
    const [form, setForm] = useState({email: "", password: ""})
    const [message, setMessage] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [errors, setErrors] = useState({email: "", password: ""})
    const router = useRouter()
    const validateForm = () => {
        const newErrors = {email: "", password: ""}
        let isValid = true

        // Email validation
        if (!form.email) {
            newErrors.email = "Email is required"
            isValid = false
        } else if (!/\S+@\S+\.\S+/.test(form.email)) {
            newErrors.email = "Please enter a valid email address"
            isValid = false
        }

        // Password validation
        if (!form.password) {
            newErrors.password = "Password is required"
            isValid = false
        } else if (form.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters"
            isValid = false
        }

        setErrors(newErrors)
        return isValid
    }

    const handleSubmit = async(e: React.FormEvent) => {
        e.preventDefault()
        setMessage("")
        
        if (!validateForm()) {
            return
        }

        setIsLoading(true)

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/login`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                credentials: "include",
                body: JSON.stringify(form)
            })
            
            const data = await res.json()
            
            if (res.ok) {
                setMessage("Login successful! Redirecting...")
                // Redirect to home page after successful login
                router.push("/dashboard")
            } else {
                setMessage(data.error || "Login failed")
            }
        } catch (error) {
            setMessage("Network error. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return(
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back</h1>
                    <p className="text-muted-foreground">Please sign in to your account</p>
                </div>

                {/* Form Card */}
                <div className="bg-card rounded-2xl shadow-xl p-8 border border-border">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                                Email Address
                            </label>
                            <input 
                                type="email" 
                                id="email"
                                value={form.email} 
                                onChange={(e) => setForm({...form, email: e.target.value})}
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 bg-background text-foreground ${
                                    errors.email ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'border-border hover:border-border/80'
                                }`}
                                placeholder="Enter your email"
                                disabled={isLoading}
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                                Password
                            </label>
                            <input  
                                type="password" 
                                id="password"
                                value={form.password} 
                                onChange={(e) => setForm({...form, password: e.target.value})}
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 bg-background text-foreground ${
                                    errors.password ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'border-border hover:border-border/80'
                                }`}
                                placeholder="Enter your password"
                                disabled={isLoading}
                            />
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-medium hover:bg-primary/90 focus:ring-4 focus:ring-primary/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>

                        {/* Message Display */}
                        {message && (
                            <div className={`p-4 rounded-lg text-center ${
                                message.includes('successful') 
                                    ? 'bg-green-50 text-green-700 border border-green-200' 
                                    : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                                {message}
                            </div>
                        )}
                    </form>

                    {/* Sign Up Link */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-600">
                            Don't have an account?{' '}
                            <Link href="/sign-up" className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200">
                                Sign up here
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-8">
                    <p className="text-sm text-gray-500">
                        By signing in, you agree to our Terms of Service and Privacy Policy
                    </p>
                </div>
            </div>
        </div>
    )
}