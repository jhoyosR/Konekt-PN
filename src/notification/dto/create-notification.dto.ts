import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from "class-validator";
import { MSG } from "../../common/helpers/validation-messages.helper";
import { NotificationType } from '../enum/notification-type.enum';

export class CreateNotificationDto {

    @ApiProperty({ example: '2384332482r3wj-23423f23-23432r' })
    @IsUUID()
    userId!: string;

    @ApiProperty({ example: 'Nueva postulación creada' })
    @IsString({ message: MSG.string('El título') })
    @IsNotEmpty({ message: MSG.isNotEmpty('El título') })
    title!: string;

    @ApiProperty({ example: 'Tienes una nueva postulación para la vacante Ingeniero de Ciberseguridad' })
    @IsString({ message: MSG.string('El mensaje') })
    @IsNotEmpty({ message: MSG.isNotEmpty('El mensaje') })
    message!: string;

    @ApiProperty({ example: NotificationType.APPLICATION_SUCCESSFULLY_REGISTERED })
    @IsOptional()
    @IsEnum(NotificationType, { message: MSG.notValidValue('tipo') })
    type?: NotificationType

    @ApiProperty({ example: 1 })
    @IsOptional()
    @IsNumber()
    resourceId?: number;
}
