'use server'

import axios from "axios"
import { IMenu, IDishCustomization } from "@/interfaces"

export const getAllmenu = async (): Promise<IMenu[]> => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL2;
    
    console.log('API_URL:', API_URL);
    
    if (!API_URL) {
        const errorMsg = "API_URL no está definido en las variables de entorno";
        console.error(errorMsg);
        throw new Error(errorMsg);
    }

    try {
        console.log(`Fetching menu from: ${API_URL}/menu`);
        
        // First, try to get the menu without customizations
        let response;
        try {
            response = await axios.get<IMenu[]>(`${API_URL}/menu`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 10000 // 10 seconds timeout
            });
        } catch (error) {
            // If the error is about customizations, try again without including them
            if (axios.isAxiosError(error) && 
                error.response?.status === 500 && 
                error.response?.data?.error?.includes('customizations')) {
                
                console.log('Customizations association error, trying without customizations...');
                response = await axios.get<IMenu[]>(`${API_URL}/menu?exclude=customizations`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    timeout: 10000
                });
            } else {
                throw error; // Re-throw if it's a different error
            }
        }
        
        console.log('Raw API response:', response);
        
        if (!response.data) {
            throw new Error('La respuesta de la API está vacía');
        }
        
        // Ensure each menu item has the correct structure
        const processedData = response.data.map(menuItem => {
            if (!menuItem.id || !menuItem.nameDish) {
                console.warn('Ítem de menú inválido:', menuItem);
                return null;
            }
            
            // Since we might not have customizations from the API, always initialize as empty array
            const customizations: IDishCustomization[] = [];
            
            return {
                ...menuItem,
                customizations // Always include empty array for customizations
            };
        }).filter(Boolean) as IMenu[]; // Remove any null values
        
        console.log('Processed menu items:', processedData);
        return processedData;
        
    } catch (error) {
        console.error('Error en getAllmenu:');
        
        if (axios.isAxiosError(error)) {
            console.error('Error en la respuesta de la API:', {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                config: {
                    url: error.config?.url,
                    method: error.config?.method,
                    headers: error.config?.headers
                }
            });
            
            const errorMessage = error.response?.data?.message || 
                               error.response?.statusText || 
                               error.message || 
                               'Error al obtener el menú';
            
            throw new Error(`Error del servidor: ${errorMessage}`);
        }
        
        console.error('Error inesperado:', error);
        throw new Error(`Error inesperado: ${error instanceof Error ? error.message : String(error)}`);
    }
}