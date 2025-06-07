import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogIn, UserPlus, Mail, Lock, User, Shield, ArrowLeft } from 'lucide-react';

export function LoginForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [pendingSession, setPendingSession] = useState<any>(null);

  const { signIn, signUp, verifyOtp, resendOtp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
      } else {
        const { data, error } = await signUp(email, password, nom);
        if (error) throw error;
        
        if (data?.user && !data?.session) {
          // L'utilisateur doit vérifier son email avec OTP
          setShowOtpVerification(true);
          setPendingSession(data);
        }
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await verifyOtp(email, otp, 'signup');
      if (error) throw error;
      
      // La vérification réussie sera gérée par le contexte d'authentification
      setShowOtpVerification(false);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError('');

    try {
      const { error } = await resendOtp(email, 'signup');
      if (error) throw error;
      
      setError(''); // Clear any previous errors
      // Optionally show a success message
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setShowOtpVerification(false);
    setPendingSession(null);
    setOtp('');
    setError('');
  };

  if (showOtpVerification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 rounded-xl inline-block mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Vérification OTP</h1>
            <p className="text-gray-600 mt-2">
              Entrez le code de vérification envoyé à
            </p>
            <p className="text-blue-600 font-medium">{email}</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleOtpVerification} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code de vérification
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono tracking-widest"
                placeholder="000000"
                maxLength={6}
                required
              />
              <p className="text-sm text-gray-500 mt-2">
                Le code expire dans 10 minutes
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Vérification...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Vérifier le code
                </div>
              )}
            </button>
          </form>

          <div className="mt-6 space-y-4">
            <button
              onClick={handleResendOtp}
              disabled={loading}
              className="w-full text-blue-600 hover:text-blue-700 font-medium py-2"
            >
              Renvoyer le code
            </button>
            
            <button
              onClick={resetForm}
              className="w-full flex items-center justify-center text-gray-600 hover:text-gray-700 font-medium py-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-xl inline-block mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isLogin ? 'Connexion' : 'Inscription'}
          </h1>
          <p className="text-gray-600 mt-2">
            Gérez vos finances personnelles
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom complet
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Votre nom complet"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="votre@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Chargement...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                {isLogin ? <LogIn className="w-5 h-5 mr-2" /> : <UserPlus className="w-5 h-5 mr-2" />}
                {isLogin ? 'Se connecter' : "S'inscrire"}
              </div>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            {isLogin ? "Pas de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
          </button>
        </div>

        {!isLogin && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-2">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Vérification par OTP</p>
                <p>Après inscription, vous recevrez un code de vérification par email pour sécuriser votre compte.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}