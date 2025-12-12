const { HorarioAtencion } = require('../models');

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
    const horarios = await HorarioAtencion.findAll({
      order: [['dia_semana', 'ASC'], ['hora_apertura', 'ASC']]
    });
    // Agregar nombre del día a cada horario
    const horariosConDia = horarios.map(horario => {
      const horarioData = horario.toJSON ? horario.toJSON() : horario;
      const dia = DIAS_SEMANA.find(d => d.valor == horarioData.dia_semana);
      return {
        ...horarioData,
        dia_nombre: dia ? dia.nombre : `Día ${horarioData.dia_semana}`
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
    await HorarioAtencion.create({
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
      error: 'Error al crear el horario: ' + error.message
    });
  }
};

// Mostrar formulario de edición
exports.showEdit = async (req, res) => {
  try {
    const horario = await HorarioAtencion.findByPk(req.params.id);
    if (!horario) {
      return res.status(404).send('Horario no encontrado');
    }
    const horarioData = horario.toJSON ? horario.toJSON() : horario;
    res.render('horarios/form', { horario: horarioData, diasSemana: DIAS_SEMANA, error: null });
  } catch (error) {
    console.error('Error al obtener horario:', error);
    res.status(500).send('Error al cargar el horario');
  }
};

// Actualizar horario
exports.update = async (req, res) => {
  const { dia_semana, hora_apertura, hora_cierre, activo } = req.body;

  try {
    const horario = await HorarioAtencion.findByPk(req.params.id);
    if (!horario) {
      return res.status(404).send('Horario no encontrado');
    }

    if (!dia_semana || !hora_apertura || !hora_cierre) {
      const horarioData = horario.toJSON ? horario.toJSON() : horario;
      return res.render('horarios/form', {
        horario: { ...horarioData, ...req.body },
        diasSemana: DIAS_SEMANA,
        error: 'Día, hora de apertura y hora de cierre son requeridos'
      });
    }

    await horario.update({
      dia_semana: parseInt(dia_semana),
      hora_apertura,
      hora_cierre,
      activo: activo === 'on' || activo === true
    });
    res.redirect('/horarios');
  } catch (error) {
    console.error('Error al actualizar horario:', error);
    try {
      const horario = await HorarioAtencion.findByPk(req.params.id);
      const horarioData = horario ? (horario.toJSON ? horario.toJSON() : horario) : req.body;
      res.render('horarios/form', {
        horario: { ...horarioData, ...req.body },
        diasSemana: DIAS_SEMANA,
        error: 'Error al actualizar el horario: ' + error.message
      });
    } catch (err) {
      res.render('horarios/form', {
        horario: req.body,
        diasSemana: DIAS_SEMANA,
        error: 'Error al actualizar el horario: ' + error.message
      });
    }
  }
};

// Eliminar horario
exports.delete = async (req, res) => {
  try {
    const horario = await HorarioAtencion.findByPk(req.params.id);
    if (!horario) {
      return res.status(404).send('Horario no encontrado');
    }
    await horario.destroy();
    res.redirect('/horarios');
  } catch (error) {
    console.error('Error al eliminar horario:', error);
    res.status(500).send('Error al eliminar el horario: ' + error.message);
  }
};

