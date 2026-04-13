export type StatutCotisation = 'À jour' | 'Rappel' | 'Avance';
export type Sexe = 'M' | 'F';
export type CategorieCotisation = '10000' | '5000' | '2000';

export interface Cotisation {
    id: number;
    membreId: number;
    reference: string;    // ex: 'COT-2026-001'
    mois: string;         // ex: 'Janvier'
    annee: number;        // ex: 2026
    montantVerse: number;
    datePaiement: string; // ISO format
    status: StatutCotisation;
    observation?: string;
}

export interface Member {
    id: number;
    prenom: string;
    nom: string;
    dateNaissance: string; // ISO format
    sexe: Sexe;
    categorie: CategorieCotisation;
    dateAdhesion: string;  // ISO format
}

export interface StatsGlobales {
    totalRecu: number;
    totalAttenduDuMois: number;
    nombreMembres: number;
    tauxRecouvrement: number;
}
