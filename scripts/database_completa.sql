CREATE TABLE [dbo].[Asistencias] (
    [AsistenciaID]     INT      IDENTITY (1, 1) NOT NULL,
    [SocioID]          INT      NOT NULL,
    [FechaHoraIngreso] DATETIME DEFAULT (getdate()) NULL,
    [FechaHoraSalida]  DATETIME NULL,
    [UsuarioRegistro]  INT      NULL,
    PRIMARY KEY CLUSTERED ([AsistenciaID] ASC),
    FOREIGN KEY ([SocioID]) REFERENCES [dbo].[Socios] ([SocioID]),
    FOREIGN KEY ([UsuarioRegistro]) REFERENCES [dbo].[Usuarios] ([UsuarioID])
);


GO

CREATE NONCLUSTERED INDEX [IX_Asistencias_SocioID]
    ON [dbo].[Asistencias]([SocioID] ASC);


GO

CREATE TABLE [dbo].[AuditoriaMembresías] (
    [AuditoriaID]       INT            IDENTITY (1, 1) NOT NULL,
    [PlanID]            INT            NULL,
    [NombrePlan]        NVARCHAR (100) NOT NULL,
    [TipoAccion]        NVARCHAR (20)  NOT NULL,
    [UsuarioID]         INT            NULL,
    [FechaAccion]       DATETIME       DEFAULT (getdate()) NOT NULL,
    [CamposModificados] NVARCHAR (MAX) NULL,
    [ValoresAnteriores] NVARCHAR (MAX) NULL,
    [ValoresNuevos]     NVARCHAR (MAX) NULL,
    [Descripcion]       NVARCHAR (500) NULL,
    PRIMARY KEY CLUSTERED ([AuditoriaID] ASC),
    CONSTRAINT [CK_TipoAccion] CHECK ([TipoAccion]='DESACTIVAR' OR [TipoAccion]='ACTIVAR' OR [TipoAccion]='MODIFICAR' OR [TipoAccion]='CREAR')
);


GO

CREATE NONCLUSTERED INDEX [IX_AuditoriaMembresías_PlanID]
    ON [dbo].[AuditoriaMembresías]([PlanID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_AuditoriaMembresías_TipoAccion]
    ON [dbo].[AuditoriaMembresías]([TipoAccion] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_AuditoriaMembresías_FechaAccion]
    ON [dbo].[AuditoriaMembresías]([FechaAccion] DESC);


GO

CREATE TABLE [dbo].[CategoriasInventario] (
    [CategoriaID]     INT            IDENTITY (1, 1) NOT NULL,
    [NombreCategoria] NVARCHAR (100) NOT NULL,
    [TipoCategoria]   NVARCHAR (20)  NOT NULL,
    [Descripcion]     NVARCHAR (255) NULL,
    PRIMARY KEY CLUSTERED ([CategoriaID] ASC),
    CHECK ([TipoCategoria]='UsoInterno' OR [TipoCategoria]='Venta')
);


GO

CREATE TABLE [dbo].[Clases] (
    [ClaseID]       INT            IDENTITY (1, 1) NOT NULL,
    [NombreClase]   NVARCHAR (100) NOT NULL,
    [Descripcion]   NVARCHAR (500) NULL,
    [EntrenadorID]  INT            NOT NULL,
    [DiaSemana]     NVARCHAR (20)  NOT NULL,
    [HoraInicio]    TIME (7)       NOT NULL,
    [HoraFin]       TIME (7)       NOT NULL,
    [CupoMaximo]    INT            NOT NULL,
    [Activa]        BIT            DEFAULT ((1)) NULL,
    [FechaCreacion] DATETIME       DEFAULT (getdate()) NULL,
    [TipoClase]     NVARCHAR (20)  DEFAULT ('Indefinida') NULL,
    [NumeroSemanas] INT            NULL,
    [FechaInicio]   DATE           NULL,
    [FechaFin]      DATE           NULL,
    [Categoria]     NVARCHAR (50)  NULL,
    PRIMARY KEY CLUSTERED ([ClaseID] ASC),
    CHECK ([TipoClase]='Indefinida' OR [TipoClase]='Temporal'),
    FOREIGN KEY ([EntrenadorID]) REFERENCES [dbo].[Entrenadores] ([EntrenadorID])
);


GO

CREATE TABLE [dbo].[Comprobantes] (
    [ComprobanteID]     INT             IDENTITY (1, 1) NOT NULL,
    [PagoID]            INT             NULL,
    [SocioID]           INT             NULL,
    [MembresíaID]       INT             NULL,
    [NumeroComprobante] NVARCHAR (50)   NOT NULL,
    [FechaEmision]      DATETIME        DEFAULT (getdate()) NULL,
    [MontoPago]         DECIMAL (10, 2) NOT NULL,
    [MedioPago]         NVARCHAR (50)   NOT NULL,
    [NombreSocio]       NVARCHAR (200)  NOT NULL,
    [EmailSocio]        NVARCHAR (255)  NULL,
    [TelefonoSocio]     NVARCHAR (20)   NULL,
    [NombrePlan]        NVARCHAR (100)  NULL,
    [DuracionPlan]      INT             NULL,
    [FechaInicio]       DATE            NULL,
    [FechaVencimiento]  DATE            NULL,
    [UsuarioRegistro]   INT             NULL,
    [Concepto]          NVARCHAR (255)  NULL,
    [Estado]            NVARCHAR (20)   DEFAULT ('Emitido') NULL,
    [FechaCreacion]     DATETIME        DEFAULT (getdate()) NULL,
    [VentaID]           INT             NULL,
    PRIMARY KEY CLUSTERED ([ComprobanteID] ASC),
    FOREIGN KEY ([MembresíaID]) REFERENCES [dbo].[Membresías] ([MembresíaID]),
    FOREIGN KEY ([PagoID]) REFERENCES [dbo].[Pagos] ([PagoID]),
    FOREIGN KEY ([SocioID]) REFERENCES [dbo].[Socios] ([SocioID]),
    FOREIGN KEY ([UsuarioRegistro]) REFERENCES [dbo].[Usuarios] ([UsuarioID]),
    UNIQUE NONCLUSTERED ([NumeroComprobante] ASC)
);


GO

CREATE NONCLUSTERED INDEX [IX_Comprobantes_NumeroComprobante]
    ON [dbo].[Comprobantes]([NumeroComprobante] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Comprobantes_SocioID]
    ON [dbo].[Comprobantes]([SocioID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Comprobantes_PagoID]
    ON [dbo].[Comprobantes]([PagoID] ASC);


GO

CREATE TABLE [dbo].[DetalleVenta] (
    [DetalleID]      INT             IDENTITY (1, 1) NOT NULL,
    [VentaID]        INT             NOT NULL,
    [ProductoID]     INT             NOT NULL,
    [Cantidad]       INT             NOT NULL,
    [PrecioUnitario] DECIMAL (10, 2) NOT NULL,
    [Subtotal]       DECIMAL (10, 2) NOT NULL,
    PRIMARY KEY CLUSTERED ([DetalleID] ASC),
    CHECK ([Cantidad]>(0)),
    FOREIGN KEY ([ProductoID]) REFERENCES [dbo].[Inventario] ([ProductoID]),
    FOREIGN KEY ([VentaID]) REFERENCES [dbo].[Ventas] ([VentaID]),
    UNIQUE NONCLUSTERED ([VentaID] ASC, [ProductoID] ASC)
);


GO

CREATE TABLE [dbo].[Entrenadores] (
    [EntrenadorID]    INT             IDENTITY (1, 1) NOT NULL,
    [UsuarioID]       INT             NOT NULL,
    [Especialidad]    NVARCHAR (255)  NULL,
    [Certificaciones] NVARCHAR (MAX)  NULL,
    [Biografia]       NVARCHAR (1000) NULL,
    [FotoURL]         NVARCHAR (500)  NULL,
    [Activo]          BIT             DEFAULT ((1)) NULL,
    [FotoDemo]        NVARCHAR (500)  NULL,
    PRIMARY KEY CLUSTERED ([EntrenadorID] ASC),
    FOREIGN KEY ([UsuarioID]) REFERENCES [dbo].[Usuarios] ([UsuarioID])
);


GO

CREATE TABLE [dbo].[HistorialMembresiasSocios] (
    [HistorialID]    INT             IDENTITY (1, 1) NOT NULL,
    [SocioID]        INT             NOT NULL,
    [MembresíaID]    INT             NULL,
    [Accion]         NVARCHAR (50)   NOT NULL,
    [PlanAnterior]   NVARCHAR (100)  NULL,
    [PlanNuevo]      NVARCHAR (100)  NULL,
    [EstadoAnterior] NVARCHAR (50)   NULL,
    [EstadoNuevo]    NVARCHAR (50)   NOT NULL,
    [FechaAnterior]  DATE            NULL,
    [FechaNueva]     DATE            NULL,
    [MontoAnterior]  DECIMAL (10, 2) NULL,
    [MontoNuevo]     DECIMAL (10, 2) NULL,
    [Motivo]         NVARCHAR (500)  NULL,
    [Detalles]       NVARCHAR (MAX)  NULL,
    [FechaRegistro]  DATETIME        DEFAULT (getdate()) NULL,
    [AdminUsuario]   NVARCHAR (100)  NULL,
    PRIMARY KEY CLUSTERED ([HistorialID] ASC),
    FOREIGN KEY ([SocioID]) REFERENCES [dbo].[Socios] ([SocioID]) ON DELETE CASCADE
);


GO

CREATE NONCLUSTERED INDEX [IX_HistorialMembresiasSocios_Fecha]
    ON [dbo].[HistorialMembresiasSocios]([FechaRegistro] DESC);


GO

CREATE NONCLUSTERED INDEX [IX_HistorialMembresiasSocios_SocioID]
    ON [dbo].[HistorialMembresiasSocios]([SocioID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_HistorialMembresiasSocios_Accion]
    ON [dbo].[HistorialMembresiasSocios]([Accion] ASC);


GO

CREATE TABLE [dbo].[HorariosRecepcion] (
    [HorarioRecepcionID] INT          IDENTITY (1, 1) NOT NULL,
    [EntrenadorID]       INT          NOT NULL,
    [DiaSemana]          VARCHAR (20) NOT NULL,
    [HoraInicio]         TIME (7)     NOT NULL,
    [HoraFin]            TIME (7)     NOT NULL,
    [FechaCreacion]      DATETIME     DEFAULT (getdate()) NULL,
    [Activo]             BIT          DEFAULT ((1)) NULL,
    PRIMARY KEY CLUSTERED ([HorarioRecepcionID] ASC),
    CONSTRAINT [CHK_DiaSemana] CHECK ([DiaSemana]='Domingo' OR [DiaSemana]='Sábado' OR [DiaSemana]='Viernes' OR [DiaSemana]='Jueves' OR [DiaSemana]='Miércoles' OR [DiaSemana]='Martes' OR [DiaSemana]='Lunes'),
    CONSTRAINT [CHK_HoraRecepcion] CHECK ([HoraFin]>[HoraInicio]),
    FOREIGN KEY ([EntrenadorID]) REFERENCES [dbo].[Entrenadores] ([EntrenadorID])
);


GO

CREATE NONCLUSTERED INDEX [IDX_HorariosRecepcion_Dia]
    ON [dbo].[HorariosRecepcion]([DiaSemana] ASC, [Activo] ASC);


GO

CREATE NONCLUSTERED INDEX [IDX_HorariosRecepcion_Entrenador]
    ON [dbo].[HorariosRecepcion]([EntrenadorID] ASC, [Activo] ASC);


GO

CREATE TABLE [dbo].[IntercambiosHorario] (
    [IntercambioID]       INT            IDENTITY (1, 1) NOT NULL,
    [EntrenadorOrigenID]  INT            NOT NULL,
    [EntrenadorDestinoID] INT            NOT NULL,
    [HorarioOrigenID]     INT            NOT NULL,
    [HorarioDestinoID]    INT            NOT NULL,
    [Estado]              VARCHAR (20)   DEFAULT ('Pendiente') NULL,
    [FechaSolicitud]      DATETIME       DEFAULT (getdate()) NULL,
    [FechaRespuesta]      DATETIME       NULL,
    [Mensaje]             NVARCHAR (500) NULL,
    PRIMARY KEY CLUSTERED ([IntercambioID] ASC),
    CONSTRAINT [CHK_EntrenadoresDiferentes] CHECK ([EntrenadorOrigenID]<>[EntrenadorDestinoID]),
    CONSTRAINT [CHK_EstadoIntercambio] CHECK ([Estado]='Rechazado' OR [Estado]='Aprobado' OR [Estado]='Pendiente'),
    FOREIGN KEY ([EntrenadorDestinoID]) REFERENCES [dbo].[Entrenadores] ([EntrenadorID]),
    FOREIGN KEY ([EntrenadorOrigenID]) REFERENCES [dbo].[Entrenadores] ([EntrenadorID]),
    FOREIGN KEY ([HorarioDestinoID]) REFERENCES [dbo].[HorariosRecepcion] ([HorarioRecepcionID]),
    FOREIGN KEY ([HorarioOrigenID]) REFERENCES [dbo].[HorariosRecepcion] ([HorarioRecepcionID])
);


GO

CREATE NONCLUSTERED INDEX [IDX_Intercambios_Estado]
    ON [dbo].[IntercambiosHorario]([Estado] ASC, [EntrenadorDestinoID] ASC);


GO

CREATE TABLE [dbo].[Inventario] (
    [ProductoID]     INT             IDENTITY (1, 1) NOT NULL,
    [CategoriaID]    INT             NOT NULL,
    [NombreProducto] NVARCHAR (100)  NOT NULL,
    [Descripcion]    NVARCHAR (500)  NULL,
    [PrecioVenta]    DECIMAL (10, 2) NULL,
    [StockActual]    INT             DEFAULT ((0)) NOT NULL,
    [StockMinimo]    INT             DEFAULT ((5)) NOT NULL,
    [UnidadMedida]   NVARCHAR (20)   NULL,
    [Estado]         NVARCHAR (50)   NULL,
    [FechaCreacion]  DATETIME        DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([ProductoID] ASC),
    FOREIGN KEY ([CategoriaID]) REFERENCES [dbo].[CategoriasInventario] ([CategoriaID])
);


GO

CREATE TABLE [dbo].[Membresías] (
    [MembresíaID]      INT             IDENTITY (1, 1) NOT NULL,
    [SocioID]          INT             NOT NULL,
    [PlanID]           INT             NOT NULL,
    [FechaInicio]      DATE            NOT NULL,
    [FechaVencimiento] DATE            NOT NULL,
    [Estado]           NVARCHAR (20)   DEFAULT ('Vigente') NULL,
    [MontoPagado]      DECIMAL (10, 2) NOT NULL,
    [FechaCreacion]    DATETIME        DEFAULT (getdate()) NULL,
    [MotivoEstado]     NVARCHAR (255)  NULL,
    [FechaSuspension]  DATE            NULL,
    [DiasSuspension]   INT             NULL,
    PRIMARY KEY CLUSTERED ([MembresíaID] ASC),
    CHECK ([Estado]='Cancelada' OR [Estado]='Suspendida' OR [Estado]='Vencida' OR [Estado]='Vigente'),
    FOREIGN KEY ([PlanID]) REFERENCES [dbo].[PlanesMembresía] ([PlanID]),
    FOREIGN KEY ([SocioID]) REFERENCES [dbo].[Socios] ([SocioID])
);


GO

CREATE NONCLUSTERED INDEX [IX_Membresías_SocioID]
    ON [dbo].[Membresías]([SocioID] ASC);


GO

CREATE TABLE [dbo].[MovimientosInventario] (
    [MovimientoID]    INT            IDENTITY (1, 1) NOT NULL,
    [ProductoID]      INT            NOT NULL,
    [TipoMovimiento]  NVARCHAR (20)  NOT NULL,
    [Cantidad]        INT            NOT NULL,
    [FechaMovimiento] DATETIME       DEFAULT (getdate()) NULL,
    [Motivo]          NVARCHAR (255) NULL,
    [UsuarioRegistro] INT            NULL,
    PRIMARY KEY CLUSTERED ([MovimientoID] ASC),
    CHECK ([TipoMovimiento]='Ajuste' OR [TipoMovimiento]='Salida' OR [TipoMovimiento]='Entrada'),
    FOREIGN KEY ([ProductoID]) REFERENCES [dbo].[Inventario] ([ProductoID]),
    FOREIGN KEY ([UsuarioRegistro]) REFERENCES [dbo].[Usuarios] ([UsuarioID])
);


GO

CREATE TABLE [dbo].[Notificaciones] (
    [NotificacionID] INT            IDENTITY (1, 1) NOT NULL,
    [TipoUsuario]    VARCHAR (20)   NOT NULL,
    [UsuarioID]      INT            NULL,
    [TipoEvento]     VARCHAR (50)   NOT NULL,
    [Titulo]         NVARCHAR (200) NOT NULL,
    [Mensaje]        NVARCHAR (500) NOT NULL,
    [Leida]          BIT            DEFAULT ((0)) NULL,
    [FechaCreacion]  DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([NotificacionID] ASC),
    CONSTRAINT [CHK_TipoUsuario] CHECK ([TipoUsuario]='Socio' OR [TipoUsuario]='Entrenador' OR [TipoUsuario]='Admin')
);


GO

CREATE NONCLUSTERED INDEX [IDX_Notificaciones_Usuario]
    ON [dbo].[Notificaciones]([TipoUsuario] ASC, [UsuarioID] ASC, [Leida] ASC, [FechaCreacion] DESC);


GO

CREATE TABLE [dbo].[Pagos] (
    [PagoID]            INT             IDENTITY (1, 1) NOT NULL,
    [SocioID]           INT             NOT NULL,
    [MembresíaID]       INT             NULL,
    [MontoPago]         DECIMAL (10, 2) NOT NULL,
    [MedioPago]         NVARCHAR (50)   NOT NULL,
    [FechaPago]         DATETIME        DEFAULT (getdate()) NULL,
    [ComprobantePath]   NVARCHAR (500)  NULL,
    [NumeroComprobante] NVARCHAR (50)   NULL,
    [Concepto]          NVARCHAR (255)  NULL,
    [UsuarioRegistro]   INT             NULL,
    PRIMARY KEY CLUSTERED ([PagoID] ASC),
    CHECK ([MedioPago]='Digital' OR [MedioPago]='Transferencia' OR [MedioPago]='Tarjeta' OR [MedioPago]='Efectivo'),
    FOREIGN KEY ([MembresíaID]) REFERENCES [dbo].[Membresías] ([MembresíaID]),
    FOREIGN KEY ([SocioID]) REFERENCES [dbo].[Socios] ([SocioID]),
    FOREIGN KEY ([UsuarioRegistro]) REFERENCES [dbo].[Usuarios] ([UsuarioID])
);


GO

CREATE NONCLUSTERED INDEX [IX_Pagos_SocioID]
    ON [dbo].[Pagos]([SocioID] ASC);


GO

CREATE TABLE [dbo].[PlanesMembresía] (
    [PlanID]            INT             IDENTITY (1, 1) NOT NULL,
    [NombrePlan]        NVARCHAR (100)  NOT NULL,
    [Descripcion]       NVARCHAR (500)  NULL,
    [Precio]            DECIMAL (10, 2) NOT NULL,
    [DuracionDias]      INT             NOT NULL,
    [TipoPlan]          NVARCHAR (20)   DEFAULT ('Normal') NULL,
    [Descuento]         DECIMAL (5, 2)  DEFAULT ((0)) NULL,
    [FechaInicioOferta] DATE            NULL,
    [FechaFinOferta]    DATE            NULL,
    [Beneficios]        NVARCHAR (MAX)  NULL,
    [Activo]            BIT             DEFAULT ((1)) NULL,
    [FechaCreacion]     DATETIME        DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([PlanID] ASC),
    CHECK ([TipoPlan]='Oferta' OR [TipoPlan]='Normal')
);


GO

CREATE TABLE [dbo].[ReservasClases] (
    [ReservaID]    INT           IDENTITY (1, 1) NOT NULL,
    [ClaseID]      INT           NOT NULL,
    [SocioID]      INT           NOT NULL,
    [FechaClase]   DATE          NOT NULL,
    [Estado]       NVARCHAR (20) DEFAULT ('Reservada') NULL,
    [FechaReserva] DATETIME      DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([ReservaID] ASC),
    CHECK ([Estado]='Cancelada' OR [Estado]='NoAsistió' OR [Estado]='Asistió' OR [Estado]='Reservada'),
    FOREIGN KEY ([ClaseID]) REFERENCES [dbo].[Clases] ([ClaseID]),
    FOREIGN KEY ([SocioID]) REFERENCES [dbo].[Socios] ([SocioID])
);


GO

CREATE NONCLUSTERED INDEX [IX_ReservasClases_SocioID]
    ON [dbo].[ReservasClases]([SocioID] ASC);


GO

CREATE TABLE [dbo].[Roles] (
    [RolID]         INT            IDENTITY (1, 1) NOT NULL,
    [NombreRol]     NVARCHAR (50)  NOT NULL,
    [Descripcion]   NVARCHAR (255) NULL,
    [FechaCreacion] DATETIME       DEFAULT (getdate()) NULL,
    [Activo]        BIT            DEFAULT ((1)) NULL,
    PRIMARY KEY CLUSTERED ([RolID] ASC),
    UNIQUE NONCLUSTERED ([NombreRol] ASC)
);


GO

CREATE TABLE [dbo].[SesionesPersonales] (
    [SesionID]            INT             IDENTITY (1, 1) NOT NULL,
    [EntrenadorID]        INT             NOT NULL,
    [SocioID]             INT             NOT NULL,
    [FechaSesion]         DATE            NOT NULL,
    [HoraInicio]          TIME (7)        NOT NULL,
    [HoraFin]             TIME (7)        NOT NULL,
    [Estado]              NVARCHAR (20)   DEFAULT ('Agendada') NULL,
    [Notas]               NVARCHAR (1000) NULL,
    [FechaCreacion]       DATETIME        DEFAULT (getdate()) NULL,
    [FechaModificacion]   DATETIME        NULL,
    [UsuarioModificacion] INT             NULL,
    PRIMARY KEY CLUSTERED ([SesionID] ASC),
    CHECK ([Estado]='NoAsistio' OR [Estado]='Cancelada' OR [Estado]='Completada' OR [Estado]='Agendada'),
    FOREIGN KEY ([EntrenadorID]) REFERENCES [dbo].[Entrenadores] ([EntrenadorID]),
    FOREIGN KEY ([SocioID]) REFERENCES [dbo].[Socios] ([SocioID]),
    FOREIGN KEY ([UsuarioModificacion]) REFERENCES [dbo].[Usuarios] ([UsuarioID])
);


GO

CREATE NONCLUSTERED INDEX [IX_SesionesPersonales_SocioID]
    ON [dbo].[SesionesPersonales]([SocioID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_SesionesPersonales_EntrenadorID]
    ON [dbo].[SesionesPersonales]([EntrenadorID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_SesionesPersonales_FechaSesion]
    ON [dbo].[SesionesPersonales]([FechaSesion] ASC);


GO

CREATE TABLE [dbo].[Socios] (
    [SocioID]                INT            IDENTITY (1, 1) NOT NULL,
    [RUT]                    NVARCHAR (12)  NOT NULL,
    [Nombre]                 NVARCHAR (100) NOT NULL,
    [Apellido]               NVARCHAR (100) NOT NULL,
    [FechaNacimiento]        DATE           NULL,
    [Email]                  NVARCHAR (255) NOT NULL,
    [Telefono]               NVARCHAR (20)  NULL,
    [Direccion]              NVARCHAR (255) NULL,
    [CodigoQR]               NVARCHAR (255) NULL,
    [PasswordHash]           NVARCHAR (255) NULL,
    [EstadoSocio]            NVARCHAR (20)  DEFAULT ('Activo') NULL,
    [FechaRegistro]          DATETIME       DEFAULT (getdate()) NULL,
    [FotoURL]                NVARCHAR (500) NULL,
    [ContactoEmergencia]     NVARCHAR (100) NULL,
    [TelefonoEmergencia]     NVARCHAR (20)  NULL,
    [RequiereCambioPassword] BIT            DEFAULT ((0)) NOT NULL,
    PRIMARY KEY CLUSTERED ([SocioID] ASC),
    CHECK ([EstadoSocio]='Inactivo' OR [EstadoSocio]='Moroso' OR [EstadoSocio]='Suspendido' OR [EstadoSocio]='Activo'),
    UNIQUE NONCLUSTERED ([CodigoQR] ASC),
    UNIQUE NONCLUSTERED ([Email] ASC),
    UNIQUE NONCLUSTERED ([RUT] ASC)
);


GO

CREATE NONCLUSTERED INDEX [IX_Socios_Email]
    ON [dbo].[Socios]([Email] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Socios_RUT]
    ON [dbo].[Socios]([RUT] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Socios_RequiereCambioPassword]
    ON [dbo].[Socios]([RequiereCambioPassword] ASC);


GO

CREATE TABLE [dbo].[SolicitudesMembresia] (
    [SolicitudID]       INT            IDENTITY (1, 1) NOT NULL,
    [SocioID]           INT            NOT NULL,
    [TipoSolicitud]     NVARCHAR (20)  NOT NULL,
    [MesesPausa]        INT            NULL,
    [MotivoCancelacion] NVARCHAR (500) NULL,
    [MotivoSolicitud]   NVARCHAR (500) NULL,
    [Estado]            NVARCHAR (20)  DEFAULT ('Pendiente') NULL,
    [FechaSolicitud]    DATETIME       DEFAULT (getdate()) NULL,
    [FechaRespuesta]    DATETIME       NULL,
    [AdminRespuestaID]  INT            NULL,
    [MotivoRechazo]     NVARCHAR (500) NULL,
    [PlanNuevoID]       INT            NULL,
    [TipoCambio]        NVARCHAR (50)  NULL,
    PRIMARY KEY CLUSTERED ([SolicitudID] ASC),
    CHECK ([Estado]='Rechazada' OR [Estado]='Aprobada' OR [Estado]='Pendiente'),
    CHECK ([TipoCambio]='FuerzaMayor' OR [TipoCambio]='Promocion' OR [TipoCambio]='Downgrade' OR [TipoCambio]='Upgrade'),
    CONSTRAINT [CK_SolicitudesMembresia_TipoCambio] CHECK ([TipoCambio]='FuerzaMayor' OR [TipoCambio]='Promocion' OR [TipoCambio]='Downgrade' OR [TipoCambio]='Upgrade'),
    CONSTRAINT [CK_SolicitudesMembresia_TipoSolicitud_v2] CHECK ([TipoSolicitud]='Asignar' OR [TipoSolicitud]='Cambiar' OR [TipoSolicitud]='Reanudar' OR [TipoSolicitud]='Activar' OR [TipoSolicitud]='Cancelar' OR [TipoSolicitud]='Pausar'),
    FOREIGN KEY ([AdminRespuestaID]) REFERENCES [dbo].[Usuarios] ([UsuarioID]),
    FOREIGN KEY ([PlanNuevoID]) REFERENCES [dbo].[PlanesMembresía] ([PlanID]),
    FOREIGN KEY ([SocioID]) REFERENCES [dbo].[Socios] ([SocioID]),
    CONSTRAINT [FK_SolicitudesMembresia_PlanNuevo] FOREIGN KEY ([PlanNuevoID]) REFERENCES [dbo].[PlanesMembresía] ([PlanID])
);


GO

CREATE NONCLUSTERED INDEX [IX_SolicitudesMembresia_FechaSolicitud]
    ON [dbo].[SolicitudesMembresia]([FechaSolicitud] DESC);


GO

CREATE NONCLUSTERED INDEX [IX_SolicitudesMembresia_Estado]
    ON [dbo].[SolicitudesMembresia]([Estado] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_SolicitudesMembresia_SocioID]
    ON [dbo].[SolicitudesMembresia]([SocioID] ASC);


GO

CREATE TABLE [dbo].[Turnos] (
    [TurnoID]       INT            IDENTITY (1, 1) NOT NULL,
    [UsuarioID]     INT            NOT NULL,
    [FechaTurno]    DATE           NOT NULL,
    [HoraInicio]    TIME (7)       NOT NULL,
    [HoraFin]       TIME (7)       NOT NULL,
    [Rol]           NVARCHAR (100) NULL,
    [Observaciones] NVARCHAR (500) NULL,
    PRIMARY KEY CLUSTERED ([TurnoID] ASC),
    FOREIGN KEY ([UsuarioID]) REFERENCES [dbo].[Usuarios] ([UsuarioID])
);


GO

CREATE TABLE [dbo].[Usuarios] (
    [UsuarioID]              INT            IDENTITY (1, 1) NOT NULL,
    [RolID]                  INT            NOT NULL,
    [NombreUsuario]          NVARCHAR (100) NOT NULL,
    [Email]                  NVARCHAR (255) NOT NULL,
    [PasswordHash]           NVARCHAR (255) NOT NULL,
    [Nombre]                 NVARCHAR (100) NOT NULL,
    [Apellido]               NVARCHAR (100) NOT NULL,
    [Telefono]               NVARCHAR (20)  NULL,
    [FechaCreacion]          DATETIME       DEFAULT (getdate()) NULL,
    [UltimoAcceso]           DATETIME       NULL,
    [Activo]                 BIT            DEFAULT ((1)) NULL,
    [RequiereCambioPassword] BIT            DEFAULT ((0)) NOT NULL,
    [FotoPerfil]             NVARCHAR (500) NULL,
    PRIMARY KEY CLUSTERED ([UsuarioID] ASC),
    FOREIGN KEY ([RolID]) REFERENCES [dbo].[Roles] ([RolID]),
    UNIQUE NONCLUSTERED ([Email] ASC),
    UNIQUE NONCLUSTERED ([NombreUsuario] ASC)
);


GO

CREATE NONCLUSTERED INDEX [IX_Usuarios_RequiereCambioPassword]
    ON [dbo].[Usuarios]([RequiereCambioPassword] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Usuarios_Email]
    ON [dbo].[Usuarios]([Email] ASC);


GO

CREATE TABLE [dbo].[Ventas] (
    [VentaID]           INT             IDENTITY (1, 1) NOT NULL,
    [SocioID]           INT             NULL,
    [FechaVenta]        DATETIME        DEFAULT (getdate()) NOT NULL,
    [MontoTotal]        DECIMAL (10, 2) NOT NULL,
    [MetodoPago]        NVARCHAR (50)   NOT NULL,
    [UsuarioRegistro]   INT             NOT NULL,
    [NumeroComprobante] NVARCHAR (50)   NULL,
    [TipoVenta]         NVARCHAR (50)   DEFAULT ('Producto') NOT NULL,
    [ComprobantePath]   NVARCHAR (MAX)  NULL,
    PRIMARY KEY CLUSTERED ([VentaID] ASC),
    CHECK ([MetodoPago]='Transferencia' OR [MetodoPago]='Tarjeta' OR [MetodoPago]='Efectivo'),
    FOREIGN KEY ([SocioID]) REFERENCES [dbo].[Socios] ([SocioID]),
    FOREIGN KEY ([UsuarioRegistro]) REFERENCES [dbo].[Usuarios] ([UsuarioID]),
    UNIQUE NONCLUSTERED ([NumeroComprobante] ASC)
);


GO

