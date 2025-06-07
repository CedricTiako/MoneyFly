import React, { useState, useEffect } from 'react';
import { Plus, Users, Calendar, DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Tontine, TransactionTontine } from '../../lib/supabase';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export function TontineManager() {
  const { user } = useAuth();
  const [tontines, setTontines] = useState<Tontine[]>([]);
  const [transactions, setTransactions] = useState<TransactionTontine[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTontine, setSelectedTontine] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    montant_cotisation: '',
    frequence: 'mensuel',
    nombre_participants: '1'
  });

  useEffect(() => {
    if (user) {
      loadTontines();
      loadTransactions();
    }
  }, [user]);

  const loadTontines = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tontines')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTontines(data || []);
    } catch (error) {
      console.error('Error loading tontines:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transactions_tontine')
        .select(`
          *,
          tontines (nom)
        `)
        .eq('user_id', user.id)
        .order('date_transaction', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('tontines')
        .insert([{
          user_id: user.id,
          nom: formData.nom,
          description: formData.description,
          montant_cotisation: parseInt(formData.montant_cotisation),
          frequence: formData.frequence,
          nombre_participants: parseInt(formData.nombre_participants)
        }]);

      if (error) throw error;

      // Reset form
      setFormData({
        nom: '',
        description: '',
        montant_cotisation: '',
        frequence: 'mensuel',
        nombre_participants: '1'
      });
      setShowAddForm(false);
      loadTontines();
    } catch (error) {
      console.error('Error adding tontine:', error);
    }
  };

  const addTransaction = async (tontineId: string, type: 'cotisation' | 'reception', montant: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('transactions_tontine')
        .insert([{
          tontine_id: tontineId,
          user_id: user.id,
          montant: montant,
          type: type,
          statut: type === 'cotisation' ? 'paye' : 'recu'
        }]);

      if (error) throw error;
      loadTransactions();
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'paye':
      case 'recu':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'en_attente':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getFrequenceLabel = (frequence: string) => {
    switch (frequence) {
      case 'hebdomadaire': return 'Hebdomadaire';
      case 'mensuel': return 'Mensuel';
      case 'trimestriel': return 'Trimestriel';
      default: return frequence;
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Tontines</h1>
          <p className="text-gray-600">Organisez et suivez vos tontines communautaires</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nouvelle tontine</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tontines List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Mes Tontines</h2>
          
          {tontines.length > 0 ? (
            <div className="space-y-4">
              {tontines.map((tontine) => (
                <div 
                  key={tontine.id} 
                  className={`bg-white rounded-2xl shadow-lg p-6 cursor-pointer transition-all hover:shadow-xl ${
                    selectedTontine === tontine.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedTontine(selectedTontine === tontine.id ? null : tontine.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-purple-100 p-3 rounded-lg">
                        <Users className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{tontine.nom}</h3>
                        <p className="text-sm text-gray-500">{tontine.description}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      tontine.statut === 'actif' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {tontine.statut}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Cotisation</p>
                      <p className="font-bold text-gray-900">
                        {formatCurrency(tontine.montant_cotisation)} FCFA
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Fréquence</p>
                      <p className="font-bold text-gray-900">
                        {getFrequenceLabel(tontine.frequence)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Users className="w-4 h-4" />
                      <span>{tontine.nombre_participants} participant(s)</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addTransaction(tontine.id, 'cotisation', tontine.montant_cotisation);
                        }}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Cotiser
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const montant = tontine.montant_cotisation * tontine.nombre_participants;
                          addTransaction(tontine.id, 'reception', montant);
                        }}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Recevoir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-white rounded-2xl shadow-lg">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune tontine</h3>
              <p className="text-gray-500 mb-4">Créez votre première tontine pour commencer</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Créer une tontine
              </button>
            </div>
          )}
        </div>

        {/* Transactions History */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Historique des transactions</h2>
          
          <div className="bg-white rounded-2xl shadow-lg max-h-96 overflow-y-auto">
            {transactions.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(transaction.statut)}
                        <div>
                          <p className="font-medium text-gray-900">
                            {transaction.type === 'cotisation' ? 'Cotisation' : 'Réception'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {transaction.tontines?.nom}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          transaction.type === 'cotisation' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {transaction.type === 'cotisation' ? '-' : '+'}
                          {formatCurrency(transaction.montant)} FCFA
                        </p>
                        <p className="text-sm text-gray-500">
                          {format(parseISO(transaction.date_transaction), 'dd/MM/yyyy', { locale: fr })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucune transaction</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Tontine Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Nouvelle tontine</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la tontine
                </label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Tontine des amis"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Décrivez votre tontine..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant de cotisation (FCFA)
                </label>
                <input
                  type="number"
                  value={formData.montant_cotisation}
                  onChange={(e) => setFormData({ ...formData, montant_cotisation: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 50000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fréquence
                </label>
                <select
                  value={formData.frequence}
                  onChange={(e) => setFormData({ ...formData, frequence: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="hebdomadaire">Hebdomadaire</option>
                  <option value="mensuel">Mensuel</option>
                  <option value="trimestriel">Trimestriel</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de participants
                </label>
                <input
                  type="number"
                  value={formData.nombre_participants}
                  onChange={(e) => setFormData({ ...formData, nombre_participants: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
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