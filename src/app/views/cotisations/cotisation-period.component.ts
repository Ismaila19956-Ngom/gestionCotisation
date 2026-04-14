import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface MemberCotisation {
    id: number;
    memberId: number;
    memberName: string;
    category: string;
    amountDue: number;
    isPaid: boolean;
}

@Component({
    selector: 'app-cotisation-period',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './cotisation-period.component.html',
    styleUrls: ['./cotisation-period.component.scss']
})
export class CotisationPeriodComponent implements OnInit {
    selectedMonth: number = new Date().getMonth(); // 0 to 11
    selectedYear: number = new Date().getFullYear();

    months = [
        { value: 0, label: 'Janvier' },
        { value: 1, label: 'Février' },
        { value: 2, label: 'Mars' },
        { value: 3, label: 'Avril' },
        { value: 4, label: 'Mai' },
        { value: 5, label: 'Juin' },
        { value: 6, label: 'Juillet' },
        { value: 7, label: 'Août' },
        { value: 8, label: 'Septembre' },
        { value: 9, label: 'Octobre' },
        { value: 10, label: 'Novembre' },
        { value: 11, label: 'Décembre' }
    ];

    years: number[] = [];

    // Static mock data
    membersData: MemberCotisation[] = [
        { id: 1, memberId: 101, memberName: 'Mamadou Ndiaye', category: 'Actif', amountDue: 5000, isPaid: true },
        { id: 2, memberId: 102, memberName: 'Aissatou Sow', category: 'Sympathisant', amountDue: 2000, isPaid: false },
        { id: 3, memberId: 103, memberName: 'Ibrahima Fall', category: 'Actif', amountDue: 5000, isPaid: false },
    ];

    constructor() {
        const currentYear = new Date().getFullYear();
        for (let i = currentYear - 5; i <= currentYear + 2; i++) {
            this.years.push(i);
        }
    }

    ngOnInit() {
        this.refreshData();
    }

    isPeriodOpen(): boolean {
        const now = new Date();
        // In Angular/JS, months are 0-indexed.
        return this.selectedMonth === now.getMonth() && this.selectedYear === now.getFullYear();
    }

    getPaymentStatus(isPaid: boolean): { label: string, cssClass: string } {
        if (isPaid) {
            return { label: 'Payé', cssClass: 'status-paid' };
        }

        if (!this.isPeriodOpen()) {
            // Past period and not paid = Retardataire
            return { label: 'Retardataire', cssClass: 'status-late' };
        }

        const todayDate = new Date().getDate();
        // Current period and not paid
        if (todayDate <= 10) {
            return { label: 'En attente', cssClass: 'status-pending' };
        } else {
            return { label: 'Retardataire', cssClass: 'status-late' };
        }
    }

    onPeriodChange() {
        this.refreshData();
    }

    refreshData() {
        // In a real application, you would make an API call to get members and their payments for selected period.
        console.log(`Loading data for ${this.selectedMonth + 1}/${this.selectedYear}`);
    }

    addCotisation() {
        if (this.isPeriodOpen()) {
            console.log('Open modal to add cotisation');
            // Implémentation du modal / redirection vers formulaire d'ajout
        }
    }
}
