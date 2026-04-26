import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
    providedIn: 'root'
})
export class SupabaseService {
    private supabase: SupabaseClient;

    constructor() {
        const supabaseUrl = 'https://mboimxjqicnvzcleekue.supabase.co';
        const supabaseKey = 'sb_publishable_xE-SzjKf_zqEz3_q-yTcvA_Ib6b5jmA';
        this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    get client() {
        return this.supabase;
    }

    async signIn(email: string, password: string) {
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        return data;
    }

    async signUp(email: string, password: string) {
        const { data, error } = await this.supabase.auth.signUp({
            email,
            password
        });
        if (error) throw error;
        return data;
    }

    async signOut() {
        const { error } = await this.supabase.auth.signOut();
        if (error) throw error;
    }

    async getSession() {
        const { data, error } = await this.supabase.auth.getSession();
        if (error) throw error;
        return data.session;
    }

    async getMembers() {
        const { data, error } = await this.supabase
            .from('members')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;
        return data;
    }

    async getCotisations() {
        const { data, error } = await this.supabase
            .from('cotisations')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;
        return data;
    }

    async addMember(member: any) {
        const { data, error } = await this.supabase
            .from('members')
            .insert([member])
            .select();

        if (error) throw error;
        return data[0];
    }

    async updateMember(id: number, member: any) {
        const { data, error } = await this.supabase
            .from('members')
            .update(member)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data[0];
    }

    async addCotisation(cotisation: any) {
        const { data, error } = await this.supabase
            .from('cotisations')
            .insert([cotisation])
            .select();

        if (error) throw error;
        return data[0];
    }

    subscribeToChanges(table: string, callback: () => void) {
        return this.supabase
            .channel(`${table}_changes`)
            .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
            .subscribe();
    }
}
