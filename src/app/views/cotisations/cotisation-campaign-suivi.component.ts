import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { Categorie, MembreCotisation, PaiementMensuel } from '../../models/cotisation-campaign.model';
import { CotisationMemberImportModalComponent } from './cotisation-member-import-modal.component';
import { SupabaseService } from '../../services/supabase.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-cotisation-campaign-suivi',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, CotisationMemberImportModalComponent, RouterLink, PaginationComponent],
    templateUrl: './cotisation-campaign-suivi.component.html',
    styleUrls: ['./cotisation-campaign-suivi.component.scss']
})
export class CotisationCampaignSuiviComponent implements OnInit, OnDestroy {

    Math = Math;
    campagneId!: number;
    categories: Categorie[] = [
        { id: 1, montant: 1000, actif: true },
        { id: 2, montant: 2000, actif: true },
        { id: 3, montant: 3000, actif: true },
        { id: 4, montant: 5000, actif: true },
        { id: 5, montant: 10000, actif: true },
    ];

    activeTab: number = 1000;
    showImportModal: boolean = false;
    membres: MembreCotisation[] = [];
    
    // Pagination
    currentPage = 1;
    itemsPerPage = 10;
    totalItems = 0;

    showDetailModal: boolean = false;
    selectedMembre: MembreCotisation | null = null;
    monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    availableMonths: string[] = [];
    
    private realtimeSubscription?: any;

    constructor(
        private route: ActivatedRoute, 
        private router: Router,
        private supabase: SupabaseService
    ) { }

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            this.campagneId = Number(params.get('id'));
            this.loadAvailableMonths();
            this.loadMembres();
            this.setupRealtime();
        });
    }

    ngOnDestroy() {
        if (this.realtimeSubscription) {
            this.realtimeSubscription.unsubscribe();
        }
    }

    async loadAvailableMonths() {
        // En pratique, on pourrait charger les infos de la campagne depuis Supabase ici
        this.availableMonths = this.genererListeMois(10, 9); // Octobre à Septembre
    }

    async setupRealtime() {
        this.realtimeSubscription = this.supabase.subscribeToChanges('cotisations', () => {
            this.loadMembres(); // Recharger les données lors de changements
        });
    }

    async loadMembres() {
        try {
            const { data, count } = await this.supabase.getMembresByCategorie(
                this.campagneId, 
                this.activeTab, 
                this.currentPage, 
                this.itemsPerPage
            );
            
            this.totalItems = count || 0;
            const membresData = data as any[];

            // Pour chaque membre, on charge ses cotisations
            this.membres = await Promise.all(membresData.map(async (m) => {
                const cotisations = await this.supabase.getCotisationsByMembre(m.id);
                const paiementsMensuels = cotisations.map((c: any) => ({
                    id: c.id,
                    mois: c.mois,
                    montant: Number(c.montant),
                    statut: c.statut,
                    avance: Number(c.avance),
                    reste: Number(c.reste),
                    observation: c.observation
                }));

                const unpaidMonthsCount = paiementsMensuels.filter((p: any) => 
                    p.statut === 'En retard' || (p.statut !== 'Payé' && p.statut !== 'Avance' && this.isPastOrCurrentMonth(p.mois))
                ).length;

                return {
                    ...m,
                    paiementsMensuels,
                    unpaidMonthsCount
                } as MembreCotisation;
            }));
        } catch (e) {
            console.error('Erreur chargement membres Supabase', e);
        }
    }

    private isPastOrCurrentMonth(nomMois: string): boolean {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const moisIndex = this.getMoisIndex(nomMois);
        return moisIndex <= currentMonth;
    }

    setActiveTab(montant: number) {
        this.activeTab = montant;
        this.currentPage = 1;
        this.loadMembres();
    }

    onPageChange(page: number) {
        this.currentPage = page;
        this.loadMembres();
    }

    onPageSizeChange(size: number) {
        this.itemsPerPage = size;
        this.currentPage = 1;
        this.loadMembres();
    }

    getTotalPayeByCategorie(montant: number): number {
        // Idéalement, faire une requête agrégée Supabase. Ici, on somme les membres chargés.
        return this.membres.reduce((total, m) => total + this.getTotalEncaisseMembre(m), 0);
    }

    getTotalEncaisseMembre(membre: MembreCotisation): number {
        return (membre.paiementsMensuels || []).reduce((sum, p) => sum + (Number(p.avance) || 0), 0);
    }

    getTotalGeneral(): number {
        // Note: Ce total est limité aux membres de l'onglet actif si on n'a pas de requête globale.
        return this.getTotalPayeByCategorie(this.activeTab);
    }

    // --- Actions ---


    async onSaveDetail() {
        if (!this.selectedMembre || !this.selectedMembre.paiementsMensuels) return;

        Swal.fire({
            title: 'Enregistrer ?',
            text: `Mettre à jour les cotisations de ${this.selectedMembre.prenom} ${this.selectedMembre.nom} ?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#1b5e20'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    for (const p of this.selectedMembre!.paiementsMensuels!) {
                        await this.supabase.updateCotisation((p as any).id, {
                            avance: p.avance,
                            reste: p.reste,
                            statut: p.statut,
                            observation: p.observation,
                            updated_at: new Date().toISOString()
                        });
                    }
                    this.closeDetailModal();
                    this.loadMembres();
                    Swal.fire('Succès', 'Données mises à jour sur le cloud.', 'success');
                } catch (e) {
                    console.error('Erreur sauvegarde détails', e);
                    Swal.fire('Erreur', 'Impossible de sauvegarder.', 'error');
                }
            }
        });
    }

    // --- Utilitaires ---
    genererListeMois(debut: number, fin: number): string[] {
        let mois: string[] = [];
        let current = debut;
        while (true) {
            mois.push(this.monthNames[current - 1]);
            if (current === fin) break;
            current++;
            if (current > 12) current = 1;
        }
        return mois;
    }

    getMoisIndex(nomMois: string): number {
        return this.monthNames.indexOf(nomMois) + 1;
    }

    isCurrentMonth(nomMois: string): boolean {
        const now = new Date();
        return this.getMoisIndex(nomMois) === now.getMonth() + 1;
    }

    calculateStatutMensuel(nomMois: string, avance: number, montant: number): string {
        if (avance >= montant) return 'Payé';
        if (avance > 0) return 'Partiel';
        
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentDay = now.getDate();
        const moisIndex = this.getMoisIndex(nomMois);

        if (moisIndex > currentMonth) return 'En cours';
        if (moisIndex < currentMonth) return 'En retard';
        return currentDay >= 10 ? 'En retard' : 'En cours';
    }

    onAvanceChange(paiement: any) {
        paiement.reste = Math.max(0, (paiement.montant || 0) - (paiement.avance || 0));
        paiement.statut = this.calculateStatutMensuel(paiement.mois, paiement.avance || 0, paiement.montant || 0);
    }

    openDetailModal(membre: MembreCotisation) {
        this.selectedMembre = JSON.parse(JSON.stringify(membre)); // Deep copy pour édition
        this.showDetailModal = true;
    }

    closeDetailModal() {
        this.showDetailModal = false;
        this.selectedMembre = null;
    }

    formatMontant(amount: number | string): string {
        if (amount === undefined || amount === null) return '0 F CFA';
        return amount.toLocaleString() + ' F CFA';
    }

    goBack() {
        this.router.navigate(['/cotisations']);
    }

    openImportModal() { this.showImportModal = true; }
    closeImportModal() { this.showImportModal = false; }
    onMembersImported(members: any[]) { this.loadMembres(); this.showImportModal = false; }

    // --- PDF & WhatsApp ---
    generatePDF() {
        const doc = new jsPDF('landscape');
        const now = new Date();
        const dateStr = now.toLocaleDateString('fr-FR');
        
        doc.setFontSize(18);
        doc.setTextColor(7, 90, 38);
        doc.text('COTISATIONS NATANGUÉ 2025/2026', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Fiche de Synthèse - Générée le ${dateStr}`, doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });

        let currentY = 30;
        let totalGeneral = 0;

        const targetCats = [10000, 5000, 3000, 2000, 1000];
        
        targetCats.forEach(catMontant => {
            if (this.activeTab !== catMontant) return; // Limitation actuelle au PDF de l'onglet actif

            const tableRows: any[] = [];
            let catTotal = 0;

            this.membres.forEach(m => {
                const row = [`${m.prenom} ${m.nom}`, this.formatMontant(catMontant)];
                this.availableMonths.forEach(mois => {
                    const p = (m.paiementsMensuels || []).find(pm => pm.mois === mois);
                    const isPaid = p && (p.avance || 0) >= (p.montant || catMontant);
                    row.push(isPaid ? 'OK' : 'X');
                    if (p && p.avance) catTotal += p.avance;
                });
                tableRows.push(row);
            });

            totalGeneral += catTotal;

            autoTable(doc, {
                startY: currentY,
                head: [['Prénoms & Noms', 'Montant', ...this.availableMonths]],
                body: tableRows,
                theme: 'grid',
                headStyles: { fillColor: [7, 90, 38], textColor: 255, halign: 'center' },
                styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
            });

            currentY = (doc as any).lastAutoTable.finalY + 10;
        });

        doc.save('Fiche_Synthese_Natangue.pdf');
    }

    generateWhatsappReport() {
        let report = `*COTISATIONS - Campagne #${this.campagneId}*\n\n`;
        const now = new Date();
        const currentMonthName = this.monthNames[now.getMonth()];
        
        report += `*Catégorie ${this.formatMontant(this.activeTab)}*\n`;
        let total = 0;
        
        this.membres.forEach(m => {
            const p = (m.paiementsMensuels || []).find(pm => pm.mois === currentMonthName);
            if (p && p.avance > 0) {
                report += `- ${m.prenom} ${m.nom} : ${this.formatMontant(p.avance)}\n`;
                total += p.avance;
            }
        });
        
        report += `*Total : ${this.formatMontant(total)}*`;
        navigator.clipboard.writeText(report).then(() => alert("Copié !"));
    }
}
