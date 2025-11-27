# Instrucciones de Uso

Este documento explica cómo usar las funciones clave de la aplicación, incluyendo la creación de pedidos de entrega y la visualización de los mismos en la interfaz del repartidor.

## Iniciar la Aplicación

Para que todas las funcionalidades operen correctamente, la aplicación debe iniciarse desde la terminal con el siguiente comando:

```bash
npm run dev
```

Esto iniciará tanto el servidor de desarrollo de Vite (frontend) como el servidor de API de Node.js (backend).

## Simular la Creación de un Pedido para Entrega

Para conectar el "Punto de Venta" con la vista del "Repartidor", siga estos pasos:

1.  **Abra el Punto de Venta (POS):**
    *   Navegue a la página `/ventas/mostrador`.

2.  **Añada productos al pedido:**
    *   Haga clic en uno o más productos de la cuadrícula "Venta Directa". Aparecerán en el resumen del pedido a la derecha.

3.  **Busque o cree un cliente:**
    *   En el resumen del pedido, haga clic en "Agregar Cliente".
    *   En el modal que aparece, escriba **5512345678** y haga clic en "Buscar".
    *   Aparecerá un cliente de prueba ("Juan Pérez"). Haga clic en "Agregar al Pedido".

4.  **Seleccione el método de entrega:**
    *   En el resumen del pedido, haga clic en el botón "Entrega" (actualmente debería decir "mostrador").
    *   En el modal que aparece, seleccione **"Entrega a Domicilio"**.
    *   Verifique que los datos del cliente ("Juan Pérez") estén rellenados.
    *   Haga clic en **"Guardar"**.

5.  **Finalice el Pedido:**
    *   En el resumen del pedido, haga clic en el botón **"Pagar"**.
    *   En el modal de pago, haga clic en **"Confirmar Pago"**.

## Verificar la Conexión con el Repartidor

Después de seguir los pasos anteriores, el pedido ha sido creado y asignado al repartidor.

1.  **Abra la vista del Repartidor:**
    *   Navegue a la página `/repartidor`.

2.  **Verifique el pedido:**
    *   El pedido que acaba de crear para "Juan Pérez" debería aparecer en la lista de "Pedidos Asignados" a la izquierda.
    *   También debería ver un marcador para este pedido en el mapa.

Si sigue estos pasos y el pedido no aparece en la vista del repartidor, por favor, abra las herramientas de desarrollador del navegador (presionando F12) y copie cualquier mensaje de error que vea en la pestaña "Consola".
