import React, { useState, useEffect } from 'react';
import { 
  PiggyBank, 
  TrendingUp, 
  TrendingDown, 
  Target,
  Calendar,
  Plus
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Budget, Depense, Objectif } from '../../lib/supabase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function Dashboard() {
  const { user, profile } = useAuth();
  const [currentBudget, setCurrentBudget] = useState<Budget | null>(null);
  const [recentExpenses, setRecentExpenses] = useState<Depense[]>([]);
  const [objectives, setObjectives] = useState<Objectif[]>([]);
  const [loading, setLoading] = useState(true);

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const budgetUtilise = currentBudget?.total_depense || 0;
  const revenu = currentBudget?.revenu || 0;
  const epargne = currentBudget?.total_epargne || 0;
  const restant = revenu - budgetUtilise - epargne;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-600">
            {format(new Date(), 'MMMM yyyy', { locale: fr })}
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
          <Calendar className="w-5 h-5 text-blue-600" />
          <span className="text-blue-600 font-medium">
            {format(new Date(), 'dd MMMM yyyy', { locale: fr })}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Revenus</p>
              <p className="text-2xl font-bold">{formatCurrency(revenu)} FCFA</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100">Dépenses</p>
              <p className="text-2xl font-bold">{formatCurrency(budgetUtilise)} FCFA</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Épargne</p>
              <p className="text-2xl font-bold">{formatCurrency(epargne)} FCFA</p>
            </div>
            <PiggyBank className="w-8 h-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100">Restant</p>
              <p className="text-2xl font-bold">{formatCurrency(restant)} FCFA</p>
            </div>
            <Target className="w-8 h-8 text-amber-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dépenses récentes */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Dépenses récentes</h2>
            <button className="text-blue-600 hover:text-blue-700 font-medium">
              Voir tout
            </button>
          </div>

          {recentExpenses.length > 0 ? (
            <div className="space-y-4">
              {recentExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 bg-${expense.categories?.couleur || 'gray'}-100 rounded-lg flex items-center justify-center`}>
                      <span className="text-sm">💰</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {expense.description || 'Dépense'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {expense.categories?.nom || 'Non catégorisé'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      -{formatCurrency(expense.montant)} FCFA
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(expense.date_depense), 'dd/MM', { locale: fr })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Aucune dépense enregistrée</p>
              <button className="mt-2 text-blue-600 hover:text-blue-700 font-medium">
                Ajouter une dépense
              </button>
            </div>
          )}
        </div>

        {/* Objectifs */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Objectifs d'épargne</h2>
            <button className="text-blue-600 hover:text-blue-700 font-medium">
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {objectives.length > 0 ? (
            <div className="space-y-4">
              {objectives.map((objective) => {
                const progress = (objective.montant_actuel / objective.montant_cible) * 100;
                return (
                  <div key={objective.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{objective.titre}</h3>
                      <span className="text-sm text-gray-500">
                        {progress.toFixed(1)}%
                      </span>
                    </div>
                    <div className="mb-2">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 rounded-full h-2 transition-all duration-300"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{formatCurrency(objective.montant_actuel)} FCFA</span>
                      <span>{formatCurrency(objective.montant_cible)} FCFA</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun objectif défini</p>
              <button className="mt-2 text-blue-600 hover:text-blue-700 font-medium">
                Créer un objectif
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}