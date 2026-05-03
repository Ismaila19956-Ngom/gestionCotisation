export interface Match {
  id: string; // uuid
  nom_match: string;
  date_match: string;
  total_depenses?: number;
}

export interface MatchExpense {
  id: string; // uuid
  match_id: string;
  categorie: 'restauration' | 'mystique' | 'mercenaire';
  motif: string;
  montant: number;
  created_at?: string;
}
