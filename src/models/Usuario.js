const supabase = require('../config/db');

/**
 * Modelo de Usuario - Adaptado al esquema nuevo (tabla: perfiles)
 * La tabla 'perfiles' es la tabla central de usuarios en el nuevo Supabase.
 * Los admins usan la tabla 'admin_users' (separada).
 */
const Usuario = {
    // Ya no se crea con contraseña aquí — la app móvil usa Supabase Auth
    create: async (newUser) => {
        const { data, error } = await supabase
            .from('perfiles')
            .insert([{
                email: newUser.email,
                nombre_artistico: newUser.name || 'Nuevo Usuario'
            }])
            .select('id')
            .single();

        if (error) throw error;
        return data.id;
    },

    findByEmail: async (email) => {
        const { data, error } = await supabase
            .from('perfiles')
            .select('*')
            .eq('email', email)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    },

    findById: async (id) => {
        const { data, error } = await supabase
            .from('perfiles')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    },

    findAll: async () => {
        const { data, error } = await supabase
            .from('perfiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    update: async (id, userData) => {
        const updates = {};
        if (userData.email) updates.email = userData.email;
        if (userData.name) updates.nombre_artistico = userData.name;
        if (userData.is_active !== undefined) updates.is_active = userData.is_active;

        const { data, error } = await supabase
            .from('perfiles')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data ? data.length : 0;
    },

    delete: async (id) => {
        // Soft delete: marcar como inactivo
        const { error } = await supabase
            .from('perfiles')
            .update({ is_active: false, deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
        return 1;
    },

    updateLastAccess: async (id) => {
        const { error } = await supabase
            .from('perfiles')
            .update({ ultima_conexion: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
        return 1;
    },

    checkEmailExists: async (email) => {
        const { count, error } = await supabase
            .from('perfiles')
            .select('id', { count: 'exact', head: true })
            .eq('email', email.toLowerCase());

        if (error) throw error;
        return count > 0;
    },

    updateProfile: async (id, profileData) => {
        const updates = {};
        if (profileData.nombre_artistico !== undefined) {
            updates.nombre_artistico = profileData.nombre_artistico;
        }
        if (profileData.bio !== undefined) updates.bio = profileData.bio;
        if (profileData.ubicacion !== undefined) updates.ubicacion = profileData.ubicacion;

        if (Object.keys(updates).length === 0) return 0;
        updates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('perfiles')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
        return data ? data.length : 0;
    },

    updateMembership: async (id, plan) => {
        const tipo = (plan || 'regular').toLowerCase();
        const { data, error } = await supabase
            .from('perfiles')
            .update({ ranking_tipo: tipo })
            .eq('id', id);
        if (error) throw error;
        return data ? data.length : 0;
    }
};

module.exports = Usuario;
