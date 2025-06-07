import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  BarChart3,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Brain,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

interface FinancialMetrics {
  monthlyTrend: number;
  savingsRate: number;
  expenseDistribution: Array<{ category: string; amount: number; percentage: number; color: string }>;
  budgetHealth: 'excellent' | 'good' | 'warning' | 'critical';
  predictions: {
    nextMonthExpenses: number;
    yearEndSavings: number;
    goalAchievementDate: string;
  };
}

export function FinancialInsights() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeInsight, setActiveInsight] = useState(0);

  useEffect(() => {
    if (user) {
      calculateFinancialInsights();
    }
  }, [user]);

  const calculateFinancialInsights = async () => {
    if (!user) return;

    try {
      // Récupérer les données des 3 derniers mois
      const currentMonth = format(new Date(), 'yyyy-MM');
      const lastMonth = format(subMonths(new Date(), 1), 'yyyy-MM');
      const twoMonthsAgo = format(subMonths(new Date(), 2), 'yyyy-MM');

      // Budgets des 3 derniers mois
      const { data: budgets } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .in('mois', [currentMonth, lastMonth, twoMonthsAgo])
        .order('mois', { ascending: false });

      // Dépenses par catégorie du mois actuel
      const { data: expenses } = await supabase
        .from('depenses')
        .select(`
          montant,
          categories (nom, couleur)
        `)
        .eq('user_id', user.id)
        .gte('date_depense', startOfMonth(new Date()).toISOString())
        .lte('date_depense', endOfMonth(new Date()).toISOString());

      // Objectifs
      const { data: goals } = await supabase
        .from('objectifs')
        .select('*')
        .eq('user_id', user.id)
        .eq('statut', 'en_cours');

      if (budgets && expenses && goals) {
        const insights = analyzeFinancialData(budgets, expenses, goals);
        setMetrics(insights);
      }
    } catch (error) {
      console.error('Error calculating insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeFinancialData = (budgets: any[], expenses: any[], goals: any[]): FinancialMetrics => {
    // Calcul de la tendance mensuelle
    const monthlyTrend = budgets.length >= 2 
      ? ((budgets[0].total_depense - budgets[1].total_depense) / budgets[1].total_depense) * 100
      : 0;

    // Taux d'épargne
    const currentBudget = budgets[0] || { revenu: 0, total_epargne: 0 };
    const savingsRate = currentBudget.revenu > 0 
      ? (currentBudget.total_epargne / currentBudget.revenu) * 100 
      : 0;

    // Distribution des dépenses par catégorie
    const categoryTotals = expenses.reduce((acc, expense) => {
      const categoryName = expense.categories?.nom || 'Non catégorisé';
      const categoryColor = expense.categories?.couleur || 'gray';
      
      if (!acc[categoryName]) {
        acc[categoryName] = { amount: 0, color: categoryColor };
      }
      acc[categoryName].amount += expense.montant;
      return acc;
    }, {} as Record<string, { amount: number; color: string }>);

    const totalExpenses = Object.values(categoryTotals).reduce((sum, cat) => sum + cat.amount, 0);
    
    const expenseDistribution = Object.entries(categoryTotals)
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
        color: data.color
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);

    // Santé budgétaire
    let budgetHealth: 'excellent' | 'good' | 'warning' | 'critical' = 'excellent';
    if (savingsRate < 10) budgetHealth = 'critical';
    else if (savingsRate < 20) budgetHealth = 'warning';
    else if (savingsRate < 30) budgetHealth = 'good';

    // Prédictions intelligentes
    const avgMonthlyExpenses = budgets.reduce((sum, b) => sum + b.total_depense, 0) / budgets.length;
    const avgMonthlySavings = budgets.reduce((sum, b) => sum + b.total_epargne, 0) / budgets.length;
    
    const predictions = {
      nextMonthExpenses: Math.round(avgMonthlyExpenses * (1 + monthlyTrend / 100)),
      yearEndSavings: Math.round(avgMonthlySavings * 12),
      goalAchievementDate: goals.length > 0 
        ? calculateGoalAchievementDate(goals[0], avgMonthlySavings)
        : 'N/A'
    };

    return {
      monthlyTrend,
      savingsRate,
      expenseDistribution,
      budgetHealth,
      predictions
    };
  };

  const calculateGoalAchievementDate = (goal: any, monthlySavings: number): string => {
    const remaining = goal.montant_cible - goal.montant_actuel;
    if (monthlySavings <= 0) return 'Jamais à ce rythme';
    
    const monthsNeeded = Math.ceil(remaining / monthlySavings);
    const achievementDate = new Date();
    achievementDate.setMonth(achievementDate.getMonth() + monthsNeeded);
    
    return format(achievementDate, 'MMMM yyyy', { locale: fr });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'excellent': return <CheckCircle className="w-5 h-5" />;
      case 'good': return <TrendingUp className="w-5 h-5" />;
      case 'warning': return <Clock className="w-5 h-5" />;
      case 'critical': return <AlertTriangle className="w-5 h-5" />;
      default: return <BarChart3 className="w-5 h-5" />;
    }
  };

  const insights = [
    {
      title: "Analyse Prédictive",
      icon: <Brain className="w-6 h-6" />,
      content: metrics ? (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
            <h4 className="font-semibold text-purple-900 mb-2">🔮 Prédictions IA</h4>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Dépenses prévues (mois prochain):</span> {formatCurrency(metrics.predictions.nextMonthExpenses)} FCFA</p>
              <p><span className="font-medium">Épargne estimée (fin d'année):</span> {formatCurrency(metrics.predictions.yearEndSavings)} FCFA</p>
              <p><span className="font-medium">Objectif principal atteint en:</span> {metrics.predictions.goalAchievementDate}</p>
            </div>
          </div>
        </div>
      ) : null
    },
    {
      title: "Santé Financière",
      icon: <Zap className="w-6 h-6" />,
      content: metrics ? (
        <div className="space-y-4">
          <div className={`p-4 rounded-lg flex items-center space-x-3 ${getHealthColor(metrics.budgetHealth)}`}>
            {getHealthIcon(metrics.budgetHealth)}
            <div>
              <h4 className="font-semibold capitalize">{metrics.budgetHealth}</h4>
              <p className="text-sm">Taux d'épargne: {metrics.savingsRate.toFixed(1)}%</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">📊 Tendance Mensuelle</h4>
            <div className="flex items-center space-x-2">
              {metrics.monthlyTrend > 0 ? (
                <TrendingUp className="w-5 h-5 text-red-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-green-500" />
              )}
              <span className={`font-bold ${metrics.monthlyTrend > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {Math.abs(metrics.monthlyTrend).toFixed(1)}%
              </span>
              <span className="text-sm text-gray-600">
                {metrics.monthlyTrend > 0 ? 'augmentation' : 'diminution'} vs mois dernier
              </span>
            </div>
          </div>
        </div>
      ) : null
    },
    {
      title: "Distribution Intelligente",
      icon: <PieChart className="w-6 h-6" />,
      content: metrics ? (
        <div className="space-y-3">
          {metrics.expenseDistribution.map((category, index) => (
            <div key={category.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full bg-${category.color}-500`}></div>
                <span className="font-medium text-gray-900">{category.category}</span>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{formatCurrency(category.amount)} FCFA</p>
                <p className="text-sm text-gray-500">{category.percentage.toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      ) : null
    }
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Analyse en cours...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header avec animation */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-2">
            <Sparkles className="w-8 h-8 animate-pulse" />
            <h2 className="text-2xl font-bold">Insights Financiers IA</h2>
          </div>
          <p className="text-purple-100">Analyse prédictive de vos finances personnelles</p>
        </div>
        
        {/* Particules animées */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white bg-opacity-30 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Navigation des insights */}
      <div className="border-b border-gray-200">
        <div className="flex">
          {insights.map((insight, index) => (
            <button
              key={index}
              onClick={() => setActiveInsight(index)}
              className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 transition-all duration-200 ${
                activeInsight === index
                  ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {insight.icon}
              <span className="font-medium hidden md:block">{insight.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Contenu de l'insight actif */}
      <div className="p-6">
        <div className="min-h-[300px]">
          {insights[activeInsight]?.content || (
            <div className="text-center py-12">
              <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Analyse en cours...</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer avec conseils */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <span>
            <strong>Conseil IA:</strong> {
              metrics?.budgetHealth === 'excellent' 
                ? "Excellent! Continuez sur cette lancée et envisagez d'augmenter vos objectifs d'épargne."
                : metrics?.budgetHealth === 'good'
                ? "Bon travail! Essayez de réduire les dépenses non essentielles pour optimiser votre épargne."
                : metrics?.budgetHealth === 'warning'
                ? "Attention! Revoyez vos dépenses et augmentez votre taux d'épargne."
                : "Situation critique! Réduisez immédiatement vos dépenses et consultez un conseiller financier."
            }
          </span>
        </div>
      </div>
    </div>
  );
}