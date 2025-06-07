import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Depense, Categorie, Budget } from '../../lib/supabase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function ExpenseManager() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Depense[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    montant: '',
    description: '',
    categorie_id: '',
    date_depense: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    if (user) {
      loadExpenses();
      loadCategories();
    }
  }, [user]);

  const loadExpenses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('depenses')
        .select(`
          *,
          categories (nom, couleur, icone)
        `)
        .eq('user_id', user.id)
        .order('date_depense', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('nom');

      if (error) throw error;
      
      if (!data || data.length === 0) {
        // Créer des catégories par défaut
        await createDefaultCategories();
      } else {
        setCategories(data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const createDefaultCategories = async () => {
    if (!user) return;

    const defaultCategories = [
      { nom: 'Alimentation', couleur: 'green', icone: 'utensils', budget_alloue: 80000 },
      { nom: 'Transport', couleur: 'blue', icone: 'car', budget_alloue: 30000 },
      { nom: 'Logement', couleur: 'purple', icone: 'home', budget_alloue: 40000 },
      { nom: 'Santé', couleur: 'red', icone: 'heart', budget_alloue: 20000 },
      { nom: 'Loisirs', couleur: 'yellow', icone: 'gamepad', budget_alloue: 15000 },
      { nom: 'Famille', couleur: 'pink', icone: 'users', budget_alloue: 100000 },
      { nom: 'Divers', couleur: 'gray', icone: 'more-horizontal', budget_alloue: 10000 }
    ];

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert(
          defaultCategories.map(cat => ({
            ...cat,
            user_id: user.id
          }))
        )
        .select();

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error creating default categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      // Obtenir le budget du mois actuel
      const currentMonth = format(new Date(formData.date_depense), 'yyyy-MM');
      
      let { data: budget } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('mois', currentMonth)
        .single();

      if (!budget) {
        // Créer le budget s'il n'existe pas
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
        
        budget = newBudget;
      }

      // Ajouter la dépense
      const { error } = await supabase
        .from('depenses')
        .insert([{
          user_id: user.id,
          budget_id: budget?.id,
          montant: parseInt(formData.montant),
          description: formData.description,
          categorie_id: formData.categorie_id || null,
          date_depense: formData.date_depense
        }]);

      if (error) throw error;

      // Mettre à jour le total des dépenses du budget
      if (budget) {
        await supabase
          .from('budgets')
          .update({
            total_depense: (budget.total_depense || 0) + parseInt(formData.montant)
          })
          .eq('id', budget.id);
      }

      // Reset form
      setFormData({
        montant: '',
        description: '',
        categorie_id: '',
        date_depense: format(new Date(), 'yyyy-MM-dd')
      });
      setShowAddForm(false);
      loadExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const deleteExpense = async (expense: Depense) => {
    if (!user || !confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) return;

    try {
      const { error } = await supabase
        .from('depenses')
        .delete()
        .eq('id', expense.id);

      if (error) throw error;

      // Mettre à jour le budget
      if (expense.budget_id) {
        const { data: budget } = await supabase
          .from('budgets')
          .select('total_depense')
          .eq('id', expense.budget_id)
          .single();

        if (budget) {
          await supabase
            .from('budgets')
            .update({
              total_depense: Math.max(0, (budget.total_depense || 0) - expense.montant)
            })
            .eq('id', expense.budget_id);
        }
      }

      loadExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.categories?.nom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || expense.categorie_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
          <h1 className="text-3xl font-bold text-gray-900">Gestion des dépenses</h1>
          <p className="text-gray-600">Suivez et catégorisez vos dépenses</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Ajouter une dépense</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher une dépense..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="md:w-64">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Toutes les catégories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nom}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {filteredExpenses.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredExpenses.map((expense) => (
              <div key={expense.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 bg-${expense.categories?.couleur || 'gray'}-100 rounded-lg flex items-center justify-center`}>
                      <span className="text-lg">💰</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {expense.description || 'Dépense sans description'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {expense.categories?.nom || 'Non catégorisé'} • {' '}
                        {format(new Date(expense.date_depense), 'dd MMMM yyyy', { locale: fr })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-xl font-bold text-red-600">
                        -{formatCurrency(expense.montant)} FCFA
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteExpense(expense)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Aucune dépense trouvée</p>
            <p className="text-gray-400">Commencez par ajouter votre première dépense</p>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Ajouter une dépense</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant (FCFA)
                </label>
                <input
                  type="number"
                  value={formData.montant}
                  onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 5000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Courses alimentaires"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie
                </label>
                <select
                  value={formData.categorie_id}
                  onChange={(e) => setFormData({ ...formData, categorie_id: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date_depense}
                  onChange={(e) => setFormData({ ...formData, date_depense: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
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
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}