import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

export const BODY_MUST_BE_OBJECT_MESSAGE =
  'O corpo da requisição deve ser um objeto JSON.';

@Injectable()
export class BodyMustBeObjectPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (metadata.type !== 'body') {
      return value;
    }
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new BadRequestException(BODY_MUST_BE_OBJECT_MESSAGE);
    }
    return value;
  }
}
