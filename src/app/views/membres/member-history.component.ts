import { Component, Input, Output, EventEmitter, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Member, Cotisation } from '../../models/cotisation.model';
import { MemberService } from '../../services/member.service';

@Component({
    selector: 'app-member-history',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './member-history.component.html',
    styleUrls: ['./member-history.component.scss']
})
export class MemberHistoryComponent {
    private memberService = inject(MemberService);

    @Input({ required: true }) member!: Member;
    @Output() close = new EventEmitter<void>();

    // Fetch history reactively using the new service structure
    history = computed(() => this.memberService.getMemberHistory(this.member.id)());

    formatMontant(v: number) {
        return this.memberService.formatMontant(v);
    }
}
