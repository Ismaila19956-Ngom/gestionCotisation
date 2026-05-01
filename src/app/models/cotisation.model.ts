export type StatutCotisation = 'À jour' | 'Rappel' | 'Avance' | 'Payé' | 'En cours' | 'En retard' | 'Partiel';
export type Sexe = 'M' | 'F' | 'Homme' | 'Femme';
export type CategorieCotisation = '10000' | '5000' | '3000' | '2000' | '1000';

export interface Cotisation {
    id: number;
    membreId: number;
    reference: string;
    mois: string;
    annee: number;
    montantVerse: number;
    datePaiement: string;
    status: StatutCotisation;
    observation?: string;
}

export interface Member {
    id: number;
    prenom: string;
    nom: string;
    dateNaissance: string;
    sexe: Sexe;
    categorie_id: number;
    dateAdhesion: string;
}

export interface CotisationMois {
    id: any;
    membreId: number;
    mois: string;
    montant: number;
    statut: string;
    avance: number;
    reste: number;
    observation?: string;
}

export interface MembreCotisation extends Member {
    paiementsMensuels: CotisationMois[];
    unpaidMonthsCount: number;
}

export interface StatsGlobales {
    totalRecu: number;
    totalAttenduDuMois: number;
    nombreMembres: number;
    tauxRecouvrement: number;
}
