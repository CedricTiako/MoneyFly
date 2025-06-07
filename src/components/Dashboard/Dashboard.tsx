import React, { useState, useEffect } from 'react';
import { 
  PiggyBank, 
  TrendingUp, 
  TrendingDown, 
  Target,
  Calendar,
  Plus,
  Sparkles,
  Brain,
  Zap
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Budget, Depense, Objectif } from '../../lib/supabase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FinancialInsights } from './FinancialInsights';

export function Dashboard() {
  const { user, profile } = useAuth();
  const [currentBudget, setCurrentBudget] = useState<Budget | null>(null);
  const [recentExpenses, setRecentExpenses] = useState<Depense[]>([]);
  const [objectives, setObjectives] = useState<Objectif[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInsights, setShowInsights] = useState(false);

  const currentMonth = format(new Date(), 'yyyy-MM');

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      // Charger le budget du mois actuel
      const { data: budgetData } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('mois', currentMonth)
        .single();

      if (budgetData) {
        setCurrentBudget(budgetData);
      } else {
        // Créer un budget par défaut pour le mois actuel
        const { data: newBudget } = await supabase
          .from('budgets')
          .insert([{
            user_id: user.id,
            mois: currentMonth,
            revenu: 0,
            total_depense: 0,
            total_epargne: 0
          }])
          .select()
          .single();

        if (newBudget) {
          setCurrentBudget(newBudget);
        }
      }

      // Charger les dépenses récentes
      const { data: expensesData } = await supabase
        .from('depenses')
        .select(`
          *,
          categories (nom, couleur, icone)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (expensesData) {
        setRecentExpenses(expensesData);
      }

      // Charger les objectifs
      const { data: objectivesData } = await supabase
        .from('objectifs')
        .select('*')
        .eq('user_id', user.id)
        .eq('statut', 'en_cours')
        .order('created_at', { ascending: false })
        .limit(3);

      if (objectivesData) {
        setObjectives(objectivesData);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Chargement de votre univers financier...</p>
        </div>
      </div>
    );
  }

  const budgetUtilise = currentBudget?.total_depense || 0;
  const revenu = currentBudget?.revenu || 0;
  const epargne = currentBudget?.total_epargne || 0;
  const restant = revenu - budgetUtilise - epargne;

  return (
    <div className="space-y-8">
      {/* Header avec animation */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center space-x-3">
                <Sparkles className="w-10 h-10 animate-pulse" />
                <span>Tableau de Bord Intelligent</span>
              </h1>
              <p className="text-blue-100 text-lg">
                {format(new Date(), 'MMMM yyyy', { locale: fr })} • Bonjour {profile?.nom} 👋
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowInsights(!showInsights)}
                className="bg-white bg-opacity-20 backdrop-blur-sm px-6 py-3 rounded-xl font-medium hover:bg-opacity-30 transition-all duration-200 flex items-center space-x-2"
              >
                <Brain className="w-5 h-5" />
                <span>{showInsights ? 'Masquer' : 'Insights IA'}</span>
              </button>
              <div className="flex items-center space-x-2 bg-white bg-opacity-20 backdrop-blur-sm px-4 py-2 rounded-xl">
                <Calendar className="w-5 h-5" />
                <span className="font-medium">
                  {format(new Date(), 'dd MMMM yyyy', { locale: fr })}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Particules animées */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white bg-opacity-30 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Insights IA (conditionnel) */}
      {showInsights && (
        <div className="transform transition-all duration-500 ease-in-out">
          <FinancialInsights />
        </div>
      )}

      {/* Stats Cards avec animations améliorées */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="group bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 text-white transform hover:scale-105 transition-all duration-300 hover:shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 font-medium">Revenus</p>
              <p className="text-3xl font-bold">{formatCurrency(revenu)} FCFA</p>
              <div className="flex items-center mt-2 text-emerald-200">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span className="text-sm">+5.2% ce mois</span>
              </div>
            </div>
            <div className="bg-white bg-opacity-20 p-4 rounded-xl group-hover:rotate-12 transition-transform duration-300">
              <TrendingUp className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="group bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl p-6 text-white transform hover:scale-105 transition-all duration-300 hover:shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 font-medium">Dépenses</p>
              <p className="text-3xl font-bold">{formatCurrency(budgetUtilise)} FCFA</p>
              <div className="flex items-center mt-2 text-red-200">
                <TrendingDown className="w-4 h-4 mr-1" />
                <span className="text-sm">-2.1% vs prévu</span>
              </div>
            </div>
            <div className="bg-white bg-opacity-20 p-4 rounded-xl group-hover:rotate-12 transition-transform duration-300">
              <TrendingDown className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="group bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white transform hover:scale-105 transition-all duration-300 hover:shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 font-medium">Épargne</p>
              <p className="text-3xl font-bold">{formatCurrency(epargne)} FCFA</p>
              <div className="flex items-center mt-2 text-blue-200">
                <Zap className="w-4 h-4 mr-1" />
                <span className="text-sm">{((epargne/revenu)*100).toFixed(1)}% du revenu</span>
              </div>
            </div>
            <div className="bg-white bg-opacity-20 p-4 rounded-xl group-hover:rotate-12 transition-transform duration-300">
              <PiggyBank className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="group bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white transform hover:scale-105 transition-all duration-300 hover:shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 font-medium">Disponible</p>
              <p className="text-3xl font-bold">{formatCurrency(restant)} FCFA</p>
              <div className="flex items-center mt-2 text-amber-200">
                <Target className="w-4 h-4 mr-1" />
                <span className="text-sm">Fin de mois</span>
              </div>
            </div>
            <div className="bg-white bg-opacity-20 p-4 rounded-xl group-hover:rotate-12 transition-transform duration-300">
              <Target className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Dépenses récentes avec design amélioré */}
        <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-white" />
              </div>
              <span>Dépenses récentes</span>
            </h2>
            <button className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-all">
              Voir tout
            </button>
          </div>

          {recentExpenses.length > 0 ? (
            <div className="space-y-4">
              {recentExpenses.map((expense, index) => (
                <div 
                  key={expense.id} 
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl hover:from-blue-50 hover:to-purple-50 transition-all duration-300 transform hover:scale-102"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 bg-gradient-to-r from-${expense.categories?.couleur || 'gray'}-400 to-${expense.categories?.couleur || 'gray'}-600 rounded-xl flex items-center justify-center shadow-lg`}>
                      <span className="text-white text-lg">💰</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {expense.description || 'Dépense'}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center space-x-2">
                        <span>{expense.categories?.nom || 'Non catégorisé'}</span>
                        <span>•</span>
                        <span>{format(new Date(expense.date_depense), 'dd MMM', { locale: fr })}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600 text-lg">
                      -{formatCurrency(expense.montant)} FCFA
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingDown className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg mb-2">Aucune dépense enregistrée</p>
              <button className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
                Ajouter une dépense
              </button>
            </div>
          )}
        </div>

        {/* Objectifs avec design amélioré */}
        <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <span>Objectifs d'épargne</span>
            </h2>
            <button className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-110">
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {objectives.length > 0 ? (
            <div className="space-y-6">
              {objectives.map((objective, index) => {
                const progress = (objective.montant_actuel / objective.montant_cible) * 100;
                return (
                  <div 
                    key={objective.id} 
                    className="p-5 border-2 border-gray-100 rounded-xl hover:border-blue-200 transition-all duration-300 hover:shadow-lg"
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-gray-900 text-lg">{objective.titre}</h3>
                      <span className="text-sm font-semibold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                        {progress.toFixed(1)}%
                      </span>
                    </div>
                    <div className="mb-3">
                      <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full h-3 transition-all duration-1000 ease-out shadow-lg"
                          style={{ 
                            width: `${Math.min(progress, 100)}%`,
                            boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">{formatCurrency(objective.montant_actuel)} FCFA</span>
                      <span className="font-medium text-gray-700">{formatCurrency(objective.montant_cible)} FCFA</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-r from-green-200 to-emerald-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Aucun objectif défini</h3>
              <p className="text-gray-500 mb-6">Créez votre premier objectif d'épargne</p>
              <button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105">
                Créer un objectif
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}