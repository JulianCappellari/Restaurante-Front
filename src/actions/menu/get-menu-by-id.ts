'use server'

import axios from "axios"
import { IMenu, IDishCustomization } from "@/interfaces";

export const getMenuById = async (id: number): Promise<IMenu> => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL2;
    
    if (!API_URL) {
        throw new Error("API_URL no está definido en las variables de entorno");
    }

    try {
        const { data } = await axios.get<IMenu>(`${API_URL}/menu/${id}`);
        
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
                menuId: c.menuId
            }))
        };

        return menuItem;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error("Error al obtener el menú:", error.response?.data || error.message);
            throw new Error(error.response?.data?.message || "Error al obtener el menú");
        }
        console.error("Error inesperado al obtener el menú:", error);
        throw new Error("Error inesperado al obtener el menú");
    }
}