export interface Categorie {
    id: number;
    montant: number;
    description?: string;
    actif: boolean;
}

export interface Campagne {
    id: number;
    annee: number;
    libelle: string;
    moisDebut: number;
    moisFin: number;
    dateDebutCotisation?: string;
    dateFinCotisation?: string;
    statut: 'EN_COURS' | 'CLOTUREE' | 'A_VENIR';
}

export interface PaiementMensuel {
    mois: string;
    montant: number;
    statut: string; // 'Payé' | 'En cours' | 'En retard' | 'Partiel' | 'Avance'
    avance: number;
    reste: number;
    observation?: string;
}

export interface MembreCotisation {
    id: number;
    campagneId: number;
    categorieId: number;
    memberId: number;
    prenom: string;
    nom: string;
    sexe: 'H' | 'F';
    dateNaissance: string;
    isPaid: boolean;
    datePaiement?: string;
    unpaidMonthsCount?: number;
    paiementsMensuels?: PaiementMensuel[];
}
