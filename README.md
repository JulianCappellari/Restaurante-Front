This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
## Pedidos en el salón

1. Entrá a `/recepcion` o `/mozo` con el rol correspondiente. Elegí una mesa disponible o con check-in e indicá cuántas personas se sentaron.
2. Abrí la mesa y usá **Generar QR**. Mostrá el código a los comensales o descargalo para colocarlo en la mesa durante esa visita. Al renovar el QR, el enlace anterior deja de aceptar nuevos ingresos. Al cerrar la mesa, termina el acceso de todos los comensales.
3. El cliente usa el menú desde el celular sin cuenta. Los pedidos llegan a `/chef`. El panel `/mozo` muestra los llamados y los platos listos de todas las mesas abiertas.

El QR usa la dirección desde la que abriste el frontend. Para probar desde otro dispositivo, abrí el panel con un dominio o una IP que el celular pueda alcanzar. En producción, usá HTTPS. El frontend necesita `NEXT_PUBLIC_API_URL2` apuntando a la API existente. El backend requiere su configuración MySQL y un `JWT_SECRET` propio. Al arrancar, crea las tablas de visitas y habilita los pedidos de mesa sin un cliente registrado en el esquema existente.
