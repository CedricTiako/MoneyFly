import React, { useState, useEffect } from 'react';
import { Plus, Target, Calendar, TrendingUp, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Objectif } from '../../lib/supabase';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export function GoalManager() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Objectif[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    montant_cible: '',
    deadline: ''
  });

  useEffect(() => {
    if (user) {
      loadGoals();
    }
  }, [user]);

  const loadGoals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('objectifs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('objectifs')
        .insert([{
          user_id: user.id,
          titre: formData.titre,
          description: formData.description,
          montant_cible: parseInt(formData.montant_cible),
          deadline: formData.deadline || null
        }]);

      if (error) throw error;

      // Reset form
      setFormData({
        titre: '',
        description: '',
        montant_cible: '',
        deadline: ''
      });
      setShowAddForm(false);
      loadGoals();
    } catch (error) {
      console.error('Error adding goal:', error);
    }
  };

  const updateGoalProgress = async (goalId: string, newAmount: number) => {
    try {
      const { error } = await supabase
        .from('objectifs')
        .update({ montant_actuel: newAmount })
        .eq('id', goalId);

      if (error) throw error;
      loadGoals();
    } catch (error) {
      console.error('Error updating goal progress:', error);
    }
  };

  const deleteGoal = async (goalId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet objectif ?')) return;

    try {
      const { error } = await supabase
        .from('objectifs')
        .delete()
        .eq('id', goalId);

      if (error) throw error;
      loadGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusBadge = (goal: Objectif) => {
    const progress = (goal.montant_actuel / goal.montant_cible) * 100;
    
    if (progress >= 100) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Atteint</span>;
    }
    
    if (goal.deadline) {
      const deadline = parseISO(goal.deadline);
      const now = new Date();
      const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysLeft < 0) {
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">Expiré</span>;
      } else if (daysLeft <= 30) {
        return <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">Urgent</span>;
      }
    }
    
    return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">En cours</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Objectifs d'épargne</h1>
          <p className="text-gray-600">Définissez et suivez vos objectifs financiers</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nouvel objectif</span>
        </button>
      </div>

      {/* Goals Grid */}
      {goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const progress = (goal.montant_actuel / goal.montant_cible) * 100;
            return (
              <div key={goal.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <Target className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{goal.titre}</h3>
                      {getStatusBadge(goal)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteGoal(goal.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {goal.description && (
                  <p className="text-gray-600 text-sm mb-4">{goal.description}</p>
                )}

                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>{formatCurrency(goal.montant_actuel)} FCFA</span>
                    <span>{formatCurrency(goal.montant_cible)} FCFA</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-3">
                    <div 
                      className={`${getProgressColor(progress)} rounded-full h-3 transition-all duration-500`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-center mt-2">
                    <span className="text-lg font-bold text-gray-900">
                      {progress.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {goal.deadline && (
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>
                      Échéance: {format(parseISO(goal.deadline), 'dd MMMM yyyy', { locale: fr })}
                    </span>
                  </div>
                )}

                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Montant à ajouter"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        const amount = parseInt(input.value);
                        if (amount > 0) {
                          updateGoalProgress(goal.id, goal.montant_actuel + amount);
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <button className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <TrendingUp className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Aucun objectif défini</h3>
          <p className="text-gray-500 mb-6">Commencez par créer votre premier objectif d'épargne</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Créer un objectif
          </button>
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Nouvel objectif d'épargne</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre de l'objectif
                </label>
                <input
                  type="text"
                  value={formData.titre}
                  onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Voyage en Europe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optionnel)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Décrivez votre objectif..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant cible (FCFA)
                </label>
                <input
                  type="number"
                  value={formData.montant_cible}
                  onChange={(e) => setFormData({ ...formData, montant_cible: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 2000000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date limite (optionnel)
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}