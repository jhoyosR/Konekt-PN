import { NotificationType } from "../enum/notification-type.enum";

export const NotificationTemplates = {
    internshipCreatedStudent: (companyName: string) => ({
        title: '¡Has sido elegido para una pasantía!',
        message: `La empresa ${companyName} te ha escogido para realizar una pasantía. Para ver más detalles entra a la sección "Mis prácticas" en la barra de navegación.`,
        type: NotificationType.INTERNSHIP_CREATED_STUDENT,
    }),

    internshipCreatedUniversity: ( companyName: string, studentName: string ) => ({
        title: '¡Una empresa aceptó uno de tus estudiantes para una pasantía!',
        message: `La empresa ${companyName} ha escogido a ${studentName} para realizar una pasantía.`,
        type: NotificationType.INTERNSHIP_CREATED_UNIVERSITY,
    }),

    newCompatibleVacancy: (vacancieTitle: string) => ({
        title: 'Nueva vacante disponible',
        message: `Hay una nueva vacante compatible: ${vacancieTitle}.`,
        type: NotificationType.NEW_COMPATIBLE_VACANCY,
    }),

    newApplication: (vacancieTitle: string) => ({
        title: 'Nueva postulación',
        message: `Un nuevo estudiante se ha postulado a la vacante ${vacancieTitle}.`,
        type: NotificationType.NEW_APPLICATION,
    }),

    applicationSuccessfullyRegistered: ( vacancieTitle: string ) => ({
        title: 'Postulación enviada correctamente',
        message: `Tu aplicación para la vacante ${vacancieTitle} fue registrada exitosamente.`,
        type: NotificationType.APPLICATION_SUCCESSFULLY_REGISTERED,
    }),
};