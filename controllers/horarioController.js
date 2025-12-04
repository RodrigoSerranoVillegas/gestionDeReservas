const { findAll, findActive, createHorario, updateHorario, deleteHorario, findById } = require('../models/horario');

const DIAS_SEMANA = [
  { valor: 0, nombre: 'Domingo' },
  { valor: 1, nombre: 'Lunes' },
  { valor: 2, nombre: 'Martes' },
  { valor: 3, nombre: 'Miércoles' },
  { valor: 4, nombre: 'Jueves' },
  { valor: 5, nombre: 'Viernes' },
  { valor: 6, nombre: 'Sábado' }
];

// Listar todos los horarios
exports.list = async (req, res) => {
  try {
    const horarios = await findAll();
    // Agregar nombre del día a cada horario
    const horariosConDia = horarios.map(horario => {
      const dia = DIAS_SEMANA.find(d => d.valor == horario.dia_semana);
      return {
        ...horario,
        dia_nombre: dia ? dia.nombre : `Día ${horario.dia_semana}`
      };
    });
    res.render('horarios/list', { horarios: horariosConDia, diasSemana: DIAS_SEMANA });
  } catch (error) {
    console.error('Error al listar horarios:', error);
    res.render('horarios/list', { horarios: [], diasSemana: DIAS_SEMANA, error: 'Error al cargar los horarios' });
  }
};

// Mostrar formulario de creación
exports.showCreate = (req, res) => {
  res.render('horarios/form', { horario: null, diasSemana: DIAS_SEMANA, error: null });
};

// Crear nuevo horario
exports.create = async (req, res) => {
  const { dia_semana, hora_apertura, hora_cierre, activo } = req.body;

  if (!dia_semana || !hora_apertura || !hora_cierre) {
    return res.render('horarios/form', {
      horario: req.body,
      diasSemana: DIAS_SEMANA,
      error: 'Día, hora de apertura y hora de cierre son requeridos'
    });
  }

  try {
    await createHorario({
      dia_semana: parseInt(dia_semana),
      hora_apertura,
      hora_cierre,
      activo: activo === 'on' || activo === true
    });
    res.redirect('/horarios');
  } catch (error) {
    console.error('Error al crear horario:', error);
    res.render('horarios/form', {
      horario: req.body,
      diasSemana: DIAS_SEMANA,
      error: 'Error al crear el horario'
    });
  }
};

// Mostrar formulario de edición
exports.showEdit = async (req, res) => {
  try {
    const horario = await findById(req.params.id);
    if (!horario) {
      return res.status(404).send('Horario no encontrado');
    }
    res.render('horarios/form', { horario, diasSemana: DIAS_SEMANA, error: null });
  } catch (error) {
    console.error('Error al obtener horario:', error);
    res.status(500).send('Error al cargar el horario');
  }
};

// Actualizar horario
exports.update = async (req, res) => {
  const { dia_semana, hora_apertura, hora_cierre, activo } = req.body;

  if (!dia_semana || !hora_apertura || !hora_cierre) {
    const horario = await findById(req.params.id);
    return res.render('horarios/form', {
      horario: { ...horario, ...req.body },
      diasSemana: DIAS_SEMANA,
      error: 'Día, hora de apertura y hora de cierre son requeridos'
    });
  }

  try {
    await updateHorario(req.params.id, {
      dia_semana: parseInt(dia_semana),
      hora_apertura,
      hora_cierre,
      activo: activo === 'on' || activo === true
    });
    res.redirect('/horarios');
  } catch (error) {
    console.error('Error al actualizar horario:', error);
    const horario = await findById(req.params.id);
    res.render('horarios/form', {
      horario: { ...horario, ...req.body },
      diasSemana: DIAS_SEMANA,
      error: 'Error al actualizar el horario'
    });
  }
};

// Eliminar horario
exports.delete = async (req, res) => {
  try {
    await deleteHorario(req.params.id);
    res.redirect('/horarios');
  } catch (error) {
    console.error('Error al eliminar horario:', error);
    res.status(500).send('Error al eliminar el horario');
  }
};

