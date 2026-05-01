import { Component, Input, Output, EventEmitter, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Member, Cotisation } from '../../models/cotisation.model';
import { MemberService } from '../../services/member.service';

@Component({
    selector: 'app-contribution-form',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './contribution-form.component.html',
    styleUrls: ['./contribution-form.component.scss']
})
export class ContributionFormComponent implements OnInit {
    private memberService = inject(MemberService);

    @Input({ required: true }) member!: Member;
    @Output() close = new EventEmitter<void>();

    months = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    currentYear = new Date().getFullYear();

    form = {
        mois: this.months[new Date().getMonth()],
        annee: this.currentYear,
        montantVerse: 0,
        datePaiement: new Date().toISOString().split('T')[0]
    };

    // Pre-calculate to avoid complexity in template
    categoryAmount = computed(() => this.member ? Number(this.member.categorie_id) : 0);

    constructor() {
        console.log('--- ContributionFormComponent Constructor ---');
    }

    ngOnInit() {
        console.log('--- ContributionFormComponent OnInit --- for member:', this.member?.prenom);
        if (this.member) {
            this.form.montantVerse = this.categoryAmount();
        }
    }

    onSubmit() {
        console.log('--- Submitting Contribution ---', this.form);
        this.memberService.addContribution({
            ...this.form,
            membreId: this.member.id
        });
        this.close.emit();
    }

    formatMontant(v: number) {
        return this.memberService.formatMontant(v);
    }
}
