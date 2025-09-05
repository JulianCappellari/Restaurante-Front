'use server'

import axios from "axios"
import { IMenu, IDishCustomization } from "@/interfaces";

export const getMenuById = async (id: number): Promise<IMenu | null> => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL2;
    
    if (!API_URL) {
        console.error("API_URL no está definido en las variables de entorno");
        return null;
    }

    try {
        const { data } = await axios.get<IMenu>(`${API_URL}/menu/${id}`);
        
        if (!data) {
            console.warn(`No se encontró el menú con ID: ${id}`);
            return null;
        }
        
        // Ensure customizations array exists and has the correct structure
        const customizations = data.dishCustomizations || data.customizations || [];
        
        const menuItem: IMenu = {
            ...data,
            price: typeof data.price === 'string' ? parseFloat(data.price) : data.price,
            customizations: customizations.map((c: Partial<IDishCustomization> & { id: number; name: string; additionalPrice?: string | number }) => ({
                id: c.id,
                name: c.name,
                additionalPrice: typeof c.additionalPrice === 'string' 
                    ? parseFloat(c.additionalPrice) 
                    : c.additionalPrice || 0,
                isActive: c.isActive !== undefined ? c.isActive : true,
                isDefaultIncluded: c.isDefaultIncluded ?? false,
                isRemovable: c.isRemovable ?? true,
                isRequired: c.isRequired ?? false,
                description: c.description || '',
                menuId: c.menuId || id // Usar el ID del menú principal si no está definido
            }))
        };

        return menuItem;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const errorMessage = error.response?.status === 404 
                ? `Menú con ID ${id} no encontrado`
                : `Error al obtener el menú: ${error.response?.data?.message || error.message}`;
            
            console.error(errorMessage);
        } else {
            console.error("Error inesperado al obtener el menú:", error);
        }
        return null;
    }
}