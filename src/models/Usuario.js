const supabase = require('../config/db');

const Usuario = {
    create: async (newUser) => {
        const { data, error } = await supabase
            .from('Usuarios')
            .insert([
                {
                    correo_electronico: newUser.email,
                    contraseña: newUser.password,
                    nombre_completo: newUser.name
                }
            ])
            .select('id_usuario')
            .single();

        if (error) throw error;
        // Supabase .single() returns data object directly, not wrapped in another data property for insert usually if select is chained?
        // Wait, .insert().select().single() returns { data: { id_usuario: ... }, error }
        // So data.id_usuario is correct.
        return data.id_usuario;
    },

    findByEmail: async (email) => {
        const { data, error } = await supabase
            .from('Usuarios')
            .select('*')
            .eq('correo_electronico', email)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // No se encontró
            throw error;
        }
        return data;
    },

    findById: async (id) => {
        const { data, error } = await supabase
            .from('Usuarios')
            .select('*')
            .eq('id_usuario', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    },

    findAll: async () => {
        // Nota: El query original tenía una subconsulta para es_destacado.
        // En Supabase/PostgREST es más fácil hacerlo con vistas o funciones, 
        // o simplemente traer los datos y procesar.
        // Por simplicidad en esta migración, traemos los usuarios.
        const { data, error } = await supabase
            .from('Usuarios')
            .select('*')
            .eq('es_admin', false)
            .order('fecha_registro', { ascending: false });

        if (error) throw error;
        return data;
    },

    update: async (id, userData) => {
        const updates = {};
        if (userData.email) updates.correo_electronico = userData.email;
        if (userData.password) updates.contraseña = userData.password;
        if (userData.name) updates.nombre_completo = userData.name;
        if (userData.estado_cuenta) updates.estado_cuenta = userData.estado_cuenta;

        const { data, error, count } = await supabase
            .from('Usuarios')
            .update(updates)
            .eq('id_usuario', id)
            .select();

        if (error) throw error;
        return count || (data ? data.length : 0);
    },

    delete: async (id) => {
        const { error, count } = await supabase
            .from('Usuarios')
            .delete()
            .eq('id_usuario', id);

        if (error) throw error;
        return count;
    },

    updateLastAccess: async (id) => {
        const { data, error, count } = await supabase
            .from('Usuarios')
            .update({ fecha_ultimo_acceso: new Date().toISOString() })
            .eq('id_usuario', id);

        if (error) throw error;
        return count || (data ? data.length : 0);
    },

    checkEmailExists: async (email) => {
        const { count, error } = await supabase
            .from('Usuarios')
            .select('id_usuario', { count: 'exact', head: true })
            .eq('correo_electronico', email.toLowerCase());

        if (error) throw error;
        return count > 0;
    },

    updateProfile: async (id, profileData) => {
        const updates = {};
        if (profileData.nombre_completo !== undefined) {
            updates.nombre_completo = profileData.nombre_completo;
        }

        if (Object.keys(updates).length === 0) return 0;

        const { data, error, count } = await supabase
            .from('Usuarios')
            .update(updates)
            .eq('id_usuario', id);

        if (error) throw error;
        return count || (data ? data.length : 0);
    },

    updatePassword: async (id, hashedPassword) => {
        const { data, error, count } = await supabase
            .from('Usuarios')
            .update({ contraseña: hashedPassword })
            .eq('id_usuario', id);

        if (error) throw error;
        return count || (data ? data.length : 0);
    },

    registrarAccionMembresia: async (userId, tipoAccion) => {
        const { error } = await supabase
            .from('Uso_Membresia')
            .insert([{ id_usuario: userId, tipo_accion: tipoAccion }]);

        if (error) throw error;
        return true;
    },

    getAccionesSemanales: async (userId, tipoAccion) => {
        const scanningDate = new Date();
        scanningDate.setDate(scanningDate.getDate() - 7);

        const { count, error } = await supabase
            .from('Uso_Membresia')
            .select('id', { count: 'exact', head: true })
            .eq('id_usuario', userId)
            .eq('tipo_accion', tipoAccion)
            .gte('fecha_accion', scanningDate.toISOString());

        if (error) throw error;
        return count;
    },

    updateMembership: async (id, plan) => {
        const tipo = (plan || 'pro').toLowerCase();
        const { data, error, count } = await supabase
            .from('Usuarios')
            .update({ tipo_membresia: tipo })
            .eq('id_usuario', id);
        if (error) throw error;
        return count || (data ? data.length : 0);
    }
};

module.exports = Usuario;
