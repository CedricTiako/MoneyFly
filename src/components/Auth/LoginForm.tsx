import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogIn, UserPlus, Mail, Lock, User, Shield, ArrowLeft, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export function LoginForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otpType, setOtpType] = useState<'signup' | 'recovery'>('signup');

  const { signIn, signUp, verifyOtp, resendOtp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        const { data, error } = await signIn(email, password);
        if (error) {
          if (error.needsVerification) {
            setShowOtpVerification(true);
            setOtpType('signup');
            setError('');
            setSuccess('Veuillez entrer le code de vérification envoyé à votre email.');
          } else {
            setError(error.message);
          }
        }
      } else {
        const { data, error, needsVerification } = await signUp(email, password, nom);
        if (error) {
          setError(error.message);
        } else if (needsVerification) {
          setShowOtpVerification(true);
          setOtpType('signup');
          setSuccess('Compte créé ! Un code de vérification a été envoyé à votre email.');
        }
      }
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Le code doit contenir 6 chiffres');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data, error } = await verifyOtp(email, otp, otpType);
      if (error) {
        setError(error.message);
      } else {
        setSuccess('Email vérifié avec succès ! Connexion en cours...');
        // La connexion se fera automatiquement via onAuthStateChange
        setTimeout(() => {
          setShowOtpVerification(false);
        }, 1500);
      }
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la vérification');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data, error } = await resendOtp(email, otpType);
      if (error) {
        setError(error.message);
      } else {
        setSuccess('Un nouveau code a été envoyé à votre email.');
      }
    } catch (error: any) {
      setError(error.message || 'Erreur lors du renvoi du code');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setShowOtpVerification(false);
    setOtp('');
    setError('');
    setSuccess('');
  };

  const formatOtpInput = (value: string) => {
    // Ne garder que les chiffres et limiter à 6 caractères
    const numbers = value.replace(/\D/g, '').slice(0, 6);
    return numbers;
  };

  if (showOtpVerification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 rounded-xl inline-block mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Vérification Email</h1>
            <p className="text-gray-600 mt-2">
              Entrez le code de vérification envoyé à
            </p>
            <p className="text-blue-600 font-medium break-all">{email}</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{success}</span>
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
                onChange={(e) => setOtp(formatOtpInput(e.target.value))}
                className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-mono tracking-[0.5em] placeholder-gray-300"
                placeholder="000000"
                maxLength={6}
                autoComplete="one-time-code"
                required
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Code à 6 chiffres • Expire dans 10 minutes
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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

          <div className="mt-6 space-y-3">
            <button
              onClick={handleResendOtp}
              disabled={loading}
              className="w-full flex items-center justify-center text-blue-600 hover:text-blue-700 font-medium py-2 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Renvoyer le code
            </button>
            
            <button
              onClick={resetForm}
              className="w-full flex items-center justify-center text-gray-600 hover:text-gray-700 font-medium py-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à la connexion
            </button>
          </div>

          {/* Conseils de dépannage */}
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">Code non reçu ?</h3>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>• Vérifiez votre dossier spam/courrier indésirable</li>
              <li>• Attendez 2-3 minutes (délai de livraison)</li>
              <li>• Vérifiez que l'adresse email est correcte</li>
              <li>• Utilisez "Renvoyer le code" si nécessaire</li>
            </ul>
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
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-start space-x-2">
            <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{success}</span>
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
            {!isLogin && (
              <p className="text-xs text-gray-500 mt-1">
                Minimum 6 caractères
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {isLogin ? 'Connexion...' : 'Création...'}
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
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setSuccess('');
            }}
            className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            {isLogin ? "Pas de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
          </button>
        </div>

        {!isLogin && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-2">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Vérification sécurisée</p>
                <p>Après inscription, vous recevrez un code de vérification par email pour sécuriser votre compte.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}