import axios, { AxiosResponse, AxiosError } from 'axios';

// La URL y el timeout admiten configuración de entorno; si no se proporcionan,
// se usa el servidor de desarrollo y un límite de cinco segundos.
const baseURL = process.env.EXPO_PUBLIC_MOCK_API_URL || 'https://6ad90d0bf89c5702ed9a6438.mockapi.io';
const timeoutParam = process.env.EXPO_PUBLIC_API_TIMEOUT ? parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT, 10) : 5000;

/** Cliente HTTP compartido para las solicitudes a la API de medidores. */
export const api = axios.create({
  baseURL,
  timeout: timeoutParam,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Conserva las respuestas exitosas y registra los timeouts antes de propagar
// el error al flujo que inició la solicitud.
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.code === 'ECONNABORTED') {
      console.warn('[API] La solicitud excedió el tiempo límite (timeout).');
    }
    return Promise.reject(error);
  }
);
