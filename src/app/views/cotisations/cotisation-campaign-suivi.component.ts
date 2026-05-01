import { Component, OnInit, OnDestroy, signal, computed, ChangeDetectorRef, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { MembreCotisation, CotisationMois } from '../../models/cotisation.model';
import { FormsModule } from '@angular/forms';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { CotisationMemberImportModalComponent } from './cotisation-member-import-modal.component';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-cotisation-campaign-suivi',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule, PaginationComponent, CotisationMemberImportModalComponent],
    templateUrl: './cotisation-campaign-suivi.component.html',
    styleUrls: ['./cotisation-campaign-suivi.component.scss']
})
export class CotisationCampaignSuiviComponent implements OnInit, OnDestroy {
    campagneId: number = 0;
    activeTab = signal<number>(10000); 
    currentPage = signal(1);
    itemsPerPage = 10;
    totalItems = 0;
    isExportOpen = signal(false);

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!target.closest('.db-export-container')) {
            this.isExportOpen.set(false);
        }
    }

    toggleExport(event: Event) {
        event.stopPropagation();
        this.isExportOpen.update(v => !v);
    }

    categories = signal<any[]>([]);

    membres = signal<MembreCotisation[]>([]);

    showDetailModal: boolean = false;
    selectedMembre: MembreCotisation | null = null;
    showImportModal: boolean = false;

    allCotisations = signal<any[]>([]);
    allMembres = signal<any[]>([]);

    private realtimeSubscription?: any;
    Math = Math;

    private cdr = inject(ChangeDetectorRef);

    // Totaux calculés par catégorie active
    totalEncaisseCategorie = computed(() => {
        const currentMembres = this.membres(); // Dépendance au Signal
        if (!currentMembres || currentMembres.length === 0) return 0;
        
        return currentMembres.reduce((sum, m) => sum + this.getTotalEncaisseMembre(m), 0);
    });

    totalGeneralCampagne = computed(() => {
        return this.allCotisations().reduce((sum, c) => sum + (Number(c.avance) || 0), 0);
    });

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private supabase: SupabaseService
    ) { }

    async ngOnInit() {
        this.route.paramMap.subscribe(async params => {
            this.campagneId = Number(params.get('id')) || 1;
            await this.loadAllData();
            this.loadMembres();
            this.setupRealtime();
        });
    }

    ngOnDestroy() {
        if (this.realtimeSubscription) {
            this.realtimeSubscription.unsubscribe();
        }
    }

    async loadAllData() {
        try {
            const cats = await this.supabase.getCategories();
            this.categories.set(cats.map((c: any) => ({ montant: c.montant, libelle: this.formatMontant(c.montant) })));
            
            if (this.activeTab() === 0 && cats.length > 0) {
                this.activeTab.set(cats[0].montant);
            }

            const cotis = await this.supabase.getCotisationsByCampagne(this.campagneId);
            const members = await this.supabase.getMembersByCampagne(this.campagneId);
            this.allCotisations.set(cotis);
            this.allMembres.set(members);
            this.loadMembres();
        } catch (e) {
            console.error('Erreur chargement données globales:', e);
            Swal.fire('Erreur', 'Impossible de charger les données globales.', 'error');
        }
    }

    async setupRealtime() {
        this.realtimeSubscription = this.supabase.subscribeToChanges('cotisations', () => {
            this.loadAllData();
        });
    }

    async loadMembres() {
        const allM = this.allMembres();
        const activeCatId = String(this.activeTab());
        const filtered = allM.filter(m => String(m.categorie_id) === activeCatId);
        
        this.totalItems = filtered.length;
        
        const from = (this.currentPage() - 1) * this.itemsPerPage;
        const to = from + this.itemsPerPage;
        const membresData = filtered.slice(from, to);

        this.membres.set(membresData.map((m: any) => {
            const memberId = String(m.id);
            // Utilisation de comparaison de chaînes pour plus de robustesse
            const pList = this.allCotisations().filter(c => String(c.membre_id) === memberId);
            const paiementsMensuels: CotisationMois[] = pList.map(c => ({
                id: c.id,
                membreId: c.membre_id,
                mois: c.mois,
                montant: Number(c.montant) || 0,
                statut: c.statut,
                avance: Number(c.avance) || 0,
                reste: Number(c.reste) || 0,
                observation: c.observation
            }));

            const unpaidMonthsCount = paiementsMensuels.filter((p: CotisationMois) =>
                p.statut === 'En retard' || (p.statut !== 'Payé' && p.statut !== 'Avance' && this.isStrictlyPastMonth(p.mois))
            ).length;

            return {
                ...m,
                paiementsMensuels,
                unpaidMonthsCount
            } as MembreCotisation;
        }));
        
        this.cdr.detectChanges();
    }

    setActiveTab(montant: number) {
        this.activeTab.set(montant);
        this.currentPage.set(1);
        this.loadMembres();
    }

    onPageChange(page: number) {
        this.currentPage.set(page);
        this.loadMembres();
    }

    onPageSizeChange(size: number) {
        this.itemsPerPage = size;
        this.currentPage.set(1);
        this.loadMembres();
    }

    getTotalPayeByCategorie(montant: number): number {
        return this.totalEncaisseCategorie();
    }

    getTotalGeneral(): number {
        return this.totalGeneralCampagne();
    }

    getTotalEncaisseMembre(membre: MembreCotisation): number {
        return (membre.paiementsMensuels || []).reduce((sum: number, p: CotisationMois) => sum + (Number(p.avance) || 0), 0);
    }


    // Vérifie si un mois est STRICTEMENT passé (pour le calcul du retard réel)
    private isStrictlyPastMonth(mois: string): boolean {
        const monthsRange = ["Octobre", "Novembre", "Décembre", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre"];
        const now = new Date();
        const currentMonthName = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"][now.getMonth()];
        const targetIdx = monthsRange.indexOf(mois);
        const currentIdx = monthsRange.indexOf(currentMonthName);
        return targetIdx < currentIdx; // STRICTEMENT inférieur (exclut le mois en cours)
    }

    private isPastOrCurrentMonth(mois: string): boolean {
        const monthsRange = ["Octobre", "Novembre", "Décembre", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre"];
        const now = new Date();
        const currentMonthName = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"][now.getMonth()];
        const targetIdx = monthsRange.indexOf(mois);
        const currentIdx = monthsRange.indexOf(currentMonthName);
        return targetIdx <= currentIdx;
    }


    async quickPay(membre: MembreCotisation) {
        const monthsRange = ["Octobre", "Novembre", "Décembre", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre"];
        const now = new Date();
        const currentMonthName = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"][now.getMonth()];

        const p = membre.paiementsMensuels.find(x => x.mois === currentMonthName);
        if (p && p.statut !== 'Payé') {
            try {
                await this.supabase.updateCotisation(p.id, {
                    avance: p.montant,
                    reste: 0,
                    statut: 'Payé'
                });
                Swal.fire({
                    title: 'Paiement Rapide',
                    text: `${membre.prenom} ${membre.nom} a payé ${this.formatMontant(p.montant)} pour ${currentMonthName}.`,
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
                await this.loadAllData();
                await this.loadMembres();
            } catch (e) {
                Swal.fire('Erreur', 'Impossible d\'effectuer le paiement rapide.', 'error');
            }
        } else {
            Swal.fire('Info', 'Le mois actuel est déjà payé ou non trouvé.', 'info');
        }
    }

    openDetailModal(membre: MembreCotisation) {
        this.selectedMembre = membre;
        this.showDetailModal = true;
    }

    closeDetailModal() {
        this.showDetailModal = false;
        this.selectedMembre = null;
    }

    async onSaveDetail() {
        if (!this.selectedMembre) return;
        try {
            for (const p of this.selectedMembre.paiementsMensuels) {
                let statut = p.statut;
                if (p.avance >= p.montant) statut = 'Payé';
                else if (p.avance > 0) statut = 'Partiel';
                else statut = this.isPastOrCurrentMonth(p.mois) ? 'En retard' : 'En cours';

                await this.supabase.updateCotisation(p.id, {
                    avance: p.avance,
                    reste: Math.max(0, p.montant - p.avance),
                    statut: statut
                });
            }
            this.closeDetailModal();
            Swal.fire('Enregistré', 'Les cotisations ont été mises à jour.', 'success');
            await this.loadAllData();
            await this.loadMembres();
        } catch (e) {
            Swal.fire('Erreur', 'Impossible d\'enregistrer les modifications.', 'error');
        }
    }

    onAvanceChange(p: any) {
        p.reste = Math.max(0, p.montant - (p.avance || 0));
    }

    isCurrentMonth(mois: string): boolean {
        const now = new Date();
        const currentMonthName = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"][now.getMonth()];
        return mois === currentMonthName;
    }

    openImportModal() { this.showImportModal = true; }
    closeImportModal() { this.showImportModal = false; }
    async onMembersImported(selectedMembers: any[]) {
        this.closeImportModal();
        Swal.fire({
            title: 'Importation...',
            text: 'Enregistrement des membres et création des calendriers...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        try {
            for (const m of selectedMembers) {
                // 1. Ajouter le membre
                const newMember = await this.supabase.addMember({
                    campagne_id: this.campagneId,
                    prenom: m.prenom,
                    nom: m.nom,
                    sexe: 'H', 
                    categorie_id: m.category || 2000
                });

                // 2. Initialiser son calendrier de 12 mois avec le montant de sa catégorie
                await this.supabase.initializeMemberCotisations(newMember.id, this.campagneId, m.category || 2000);
            }

            Swal.fire({
                title: 'Import réussi !',
                text: `${selectedMembers.length} membre(s) ont été ajoutés à la campagne.`,
                icon: 'success',
                confirmButtonColor: '#064e3b'
            });
            
            await this.loadAllData();
            await this.loadMembres();
        } catch (e) {
            console.error('Import Error:', e);
            Swal.fire('Erreur', 'Une erreur est survenue lors de l\'importation.', 'error');
        }
    }

    formatMontant(v: any) {
        return new Intl.NumberFormat('fr-FR').format(Number(v) || 0) + ' F CFA';
    }

    // ══════════════════════════════════════════════════
    //  EXPORTATION ACTIONS
    // ══════════════════════════════════════════════════
    exporterSynthese() {
        this.isExportOpen.set(false);
        this.generateFicheSynthese();
    }

    exporterDetails() {
        this.isExportOpen.set(false);
        this.generateTableauDetails();
    }

    private generateTableauDetails() {
        const now = new Date();
        const currentYear = now.getFullYear();
        
        let grandTotalVerse = 0;
        let grandTotalReste = 0;
        let tableRows = '';

        const allM = this.allMembres().sort((a, b) => a.nom.localeCompare(b.nom));
        const allC = this.allCotisations();

        for (const m of allM) {
            const memberCotis = allC.filter(c => String(c.membre_id) === String(m.id));
            const totalVerse = memberCotis.reduce((sum, c) => sum + (Number(c.avance) || 0), 0);
            const totalDu = Number(m.categorie_id) * 12;
            const reste = Math.max(0, totalDu - totalVerse);
            
            grandTotalVerse += totalVerse;
            grandTotalReste += reste;

            let statutHtml = '';
            if (reste === 0) statutHtml = '<span style="color: #16a34a; font-weight: bold;">SOLDÉ</span>';
            else if (totalVerse > 0) statutHtml = '<span style="color: #ca8a04; font-weight: bold;">PARTIEL</span>';
            else statutHtml = '<span style="color: #dc2626; font-weight: bold;">NON PAYÉ</span>';

            tableRows += `
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">${m.prenom} ${m.nom.toUpperCase()}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${m.categorie_id} F</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">${this.formatMontant(totalVerse)}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right; color: #dc2626;">${this.formatMontant(reste)}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${statutHtml}</td>
                </tr>
            `;
        }

        const pdfHtml = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #075A26; padding-bottom: 10px;">
                    <h1 style="color: #075A26; margin: 0; text-transform: uppercase;">Tableau Détails des Cotisations</h1>
                    <p style="margin: 5px 0; color: #666;">ASC NATANGUÉ - Campagne ${currentYear}/${currentYear + 1}</p>
                </div>

                <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                    <thead>
                        <tr style="background-color: #075A26; color: white;">
                            <th style="border: 1px solid #075A26; padding: 10px; text-align: left;">Membre</th>
                            <th style="border: 1px solid #075A26; padding: 10px; text-align: center;">Catégorie</th>
                            <th style="border: 1px solid #075A26; padding: 10px; text-align: right;">Total Versé</th>
                            <th style="border: 1px solid #075A26; padding: 10px; text-align: right;">Reste à Payer</th>
                            <th style="border: 1px solid #075A26; padding: 10px; text-align: center;">État Global</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                    <tfoot>
                        <tr style="background-color: #f8f9fa; font-weight: bold; font-size: 12px;">
                            <td colspan="2" style="border: 1px solid #ddd; padding: 10px; text-align: right;">TOTAUX GÉNÉRAUX</td>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: right; color: #16a34a;">${this.formatMontant(grandTotalVerse)}</td>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: right; color: #dc2626;">${this.formatMontant(grandTotalReste)}</td>
                            <td style="border: 1px solid #ddd; padding: 10px; background: white;"></td>
                        </tr>
                    </tfoot>
                </table>

                <div style="margin-top: 40px; display: flex; justify-content: space-between;">
                    <div style="text-align: center; width: 200px;">
                        <p style="font-weight: bold; text-decoration: underline;">Le Trésorier</p>
                        <br><br><br>
                    </div>
                    <div style="text-align: center; width: 200px;">
                        <p style="font-weight: bold; text-decoration: underline;">Le Président</p>
                        <br><br><br>
                    </div>
                </div>
            </div>
        `;

        Swal.fire({
            title: 'Tableau des Détails',
            html: `<div style="max-height: 400px; overflow-y: auto;">${pdfHtml}</div>`,
            width: '1000px',
            showCancelButton: true,
            confirmButtonText: '📥 Télécharger PDF',
            confirmButtonColor: '#075A26',
            cancelButtonText: 'Fermer'
        }).then((result: any) => {
            if (result.isConfirmed) {
                const opt = {
                    margin: 10,
                    filename: `Details_Cotisations_Natangue_${now.toLocaleDateString()}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2 },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };
                const element = document.createElement('div');
                element.innerHTML = pdfHtml;
                (window as any).html2pdf().from(element).set(opt).save();
            }
        });
    }

    private generateFicheSynthese() {
        const moisNoms = ['Janvier','Février','Mars','Avril','Mai','Juin',
                          'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
        const now          = new Date();
        const currentMonth = moisNoms[now.getMonth()];
        const currentYear  = now.getFullYear();

        const cats = [
            { montant: 10000, label: '10 000 F CFA' },
            { montant:  5000, label:  '5 000 F CFA' },
            { montant:  3000, label:  '3 000 F CFA' },
            { montant:  2000, label:  '2 000 F CFA' },
            { montant:  1000, label:  '1 000 F CFA' },
        ];

        let grandTotal   = 0;
        let sectionsHtml = '';

        for (const cat of cats) {
            const catMembers = this.allMembres()
                .filter(m => Number(m.categorie_id) === cat.montant)
                .sort((a: any, b: any) => a.nom.localeCompare(b.nom));

            if (catMembers.length === 0) continue;

            const memberIds = new Set(catMembers.map(m => m.id));
            const catCotis  = this.allCotisations().filter(c => memberIds.has(c.membre_id));

            let catTotal = 0;
            let rows     = '';

            for (const m of catMembers) {
                const cotis = catCotis.filter(c => c.membre_id === m.id);
                const totalVerse = cotis.reduce((s, c) => s + (Number(c.avance) || 0), 0);
                catTotal += totalVerse;

                let obs = '';
                if (totalVerse >= Number(m.categorie_id)) obs = '<span style="color: #15803d; font-weight:600;">À jour</span>';
                else if (totalVerse > 0) obs = '<span style="color: #1d4ed8; font-weight:600;">Partiel</span>';
                else obs = '<span style="color: #dc2626; font-weight:600;">Non payé</span>';

                rows += `
                <tr>
                    <td style="padding: 5px; border-bottom: 1px solid #eee;">${m.prenom} ${m.nom.toUpperCase()}</td>
                    <td style="padding: 5px; border-bottom: 1px solid #eee; text-align: right;">${this.formatMontant(totalVerse)}</td>
                    <td style="padding: 5px; border-bottom: 1px solid #eee; text-align: center;">${obs}</td>
                </tr>`;
            }

            grandTotal += catTotal;

            sectionsHtml += `
            <div style="margin-bottom: 20px; break-inside: avoid;">
                <div style="background: #004d1a; color: #fff; padding: 5px 10px; border-radius: 4px 4px 0 0; display: flex; justify-content: space-between;">
                    <span style="font-weight: 700;">Catégorie ${cat.label}</span>
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th style="background: #f0f7f2; color: #004d1a; padding: 6px; text-align: left; border-bottom: 1px solid #004d1a;">Nom & Prénom</th>
                            <th style="background: #f0f7f2; color: #004d1a; padding: 6px; text-align: right; border-bottom: 1px solid #004d1a;">Montant Versé</th>
                            <th style="background: #f0f7f2; color: #004d1a; padding: 6px; text-align: center; border-bottom: 1px solid #004d1a;">Observation</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>`;
        }

        const grandTotalWords = "Montant calculé"; 

        const pdfHtml = `
<div id="pdf-content" style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1a1a1a; background: #fff; padding: 30px; text-align: left;">
  <div style="text-align: center; border-bottom: 2px solid #004d1a; padding-bottom: 10px; margin-bottom: 20px;">
    <div style="font-size: 18px; font-weight: 800; color: #004d1a; text-transform: uppercase;">COTISATIONS ASC NATANGUÉ 2025/2026</div>
    <div style="font-size: 12px; color: #444; margin-top: 2px;">Récapitulatif des Cotisations – Campagne #${this.campagneId} - ${currentMonth} ${currentYear}</div>
  </div>

  ${sectionsHtml}

  <div style="margin-top: 15px; border: 1px solid #004d1a; padding: 15px; background: #f0f7f2; border-radius: 4px;">
    <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; margin-bottom: 5px;">
      <span>TOTAL GÉNÉRAL</span>
      <span>${this.formatMontant(grandTotal)}</span>
    </div>
  </div>
</div>`;

        Swal.fire({
            title: 'Prévisualisation de la Fiche',
            html: `<div style="max-height: 500px; overflow-y: auto; border: 1px solid #eee; background: #f9f9f9;">${pdfHtml}</div>`,
            width: '900px',
            showCancelButton: true,
            confirmButtonText: '📥 Télécharger en PDF',
            cancelButtonText: 'Fermer',
            confirmButtonColor: '#004d1a'
        }).then((result: any) => {
            if (result.isConfirmed) {
                const opt = {
                    margin:       10,
                    filename:     `Fiche_Synthese_Natangue_Campagne_${this.campagneId}.pdf`,
                    image:        { type: 'jpeg', quality: 0.98 },
                    html2canvas:  { scale: 2 },
                    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };
                const element = document.createElement('div');
                element.innerHTML = pdfHtml;
                (window as any).html2pdf().from(element).set(opt).save();
            }
        });
    }
}
