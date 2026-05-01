import { Injectable, signal, computed, inject } from '@angular/core';
import { Member, Cotisation, CategorieCotisation, StatutCotisation } from '../models/cotisation.model';
import { MemberService } from './member.service';

@Injectable({
    providedIn: 'root'
})
export class CotisationService {
    private memberService = inject(MemberService);

    members = this.memberService.getMembers();
    allCotisations = this.memberService.getAllCotisations();

    stats = computed(() => {
        const allMembers = this.members();
        const cotis = this.allCotisations();

        let totalRecu = 0;
        let totalAttendu = 0;
        let arrieres = 0;
        let avances = 0;

        allMembers.forEach(m => {
            totalAttendu += Number(m.categorie_id) || 0;
        });

        cotis.forEach(c => {
            totalRecu += c.montantVerse;
            const member = this.memberService.getMemberById(c.membreId);
            const catVal = member ? Number(member.categorie_id) || 0 : 0;
            
            if (c.status === 'Rappel') arrieres += (catVal - c.montantVerse);
            if (c.status === 'Avance') avances += (c.montantVerse - catVal);
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

    getStats() {
        return this.stats;
    }
}
