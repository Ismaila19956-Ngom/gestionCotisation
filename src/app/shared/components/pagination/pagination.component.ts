import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pagination-bar">
        <div class="pagination-left">
            <span>Afficher </span>
            <select class="page-size-select" [value]="itemsPerPage"
                (change)="onPageSizeChange($event)">
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="200">200</option>
            </select>
            <span> lignes</span>
        </div>

        <div class="pagination-center">
            Page {{currentPage}} sur {{totalPages}} · {{totalItems}} résultat(s)
        </div>

        <div class="pagination-right">
            <button class="btn-pagination" [disabled]="currentPage === 1" (click)="setPage(1)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="11 17 6 12 11 7" />
                    <polyline points="18 17 13 12 18 7" />
                </svg>
            </button>
            <button class="btn-pagination" [disabled]="currentPage === 1" (click)="setPage(currentPage - 1)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="15 18 9 12 15 6" />
                </svg>
            </button>
            <button class="btn-pagination active">{{currentPage}}</button>
            <button class="btn-pagination" [disabled]="currentPage === totalPages"
                (click)="setPage(currentPage + 1)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6" />
                </svg>
            </button>
            <button class="btn-pagination" [disabled]="currentPage === totalPages" (click)="setPage(totalPages)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="13 17 18 12 13 7" />
                    <polyline points="6 17 11 12 6 7" />
                </svg>
            </button>
        </div>
    </div>
  `,
  styles: [`
    .pagination-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        background: white;
        border-top: 1px solid #f1f5f9;
        font-size: 0.875rem;
        color: #64748b;
    }

    .page-size-select {
        padding: 0.25rem 0.5rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.375rem;
        margin: 0 0.5rem;
        color: #1e293b;
        font-weight: 500;
        outline: none;
        cursor: pointer;
    }

    .btn-pagination {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: 1px solid #e2e8f0;
        background: white;
        border-radius: 0.375rem;
        margin-left: 0.5rem;
        cursor: pointer;
        transition: all 0.2s;
        color: #64748b;

        &:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }

        &:not(:disabled):hover {
            background: #f8fafc;
            border-color: #cbd5e1;
            color: #1e293b;
        }

        &.active {
            background: #075A26;
            border-color: #075A26;
            color: white;
            font-weight: 600;
        }
    }

    @media (max-width: 640px) {
        .pagination-bar {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
        }
        .pagination-left, .pagination-right {
            justify-content: center;
        }
    }
  `]
})
export class PaginationComponent {
  @Input() currentPage: number = 1;
  @Input() totalPages: number = 1;
  @Input() totalItems: number = 0;
  @Input() itemsPerPage: number = 10;

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  setPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.pageChange.emit(page);
    }
  }

  onPageSizeChange(event: any) {
    this.pageSizeChange.emit(+event.target.value);
  }
}
