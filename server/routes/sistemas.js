const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

const TASKS_FILE = path.join(__dirname, '../data_sistemas_tasks.json');
const PROJECTS_FILE = path.join(__dirname, '../data_sistemas_projects.json');

const readBackup = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
    } catch (e) {
        console.error('Error leyendo backup:', filePath, e);
    }
    return [];
};

const writeBackup = (filePath, data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.error('Error guardando backup:', filePath, e);
    }
};

// ==========================================
// PROYECTOS (Guardados en PostgreSQL)
// ==========================================
router.get('/sistemas/projects', verifyToken, async (req, res) => {
    try {
        if (prisma.sistemasProject) {
            const dbProjects = await prisma.sistemasProject.findMany({
                orderBy: { createdAt: 'desc' }
            });
            if (dbProjects.length > 0) {
                return res.json(dbProjects);
            }
        }
    } catch (err) {
        console.error('Error obteniendo proyectos de PostgreSQL, usando backup:', err.message);
    }
    res.json(readBackup(PROJECTS_FILE));
});

router.post('/sistemas/projects/sync', verifyToken, async (req, res) => {
    try {
        const { projects } = req.body;
        if (!Array.isArray(projects)) return res.status(400).json({ error: 'Formato inválido' });

        // Guardar respaldo local
        writeBackup(PROJECTS_FILE, projects);

        // Guardar/sincronizar en PostgreSQL
        if (prisma.sistemasProject) {
            for (const p of projects) {
                await prisma.sistemasProject.upsert({
                    where: { id: p.id },
                    update: {
                        nombre: p.nombre,
                        descripcion: p.descripcion,
                        fechaInicio: p.fechaInicio ? new Date(p.fechaInicio) : null,
                        fechaFin: p.fechaFin ? new Date(p.fechaFin) : null,
                        estado: p.estado || 'ACTIVO'
                    },
                    create: {
                        id: p.id,
                        nombre: p.nombre,
                        descripcion: p.descripcion,
                        fechaInicio: p.fechaInicio ? new Date(p.fechaInicio) : null,
                        fechaFin: p.fechaFin ? new Date(p.fechaFin) : null,
                        estado: p.estado || 'ACTIVO'
                    }
                });
            }

            // Eliminar en PostgreSQL los que ya no existan en la lista (eliminación de proyectos)
            const currentIds = projects.map(p => p.id);
            await prisma.sistemasProject.deleteMany({
                where: {
                    id: { notIn: currentIds }
                }
            });
        }

        res.json({ success: true, count: projects.length });
    } catch (err) {
        console.error('Error sincronizando proyectos en BD:', err);
        res.status(500).json({ error: 'Error al sincronizar proyectos' });
    }
});

// ==========================================
// ACTIVIDADES / TAREAS (Guardadas en PostgreSQL)
// ==========================================
router.get('/sistemas/tasks', verifyToken, async (req, res) => {
    try {
        if (prisma.sistemasTask) {
            const dbTasks = await prisma.sistemasTask.findMany({
                orderBy: { createdAt: 'desc' }
            });
            if (dbTasks.length > 0) {
                return res.json(dbTasks);
            }
        }
    } catch (err) {
        console.error('Error obteniendo tareas de PostgreSQL, usando backup:', err.message);
    }
    res.json(readBackup(TASKS_FILE));
});

router.post('/sistemas/tasks/sync', verifyToken, async (req, res) => {
    try {
        const { tasks } = req.body;
        if (!Array.isArray(tasks)) return res.status(400).json({ error: 'Formato inválido' });

        // Guardar respaldo local
        writeBackup(TASKS_FILE, tasks);

        // Guardar/sincronizar en PostgreSQL
        if (prisma.sistemasTask) {
            for (const t of tasks) {
                await prisma.sistemasTask.upsert({
                    where: { id: t.id },
                    update: {
                        proyectoId: t.proyectoId,
                        proyectoNombre: t.proyectoNombre,
                        titulo: t.titulo,
                        descripcion: t.descripcion,
                        prioridad: t.prioridad || 'MEDIA',
                        estado: t.estado || 'POR_HACER',
                        fechaInicio: t.fechaInicio ? new Date(t.fechaInicio) : null,
                        fechaFin: t.fechaFin ? new Date(t.fechaFin) : null,
                        progreso: parseInt(t.progreso) || 0,
                        responsableId: t.responsableId,
                        responsableNombre: t.responsableNombre,
                        responsables: t.responsables || [],
                        notas: t.notas || [],
                        evaluaciones: t.evaluaciones || []
                    },
                    create: {
                        id: t.id,
                        proyectoId: t.proyectoId,
                        proyectoNombre: t.proyectoNombre,
                        titulo: t.titulo,
                        descripcion: t.descripcion,
                        prioridad: t.prioridad || 'MEDIA',
                        estado: t.estado || 'POR_HACER',
                        fechaInicio: t.fechaInicio ? new Date(t.fechaInicio) : null,
                        fechaFin: t.fechaFin ? new Date(t.fechaFin) : null,
                        progreso: parseInt(t.progreso) || 0,
                        responsableId: t.responsableId,
                        responsableNombre: t.responsableNombre,
                        responsables: t.responsables || [],
                        notas: t.notas || [],
                        evaluaciones: t.evaluaciones || []
                    }
                });
            }

            // Eliminar tareas que fueron borradas (por ejemplo si se borró un proyecto)
            const currentIds = tasks.map(t => t.id);
            await prisma.sistemasTask.deleteMany({
                where: {
                    id: { notIn: currentIds }
                }
            });
        }

        res.json({ success: true, count: tasks.length });
    } catch (err) {
        console.error('Error sincronizando tareas en BD:', err);
        res.status(500).json({ error: 'Error al sincronizar tareas' });
    }
});

module.exports = router;
