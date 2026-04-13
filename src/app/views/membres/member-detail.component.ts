import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MemberService } from '../../services/member.service';
import { Member, Cotisation } from '../../models/cotisation.model';
import { ContributionFormComponent } from './contribution-form.component';

@Component({
    selector: 'app-member-detail',
    standalone: true,
    imports: [CommonModule, RouterLink, ContributionFormComponent],
    templateUrl: './member-detail.component.html',
    styleUrls: ['./member-detail.component.scss']
})
export class MemberDetailComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private memberService = inject(MemberService);

    member = signal<Member | null>(null);
    history = computed(() => {
        const m = this.member();
        return m ? this.memberService.getContributionByMemberId(m.id)() : [];
    });

    isFlipped = signal(false);
    showContributionForm = signal(false);

    // Mock data for "Synthese" richness
    qrCodeDataUrl = 'assets/images/qr-mock.png';

    activeTab = signal<'fiche' | 'historique' | 'documents'>('fiche');

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            const found = this.memberService.getMemberById(Number(id));
            if (found) {
                this.member.set(found);
            } else {
                this.router.navigate(['/membres']);
            }
        }
    }

    get age(): number {
        const m = this.member();
        return m ? this.memberService.calculateAge(m.dateNaissance) : 0;
    }

    formatMontant(v: number) {
        return this.memberService.formatMontant(v);
    }

    onAddContribution() {
        this.showContributionForm.set(true);
    }

    closeModal() {
        this.showContributionForm.set(false);
    }
}
