'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sendOTP, verifyOTP } from '@/lib/loginapi';
import { AuthManager, BACKENDS, BACKEND_CONFIG } from '@/lib/auth-manager';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState('backend');
  const [selectedBackend, setSelectedBackend] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBackendSelect = (backend) => {
    setSelectedBackend(backend);
    setStep('email');
    setError('');
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await sendOTP(email, selectedBackend);
    
    if (result.success) {
      setStep('otp');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await verifyOTP(email, otp, selectedBackend);
    
    if (result.success) {
       AuthManager.cleanupOldTokens();
      AuthManager.setToken(selectedBackend, result.data.token);
      AuthManager.setRole(selectedBackend, result.data.role);
      AuthManager.setUser(selectedBackend, result.data.user);
      AuthManager.setCurrentBackend(selectedBackend);
      router.push('/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const getColorClasses = () => {
    const color = BACKEND_CONFIG[selectedBackend]?.color || 'blue';
    const colorMap = {
      blue: 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 ring-blue-500',
      purple: 'from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 ring-purple-500',
      green: 'from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 ring-green-500'
    };
    return colorMap[color];
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Super Admin Panel</h1>
          <p className="text-gray-600 mt-2">
            {step === 'backend' && 'Select your backend to manage'}
            {step === 'email' && `Sign in to ${BACKEND_CONFIG[selectedBackend]?.name}`}
            {step === 'otp' && 'Enter the OTP sent to your email'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {step === 'backend' && (
            <div className="space-y-4">
              {Object.entries(BACKEND_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => handleBackendSelect(key)}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-gray-400 hover:shadow-md transition-all text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-gray-700">
                        {config.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">{config.url}</p>
                    </div>
                    <svg className="w-6 h-6 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Enter your email"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 bg-gradient-to-r ${getColorClasses()} text-white font-medium rounded-lg disabled:opacity-50 transition-all`}
              >
                {loading ? 'Sending OTP...' : 'Continue'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('backend'); setEmail(''); setError(''); }}
                className="w-full py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                ← Back to backend selection
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                  maxLength="6"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center text-2xl tracking-widest"
                  placeholder="000000"
                />
                <p className="text-sm text-gray-600 mt-2 text-center">
                  Sent to <span className="font-medium text-gray-900">{email}</span>
                </p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 bg-gradient-to-r ${getColorClasses()} text-white font-medium rounded-lg disabled:opacity-50 transition-all`}
              >
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('email'); setOtp(''); setError(''); }}
                className="w-full py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                ← Back to email
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}