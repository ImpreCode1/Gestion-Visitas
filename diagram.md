```mermaid
flowchart TD
    A([Inicio]) --> B["Login usuario.dominio + contraseña"]
    B --> C["Registro de viaje: punto A → punto B"]
    C --> N1["📧 Notificación: Se informa a quien deba gestionar la solicitud"]
    N1 --> D{"¿Qué tipo de viaje?"}

    %% =========================
    %% RAMA 1 - Sin avión / Sin fondos
    %% =========================
    D -->|"No avión / No fondos de fábrica"| N5["📧 Notificación: Persona que solicita la visita se le notifica autorización y Suministros Internos recibe aviso para gestión de plataformas"]
    N5 --> E["Suministros Internos gestiona plataformas de transporte"]
    E --> N8["📧 Notificación: Persona que solicita la visita recibe confirmación de que la gestión de Suministros Internos ha sido realizada"]
    N8 --> P[Se Asigna el GV correspondiente]
    P --> Q([Fin])

    %% =========================
    %% RAMA 2 - Viaje con avión
    %% =========================
    D -->|"Requiere tiquetes aéreos"| F["📧 Notificación: Vicepresidencia del área correspondiente recibe solicitud"]
    F --> G{"¿Aprobado?"}
    G -->|"No"| X([Fin - Rechazado])
    G -->|"Sí"| N4["📧 Notificación: Persona que solicita la visita se le notifica autorización y Suministros Internos y Compras Internas reciben aviso para gestión"]
    N4 --> H["Suministros Internos gestiona plataformas y Compras Internas compra tiquetes"]
    H --> N9["📧 Notificación: Persona que solicita la visita recibe confirmación de que la gestión por parte de Suministros Internos y Compras Internas ha sido completada"]
    N9 --> Z["Una vez realizada la visita se habilita la legalización para subir facturas durante 3 días"]
    Z --> N3["📧 Notificación: Compras Internas recibe facturas para legalización"]
    N3 --> O["Adquisiciones Internas revisa las facturas y las legaliza"]
    O --> P

    %% =========================
    %% RAMA 3 - Fondos de fábrica
    %% =========================
    D -->|"Fondos de fábrica"| N6["📧 Notificación: Director de Activos Operativos recibe solicitud para gestión"]
    N6 --> I{"¿Aprobado?"}
    I -->|"No"| X2([Fin - Rechazado])
    I -->|"Sí"| N7["📧 Notificación: Persona que solicita la visita se le notifica autorización y Suministros Internos y Compras Internas reciben aviso para gestión"]
    N7 --> H2["Suministros Internos gestiona plataformas y Compras Internas gestiona fondos de fábrica"]
    H2 --> N10["📧 Notificación: Persona que solicita la visita recibe confirmación de que la gestión por parte de Suministros Internos y Compras Internas ha sido completada"]
    N10 --> Z

