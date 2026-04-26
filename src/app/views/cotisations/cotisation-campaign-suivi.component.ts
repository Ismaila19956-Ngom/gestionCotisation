import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { Categorie, MembreCotisation } from '../../models/cotisation-campaign.model';
import { CotisationMemberImportModalComponent } from './cotisation-member-import-modal.component';

@Component({
    selector: 'app-cotisation-campaign-suivi',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, CotisationMemberImportModalComponent, RouterLink, PaginationComponent],
    templateUrl: './cotisation-campaign-suivi.component.html',
    styleUrls: ['./cotisation-campaign-suivi.component.scss']
})
export class CotisationCampaignSuiviComponent implements OnInit {

    campagneId!: number;

    categories: Categorie[] = [
        { id: 1, montant: 1000, actif: true },
        { id: 2, montant: 2000, actif: true },
        { id: 3, montant: 3000, actif: true },
        { id: 4, montant: 5000, actif: true },
        { id: 5, montant: 10000, actif: true },
    ];

    activeTab: number = 1000; // Par défaut, onglet 1000 FCFA
    showImportModal: boolean = false;

    membres: MembreCotisation[] = [];

    // Modal Détails & Cotisation
    showDetailModal: boolean = false;
    showSuccessMessage = false;

    // Pagination
    currentPage = 1;
    itemsPerPage = 10;

    selectedMembre: MembreCotisation | null = null;
    detailForm!: FormGroup;
    monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    availableMonths: string[] = [];

    constructor(private route: ActivatedRoute, private router: Router) { }

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            this.campagneId = Number(params.get('id'));
            
            // Charger les infos de la campagne pour obtenir les mois dynamiques
            const campagnesStr = localStorage.getItem('natangue_campagnes');
            if (campagnesStr) {
                const campagnes = JSON.parse(campagnesStr);
                const currentCampagne = campagnes.find((c: any) => c.id === this.campagneId);
                if (currentCampagne) {
                    this.availableMonths = this.genererListeMois(currentCampagne.moisDebut, currentCampagne.moisFin);
                } else {
                    this.availableMonths = this.generateMonths(7, 10); // par défaut
                }
            } else {
                this.availableMonths = this.generateMonths(7, 10);
            }
            
            // On essaie de charger les membres depuis le localStorage
            const hasData = this.loadDataFromStorage();
            if (!hasData) {
                this.membres = [];
                this.saveDataToStorage();
            }
        });
    }

    // --- Gestion du LocalStorage ---
    get storageKey(): string {
        return `natangue_campagne_${this.campagneId}_membres_v2`;
    }

    loadDataFromStorage(): boolean {
        const data = localStorage.getItem(this.storageKey);
        if (data) {
            try {
                this.membres = JSON.parse(data);
                return true;
            } catch (e) {
                console.error('Erreur lors du chargement des données depuis le localStorage', e);
                return false;
            }
        }
        return false;
    }

    saveDataToStorage() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.membres));
    }

    // --- Initialisation des paiements pour un nouveau membre ---
    initPaiementsMensuels(membre: MembreCotisation, montantInitial: number) {
        membre.paiementsMensuels = this.availableMonths.map(mois => {
            return {
                mois: mois,
                montant: montantInitial,
                statut: this.calculateStatutMensuel(mois, 0, montantInitial),
                avance: 0,
                reste: montantInitial
            };
        });
        this.recalculerNombreMoisEnRetard(membre);
    }


    setActiveTab(montant: number) {
        this.activeTab = montant;
        this.currentPage = 1; // Reset pagination quand on change de catégorie
    }

    getMembresByCategorie(montant: number) {
        const cat = this.categories.find(c => c.montant === montant);
        if (!cat) return [];
        return this.membres.filter((m: any) => m.categorieId === cat.id || m.categorie === montant);
    }

    getPaginatedMembresByCategorie(montant: number) {
        const list = this.getMembresByCategorie(montant);
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        return list.slice(start, end);
    }

    getTotalPagesCategorie(montant: number): number {
        const total = this.getMembresByCategorie(montant).length;
        return Math.ceil(total / this.itemsPerPage) || 1;
    }

    onPageChange(page: number) {
        this.currentPage = page;
    }

    onPageSizeChange(size: number) {
        this.itemsPerPage = size;
        this.currentPage = 1;
    }

    // Calcule le montant total encaissé (payé) pour une catégorie donnée
    getTotalPayeByCategorie(montant: number): number {
        const membresCat = this.getMembresByCategorie(montant);
        return membresCat.reduce((totalCat, membre) => {
            const totalMembre = (membre.paiementsMensuels || []).reduce((sum, p) => sum + (p.avance || 0), 0);
            return totalCat + totalMembre;
        }, 0);
    }

    // Obtenir le total encaissé pour un membre en particulier
    getTotalEncaisseMembre(membre: MembreCotisation): number {
        return (membre.paiementsMensuels || []).reduce((sum, p) => sum + (p.avance || 0), 0);
    }

    // Calcule le total général sur toute la campagne
    getTotalGeneral(): number {
        return this.categories.reduce((total, cat) => {
            return total + this.getTotalPayeByCategorie(cat.montant);
        }, 0);
    }

    openImportModal() {
        this.showImportModal = true;
    }

    closeImportModal() {
        this.showImportModal = false;
    }

    onMembersImported(selectedMembers: any[]) {
        const activeCat = this.categories.find(c => c.montant === this.activeTab);
        if (!activeCat) return;

        selectedMembers.forEach(m => {
            const newId = this.membres.length + 1;
            const newMembre: MembreCotisation = {
                id: newId,
                campagneId: this.campagneId,
                categorieId: activeCat.id,
                memberId: m.id,
                prenom: m.prenom,
                nom: m.nom,
                sexe: m.sexe,
                dateNaissance: m.dateNaissance || '01/01/2000',
                isPaid: false
            };
            this.initPaiementsMensuels(newMembre, activeCat.montant);
            this.membres.push(newMembre);
        });

        this.showImportModal = false;
        this.saveDataToStorage();
        alert(`${selectedMembers.length} membre(s) importé(s) avec succès dans la catégorie ${this.activeTab} FCFA !`);
    }

    addCotisationGlobal() {
        console.log(`Ajout d'une nouvelle cotisation pour la catégorie : ${this.activeTab} FCFA`);
        const activeCat = this.categories.find(c => c.montant === this.activeTab);
        if (activeCat) {
            const newId = this.membres.length + 1;
            const newMembre: MembreCotisation = {
                id: newId,
                campagneId: this.campagneId,
                categorieId: activeCat.id,
                memberId: 200 + newId,
                prenom: 'Membre',
                nom: `Manuel ${newId}`,
                sexe: 'H',
                dateNaissance: '01/01/2000',
                isPaid: false
            };
            this.initPaiementsMensuels(newMembre, activeCat.montant);
            this.membres.push(newMembre);
            this.saveDataToStorage();
            alert(`Cotisation de ${this.activeTab} FCFA enregistrée !`);
        }
    }

    addCotisation(membre: MembreCotisation) {
        membre.isPaid = true;
        membre.datePaiement = new Date().toISOString().split('T')[0];
        this.saveDataToStorage();
    }

    goBack() {
        this.router.navigate(['/cotisations']);
    }

    // --- Logique Modal Détails & Cotisation ---

    generateMonths(debut: number, fin: number) {
        let list = [];
        for (let i = debut; i <= fin; i++) {
            list.push(this.monthNames[i - 1]);
        }
        return list;
    }

    /**
     * Génère dynamiquement la liste des mois entre moisDebut et moisFin.
     * Gère le chevauchement d'année (ex: Octobre à Février)
     */
    genererListeMois(debut: number, fin: number): string[] {
        let mois: string[] = [];
        let current = debut;

        while (true) {
            mois.push(this.monthNames[current - 1]);
            if (current === fin) break;
            
            current++;
            if (current > 12) current = 1; // On repart à Janvier
        }
        return mois;
    }

    // ─── RÈGLE MÉTIER DU 10 DU MOIS ─────────────────────────────────────────────
    // Retourne l'index du mois (1-12) à partir du nom
    getMoisIndex(nomMois: string): number {
        return this.monthNames.indexOf(nomMois) + 1;
    }

    // Retourne vrai si la ligne est le mois courant
    isCurrentMonth(nomMois: string): boolean {
        const now = new Date();
        return this.getMoisIndex(nomMois) === now.getMonth() + 1;
    }

    /**
     * Calcule le statut d'un mois selon la règle métier :
     * - Avance > 0 et < montant  → "Partiel"
     * - Avance == montant        → "Payé"
     * - Avance > montant         → "Avance"
     * - Mois futur               → "En cours"
     * - Mois passé, non payé     → "En retard"
     * - Mois courant avant le 10 → "En cours"
     * - Mois courant après le 10 → "En retard"
     */
    calculateStatutMensuel(nomMois: string, avance: number, montant: number): string {
        if (avance > 0 && avance < montant) return 'Partiel';
        if (avance === montant) return 'Payé';
        if (avance > montant) return 'Avance';

        const now = new Date();
        const currentMonth = now.getMonth() + 1; // 1-12
        const currentDay = now.getDate();
        const moisIndex = this.getMoisIndex(nomMois);

        if (moisIndex > currentMonth) {
            return 'En cours'; // Mois futur
        } else if (moisIndex < currentMonth) {
            return 'En retard'; // Mois passé non payé
        } else {
            // Mois courant
            return currentDay >= 10 ? 'En retard' : 'En cours';
        }
    }

    // Recalcule unpaidMonthsCount à partir des paiements mensuels
    recalculerNombreMoisEnRetard(membre: MembreCotisation) {
        if (!membre.paiementsMensuels) return;
        membre.unpaidMonthsCount = membre.paiementsMensuels.filter(
            p => p.statut === 'En retard'
        ).length;
    }
    // ─────────────────────────────────────────────────────────────────────────────

    openDetailModal(membre: MembreCotisation) {
        this.selectedMembre = membre;
        this.showDetailModal = true;
    }

    onAvanceChange(paiement: any) {
        paiement.reste = Math.max(0, (paiement.montant || 0) - (paiement.avance || 0));
        
        // Recalcul dynamique des statuts
        paiement.statut = this.calculateStatutMensuel(
            paiement.mois,
            paiement.avance || 0,
            paiement.montant || 0
        );
        // Mettre à jour le badge dans le tableau principal
        if (this.selectedMembre) {
            this.recalculerNombreMoisEnRetard(this.selectedMembre);
        }
    }

    closeDetailModal() {
        this.showDetailModal = false;
        this.selectedMembre = null;
    }

    formatMontant(amount: number | string): string {
        if (amount === undefined || amount === null) return '0 F CFA';
        return amount.toLocaleString() + ' F CFA';
    }

    // --- Fast Payment ---
    fastPayment(membre: MembreCotisation) {
        if (!membre.paiementsMensuels) return;
        const firstUnpaid = membre.paiementsMensuels.find(p => p.statut !== 'Payé' && p.statut !== 'Avance');
        
        if (firstUnpaid) {
            firstUnpaid.avance = firstUnpaid.montant;
            this.onAvanceChange(firstUnpaid);
            this.saveDataToStorage();
        } else {
            // Remplacer l'alerte par un message console ou un toast si disponible
            console.log("Ce membre est déjà en règle.");
        }
    }

    // --- Génération Rapport WhatsApp ---
    generateWhatsappReport() {
        let report = `*COTISATIONS - Campagne #${this.campagneId} - ${new Date().getFullYear()}*\n\n`;
        
        const now = new Date();
        const currentMonthName = this.monthNames[now.getMonth()] || this.monthNames[now.getMonth() - 1] || 'Mois';
        
        this.categories.forEach(cat => {
            const membresCat = this.getMembresByCategorie(cat.montant);
            let catReport = `*Catégorie ${this.formatMontant(cat.montant)}*\n`;
            let catTotalMoisEnCours = 0;
            let hasPaiement = false;
            
            membresCat.forEach(membre => {
                if (membre.paiementsMensuels) {
                    const paiementMoisEnCours = membre.paiementsMensuels.find(p => p.mois === currentMonthName || p.mois === this.monthNames[0]);
                    
                    // Si on ne trouve pas le mois en cours exact, prenons le mois le plus récent où il a payé
                    const targetPaiement = paiementMoisEnCours || membre.paiementsMensuels[0];
                    
                    if (targetPaiement && (targetPaiement.avance || 0) > 0) {
                        catReport += `- ${membre.prenom} ${membre.nom} : ${this.formatMontant(targetPaiement.avance)}\n`;
                        catTotalMoisEnCours += targetPaiement.avance;
                        hasPaiement = true;
                    }
                }
            });
            
            if (hasPaiement) {
                catReport += `*Sous-total : ${this.formatMontant(catTotalMoisEnCours)}*\n\n`;
                report += catReport;
            }
        });
        
        const totalGeneral = this.getTotalGeneral();
        report += `*TOTAL GÉNÉRAL ENCAISSÉ : ${this.formatMontant(totalGeneral)}*\n`;
        report += `_(${this.numberToLetters(totalGeneral)} francs CFA)_\n`;
        
        navigator.clipboard.writeText(report).then(() => {
            alert("Le rapport WhatsApp a été copié dans le presse-papier !");
        }).catch(err => {
            console.error('Erreur lors de la copie du rapport', err);
            alert("Erreur lors de la copie du rapport. Consultez la console.");
        });
    }

    numberToLetters(num: number): string {
        return this.convertNumberToWordsFr(num);
    }
    
    convertNumberToWordsFr(value: number): string {
        const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
        const tens = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingts", "quatre-vingt-dix"];
        
        if (value === 0) return "zéro";
        
        let word = "";
        
        if (Math.floor(value / 1000000) > 0) {
            word += this.convertNumberToWordsFr(Math.floor(value / 1000000)) + " million ";
            value %= 1000000;
        }
        
        if (Math.floor(value / 1000) > 0) {
            if (Math.floor(value / 1000) === 1) {
                word += "mille ";
            } else {
                word += this.convertNumberToWordsFr(Math.floor(value / 1000)) + " mille ";
            }
            value %= 1000;
        }
        
        if (Math.floor(value / 100) > 0) {
            if (Math.floor(value / 100) === 1) {
                word += "cent ";
            } else {
                word += units[Math.floor(value / 100)] + " cent ";
            }
            value %= 100;
        }
        
        if (value > 0) {
            if (value < 20) {
                word += units[value];
            } else {
                let ten = Math.floor(value / 10);
                let unit = value % 10;
                
                if (ten === 7 || ten === 9) {
                    ten--;
                    unit += 10;
                }
                
                word += tens[ten];
                if (unit > 0) {
                    if (unit === 1 && ten !== 8) {
                        word += " et un";
                    } else if (unit >= 10 && unit <= 19) {
                         if (ten === 6 && unit === 11) {
                             word += " et onze";
                         } else {
                             word += "-" + units[unit];
                         }
                    } else {
                        word += "-" + units[unit];
                    }
                }
            }
        }
        
        return word.trim();
    }

    // --- Génération de la Fiche de Synthèse PDF ---
    generatePDF() {
        const doc = new jsPDF('landscape');
        const now = new Date();
        const dateStr = now.toLocaleDateString('fr-FR');
        
        // 1. Titre Principal
        doc.setFontSize(18);
        doc.setTextColor(7, 90, 38); // Vert Natangué
        doc.text('COTISATIONS NATANGUÉ 2025/2026', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Fiche de Synthèse - Générée le ${dateStr}`, doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });

        let currentY = 30;
        let totalGeneral = 0;

        // Catégories à traiter dans l'ordre souhaité
        const targetCats = [10000, 5000, 3000, 2000, 1000];
        
        targetCats.forEach(catMontant => {
            const membresCat = this.getMembresByCategorie(catMontant);
            if (membresCat.length === 0) return;

            // Titre de la catégorie
            doc.setFontSize(12);
            doc.setTextColor(0);
            doc.text(`CATÉGORIE : ${this.formatMontant(catMontant)}`, 14, currentY);
            currentY += 5;

            // Préparation des données du tableau
            const tableRows: any[] = [];
            let catTotal = 0;

            membresCat.forEach(m => {
                const row = [
                    `${m.prenom} ${m.nom}`,
                    this.formatMontant(catMontant)
                ];

                // Pour chaque mois, on vérifie si payé
                this.availableMonths.forEach(mois => {
                    const p = (m.paiementsMensuels || []).find(pm => pm.mois === mois);
                    const isPaid = p && (p.avance || 0) >= (p.montant || catMontant);
                    row.push(isPaid ? 'OK' : 'X'); // On utilisera des icônes ou du texte si nécessaire
                    if (p && p.avance) catTotal += p.avance;
                });

                tableRows.push(row);
            });

            totalGeneral += catTotal;

            // Génération du tableau avec autoTable
            autoTable(doc, {
                startY: currentY,
                head: [['Prénoms & Noms', 'Montant', ...this.availableMonths]],
                body: tableRows,
                theme: 'grid',
                headStyles: { fillColor: [7, 90, 38], textColor: 255, halign: 'center' },
                columnStyles: {
                    0: { cellWidth: 50 },
                    1: { cellWidth: 25, halign: 'center' }
                },
                styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
                didParseCell: (data) => {
                    if (data.section === 'body' && data.column.index >= 2) {
                        if (data.cell.raw === 'OK') {
                            data.cell.text = ['V']; // On peut pas mettre de SVG facilement, on met un V vert
                            data.cell.styles.textColor = [16, 185, 129];
                            data.cell.styles.fontStyle = 'bold';
                        } else if (data.cell.raw === 'X') {
                            data.cell.styles.textColor = [220, 53, 69];
                            data.cell.styles.fontStyle = 'bold';
                        }
                    }
                }
            });

            currentY = (doc as any).lastAutoTable.finalY + 10;
            
            // Sous-total catégorie
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(`SOUS-TOTAL ENCAISSÉ : ${this.formatMontant(catTotal)}`, 200, currentY, { align: 'right' });
            currentY += 15;

            // Saut de page si nécessaire
            if (currentY > doc.internal.pageSize.getHeight() - 40) {
                doc.addPage();
                currentY = 20;
            }
        });

        // 4. Footer avec Total Général et Signatures
        if (currentY > doc.internal.pageSize.getHeight() - 60) {
            doc.addPage();
            currentY = 20;
        }

        doc.setDrawColor(7, 90, 38);
        doc.setLineWidth(0.5);
        doc.line(14, currentY, doc.internal.pageSize.getWidth() - 14, currentY);
        currentY += 10;

        doc.setFontSize(14);
        doc.text(`TOTAL GÉNÉRAL ENCAISSÉ : ${this.formatMontant(totalGeneral)}`, 14, currentY);
        currentY += 8;
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'italic');
        doc.text(`Arrêté la présente somme à : ${this.numberToLetters(totalGeneral)} francs CFA`, 14, currentY);
        
        currentY += 20;
        doc.setFont('helvetica', 'normal');
        doc.text(`Fait à Dakar, le ${dateStr}`, doc.internal.pageSize.getWidth() - 60, currentY, { align: 'center' });
        doc.text('Signature & Cachet', doc.internal.pageSize.getWidth() - 60, currentY + 10, { align: 'center' });

        // Sauvegarde
        doc.save('Fiche_Synthese_Natangue.pdf');
    }

    onSaveDetail() {
        console.log('Tentative d\'enregistrement...');
        if (!this.selectedMembre) {
            console.error('Aucun membre sélectionné');
            return;
        }

        Swal.fire({
            title: 'Confirmer ?',
            text: `Voulez-vous enregistrer les modifications pour ${this.selectedMembre?.prenom} ${this.selectedMembre?.nom} ?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#1b5e20',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Oui, enregistrer',
            cancelButtonText: 'Annuler'
        }).then((result) => {
            console.log('Résultat Swal:', result);
            if (result.isConfirmed) {
                try {
                    this.saveDataToStorage();
                    this.closeDetailModal(); // On ferme d'abord la modal
                    
                    Swal.fire({
                        title: 'Enregistré !',
                        text: 'Le suivi a été mis à jour.',
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false,
                        target: 'body' // S'assurer qu'il est sur le corps de la page
                    });
                } catch (error) {
                    console.error('Erreur lors de la sauvegarde:', error);
                    alert('Erreur lors de la sauvegarde locale.');
                }
            }
        });
    }
}
