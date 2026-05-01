import { Component, OnInit, signal, computed, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CotisationService } from '../../services/cotisation.service';
import { MemberService } from '../../services/member.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
    private cotisationService = inject(CotisationService);
    private memberService = inject(MemberService);

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

    categories = [
        { id: 'all',    nom: "Vue d'Ensemble",   montant: null   },
        { id: 'cat10',  nom: 'Groupe 10 000 F',  montant: '10000' },
        { id: 'honneur',nom: 'Groupe 5 000 F',   montant: '5000'  },
        { id: 'cat3',   nom: 'Groupe 3 000 F',   montant: '3000'  },
        { id: 'cat2',   nom: 'Groupe 2 000 F',   montant: '2000'  },
        { id: 'simples',nom: 'Groupe 1 000 F',   montant: '1000'  },
    ];

    activeTab = signal('all');

    cotisations = this.memberService.getAllCotisations();
    members     = this.memberService.getMembers();

    // ── Global stats computed from active tab ─────────
    filteredStats = computed(() => {
        const tabId     = this.activeTab();
        const activeCat = this.categories.find(c => c.id === tabId);

        let targetMembers = this.members();
        let targetCotis   = this.cotisations();

        if (activeCat?.montant && activeCat.id !== 'all') {
            const targetMontant = Number(activeCat.montant);
            targetMembers = targetMembers.filter(m => Number(m.categorie_id) === targetMontant);
            const memberIds = new Set(targetMembers.map(m => String(m.id)));
            targetCotis = targetCotis.filter(c => memberIds.has(String(c.membreId)));
        }

        let totalRecu = 0, totalAttendu = 0, arrieres = 0, avances = 0;

        targetMembers.forEach(m => { totalAttendu += Number(m.categorie_id) || 0; });

        targetCotis.forEach(c => {
            totalRecu += c.montantVerse;
            const m      = this.memberService.getMemberById(c.membreId);
            const catVal = m ? Number(m.categorie_id) || 0 : 0;
            if (c.status === 'Rappel') arrieres += Math.max(0, catVal - c.montantVerse);
            if (c.status === 'Avance') avances  += Math.max(0, c.montantVerse - catVal);
        });

        const percent = totalAttendu > 0 ? (totalRecu / totalAttendu) * 100 : 0;

        return {
            totalRecu,
            totalAttendu,
            arrieres,
            avances,
            tauxRecouvrement: Math.min(Math.round(percent), 100)
        };
    });

    // ── Recent payments ───────────────────────────────
    filteredRecentPayments = computed(() => {
        const tabId     = this.activeTab();
        const activeCat = this.categories.find(c => c.id === tabId);
        let targetCotis = this.cotisations();

        if (activeCat?.montant && activeCat.id !== 'all') {
            const targetMontant = Number(activeCat.montant);
            const targetMembers = this.members().filter(m => Number(m.categorie_id) === targetMontant);
            const memberIds     = new Set(targetMembers.map(m => String(m.id)));
            targetCotis = targetCotis.filter(c => memberIds.has(String(c.membreId)));
        }

        return targetCotis
            .map(c => {
                const m = this.memberService.getMemberById(c.membreId);
                return { ...c, memberName: m ? `${m.prenom} ${m.nom}` : 'Inconnu' };
            })
            .sort((a, b) => b.id - a.id)
            .slice(0, 6);
    });

    // ── Per-category stats (for category cards) ───────
    getCatStats(montantStr: string | null): { recu: number; attendu: number; arrieres: number } {
        if (!montantStr) return { recu: 0, attendu: 0, arrieres: 0 };
        const montant   = Number(montantStr);
        const catMembers = this.members().filter(m => Number(m.categorie_id) === montant);
        const memberIds  = new Set(catMembers.map(m => String(m.id)));
        const catCotis   = this.cotisations().filter(c => memberIds.has(String(c.membreId)));

        const attendu  = catMembers.length * montant;
        const recu     = catCotis.reduce((s, c) => s + c.montantVerse, 0);
        const arrieres = catCotis
            .filter(c => c.status === 'Rappel')
            .reduce((s, c) => {
                const m = this.memberService.getMemberById(c.membreId);
                return s + Math.max(0, (m ? Number(m.categorie_id) : 0) - c.montantVerse);
            }, 0);

        return { recu, attendu, arrieres };
    }

    // ── Get name of active tab ────────────────────────
    getActiveTabName(): string {
        return this.categories.find(c => c.id === this.activeTab())?.nom ?? '';
    }

    // ── Count members by category (used in template) ──
    getMemberCount(montant: string | null): number {
        if (!montant) return 0;
        return this.members().filter(m => Number(m.categorie_id) === Number(montant)).length;
    }

    // ── Sync ─────────────────────────────────────────
    async syncData() {
        if (confirm('Voulez-vous synchroniser les données locales avec Supabase ? Cela écrasera les données actuelles du cloud.')) {
            try {
                await (this.memberService as any).supabase.initialSyncToSupabase();
                alert('Synchronisation terminée !');
                window.location.reload();
            } catch (err) {
                alert('Erreur lors de la synchronisation');
                console.error(err);
            }
        }
    }

    ngOnInit(): void { }

    formatMontant(v: number) {
        return this.memberService.formatMontant(v);
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
        Swal.fire({
            title: 'Détails des Cotisations',
            text: 'La génération du tableau détaillé est en cours de développement...',
            icon: 'info',
            confirmButtonColor: '#004d1a'
        });
    }

    //  GÉNÉRATION FICHE DE SYNTHÈSE MENSUELLE (PDF)
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
            const catMembers = this.members()
                .filter(m => Number(m.categorie_id) === cat.montant)
                .sort((a, b) => a.nom.localeCompare(b.nom));

            if (catMembers.length === 0) continue;

            const memberIds = new Set(catMembers.map(m => m.id));
            const catCotis  = this.cotisations().filter(c => memberIds.has(c.membreId));

            let catTotal = 0;
            let rows     = '';

            for (const m of catMembers) {
                const cotis = catCotis.filter(c => c.membreId === m.id);
                const totalVerse = cotis.reduce((s, c) => s + c.montantVerse, 0);
                catTotal += totalVerse;

                // Déterminer l'observation
                const rappelCount = cotis.filter(c => c.status === 'Rappel').length;
                const avanceCount = cotis.filter(c => c.status === 'Avance').length;
                let obs = '';
                if (rappelCount > 0) obs = `<span class="obs-rappel">Rappel ${rappelCount} mois</span>`;
                else if (avanceCount > 0) obs = `<span class="obs-avance">Avance</span>`;
                else if (totalVerse > 0) obs = `<span class="obs-ok">À jour</span>`;
                else obs = `<span class="obs-rappel">Non payé</span>`;

                rows += `
                <tr>
                    <td>${m.prenom} ${m.nom.toUpperCase()}</td>
                    <td class="td-right">${this.fmtPdf(totalVerse)}</td>
                    <td class="td-center">${obs}</td>
                </tr>`;
            }

            grandTotal += catTotal;

            sectionsHtml += `
            <div class="section">
                <div class="section-header">
                    <span class="cat-badge">Catégorie ${cat.label}</span>
                    <span class="cat-count">${catMembers.length} membre(s)</span>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Nom & Prénom</th>
                            <th class="td-right">Montant Versé</th>
                            <th class="td-center">Observation</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                    <tfoot>
                        <tr class="total-row">
                            <td><strong>Total ${cat.label}</strong></td>
                            <td class="td-right"><strong>${this.fmtPdf(catTotal)}</strong></td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>`;
        }

        const grandTotalWords = this.numberToWordsFr(grandTotal);

        const pdfHtml = `
<div id="pdf-content" style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1a1a1a; background: #fff; padding: 30px; text-align: left;">
  <div style="text-align: center; border-bottom: 2px solid #004d1a; padding-bottom: 10px; margin-bottom: 20px;">
    <div style="font-size: 18px; font-weight: 800; color: #004d1a; text-transform: uppercase;">COTISATIONS ASC NATANGUÉ 2025/2026</div>
    <div style="font-size: 12px; color: #444; margin-top: 2px;">Récapitulatif des Cotisations – Fin ${currentMonth} ${currentYear}</div>
  </div>

  <style>
    .pdf-section { margin-bottom: 20px; break-inside: avoid; }
    .pdf-header { background: #004d1a; color: #fff; padding: 5px 10px; border-radius: 4px 4px 0 0; display: flex; justify-content: space-between; align-items: center; }
    .pdf-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    .pdf-table th { background: #f0f7f2; color: #004d1a; font-weight: 700; font-size: 10px; text-transform: uppercase; padding: 6px; border-bottom: 1px solid #004d1a; text-align: left; }
    .pdf-table td { padding: 5px; border-bottom: 1px solid #eee; font-size: 10px; }
    .pdf-total td { background: #e8f5e9 !important; font-weight: 700; border-top: 1px solid #004d1a; }
  </style>

  ${sectionsHtml.replace(/class="section"/g, 'class="pdf-section"')
                .replace(/class="section-header"/g, 'class="pdf-header"')
                .replace(/<table>/g, '<table class="pdf-table">')
                .replace(/class="total-row"/g, 'class="pdf-total"')}

  <div style="margin-top: 15px; border: 1px solid #004d1a; padding: 15px; background: #f0f7f2; border-radius: 4px;">
    <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; margin-bottom: 5px;">
      <span>TOTAL GÉNÉRAL</span>
      <span>${this.fmtPdf(grandTotal)} FCFA</span>
    </div>
    <div style="font-size: 11px; font-style: italic; color: #004d1a; border-top: 1px solid #ccc; padding-top: 5px;">
      En lettres : ${grandTotalWords} francs CFA
    </div>
  </div>
</div>`;

        // Afficher la visualisation dans un SweetAlert2
        Swal.fire({
            title: 'Prévisualisation de la Fiche',
            html: `
                <div style="max-height: 500px; overflow-y: auto; border: 1px solid #eee; background: #f9f9f9;">
                    ${pdfHtml}
                </div>
            `,
            width: '900px',
            showCancelButton: true,
            confirmButtonText: '📥 Télécharger en PDF',
            cancelButtonText: 'Fermer',
            confirmButtonColor: '#004d1a',
            customClass: {
                container: 'pdf-preview-modal'
            }
        }).then((result: any) => {
            if (result.isConfirmed) {
                const opt = {
                    margin:       10,
                    filename:     `Fiche_Synthese_Natangue_${currentMonth}_${currentYear}.pdf`,
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

    /** Formatte un nombre pour le PDF (sans le service Angular) */
    private fmtPdf(v: number): string {
        return new Intl.NumberFormat('fr-FR').format(v) + ' F';
    }

    /** Conversion nombre → lettres en français */
    private numberToWordsFr(n: number): string {
        if (n === 0) return 'zéro';
        const u = ['','un','deux','trois','quatre','cinq','six','sept','huit','neuf',
                   'dix','onze','douze','treize','quatorze','quinze','seize','dix-sept','dix-huit','dix-neuf'];
        const d = ['','','vingt','trente','quarante','cinquante','soixante','soixante','quatre-vingt','quatre-vingt'];

        const belowHundred = (x: number): string => {
            if (x < 20)  return u[x];
            const di = Math.floor(x / 10);
            const ui = x % 10;
            if (di === 7) return ui === 1 ? 'soixante et onze' : `soixante-${u[10 + ui]}`;
            if (di === 9) return `quatre-vingt-${u[10 + ui]}`;
            if (ui === 0) return d[di] + (di === 8 ? 's' : '');
            if (ui === 1 && di !== 8) return `${d[di]} et un`;
            return `${d[di]}-${u[ui]}`;
        };

        const belowThousand = (x: number): string => {
            if (x < 100) return belowHundred(x);
            const h = Math.floor(x / 100);
            const r = x % 100;
            const prefix = h === 1 ? 'cent' : `${u[h]} cent${r === 0 && h > 1 ? 's' : ''}`;
            return r === 0 ? prefix : `${prefix} ${belowHundred(r)}`;
        };

        if (n < 1000) return belowThousand(n);

        const millions = Math.floor(n / 1_000_000);
        const thousands = Math.floor((n % 1_000_000) / 1000);
        const remainder = n % 1000;

        let result = '';
        if (millions > 0) {
            result += (millions === 1 ? 'un million' : `${belowThousand(millions)} millions`) + ' ';
        }
        if (thousands > 0) {
            result += (thousands === 1 ? 'mille' : `${belowThousand(thousands)} mille`) + ' ';
        }
        if (remainder > 0) {
            result += belowThousand(remainder);
        }
        return result.trim();
    }
}

