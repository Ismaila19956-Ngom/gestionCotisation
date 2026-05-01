import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-galerie',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './galerie.component.html',
  styleUrls: ['./galerie.component.scss']
})
export class GalerieComponent implements OnInit {
  private supabase = inject(SupabaseService);

  // États pour l'affichage
  images = signal<any[]>([]);
  isLoading = signal(true);
  showUploadModal = signal(false);

  // États pour l'upload
  titre = signal('');
  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  isUploading = signal(false);

  async ngOnInit() {
    await this.loadImages();
  }

  async loadImages() {
    this.isLoading.set(true);
    try {
      const { data, error } = await this.supabase.client
        .from('galerie')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      this.images.set(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      this.isLoading.set(false);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        Swal.fire('Erreur', 'Veuillez sélectionner une image.', 'error');
        return;
      }
      this.selectedFile.set(file);
      const reader = new FileReader();
      reader.onload = () => this.previewUrl.set(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  async compressImage(file: File): Promise<Blob> {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max_size = 1200;
        if (width > height) {
          if (width > max_size) { height *= max_size / width; width = max_size; }
        } else {
          if (height > max_size) { width *= max_size / height; height = max_size; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.8);
      };
    });
  }

  async uploadImage() {
    if (!this.selectedFile() || !this.titre()) {
      Swal.fire('Attention', 'Titre et image requis.', 'warning');
      return;
    }

    this.isUploading.set(true);
    try {
      const compressedBlob = await this.compressImage(this.selectedFile()!);
      const fileName = `galerie/${Date.now()}_${this.selectedFile()!.name.replace(/\s/g, '_')}`;

      const { data: uploadData, error: uploadError } = await this.supabase.client.storage
        .from('galerie-foot')
        .upload(fileName, compressedBlob);

      if (uploadError) throw uploadError;

      const { data: urlData } = this.supabase.client.storage
        .from('galerie-foot')
        .getPublicUrl(fileName);

      const { error: dbError } = await this.supabase.client
        .from('galerie')
        .insert([{ 
          titre: this.titre(), 
          image_url: urlData.publicUrl,
          statut: 'brouillon' // Par défaut en brouillon
        }]);

      if (dbError) throw dbError;

      Swal.fire('Succès', 'Image ajoutée (mode brouillon) !', 'success');
      this.closeModal();
      await this.loadImages();
    } catch (error: any) {
      Swal.fire('Erreur', error.message, 'error');
    } finally {
      this.isUploading.set(false);
    }
  }

  async toggleStatut(image: any) {
    const nouveauStatut = image.statut === 'publier' ? 'brouillon' : 'publier';

    try {
      const { error } = await this.supabase.client
        .from('galerie')
        .update({ statut: nouveauStatut })
        .eq('id', image.id);

      if (error) throw error;

      // Mise à jour locale du signal
      this.images.update(imgs => 
        imgs.map(i => i.id === image.id ? { ...i, statut: nouveauStatut } : i)
      );

      Swal.fire({
        title: nouveauStatut === 'publier' ? 'Publié !' : 'Retiré !',
        text: nouveauStatut === 'publier' ? 'La photo est en ligne.' : 'La photo est repassée en brouillon.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (e) {
      Swal.fire('Erreur', 'Action impossible.', 'error');
    }
  }

  async deleteImage(image: any) {
    const result = await Swal.fire({
      title: 'Supprimer ?',
      text: "Cette action est irréversible.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer'
    });

    if (result.isConfirmed) {
      try {
        // 1. Tentative de suppression du fichier (on ignore si ça échoue)
        const urlParts = image.image_url.split('/');
        const fileName = `galerie/${urlParts[urlParts.length - 1]}`;
        await this.supabase.client.storage.from('galerie-foot').remove([fileName]);

        // 2. Suppression CRITIQUE dans la base de données
        const { error, count } = await this.supabase.client
          .from('galerie')
          .delete()
          .eq('id', image.id);

        if (error) throw error;
        
        console.log('Suppression réussie, lignes affectées:', count);

        // 3. Mise à jour immédiate de l'interface
        this.images.update(imgs => imgs.filter(i => i.id !== image.id));
        
        Swal.fire({
          title: 'Supprimé !',
          text: "L'image a été retirée avec succès.",
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      } catch (e) {
        console.error(e);
        Swal.fire('Erreur', 'Impossible de supprimer la donnée en base.', 'error');
      }
    }
  }

  openModal() { this.showUploadModal.set(true); }
  closeModal() {
    this.showUploadModal.set(false);
    this.titre.set('');
    this.selectedFile.set(null);
    this.previewUrl.set(null);
  }
}
