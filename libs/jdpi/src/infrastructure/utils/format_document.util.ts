import { JdpiPersonType } from '@zro/jdpi/domain';
import { JdpiPersonTypeException } from '@zro/jdpi/infrastructure';

export const formatDocument = (
  value: number,
  personType: JdpiPersonType,
): string => {
  if (personType === JdpiPersonType.LEGAL_PERSON) {
    return value
      .toString()
      .replace(/[^0-9]/g, '')
      .padStart(14, '0'); // Remove non digits
  }

  if (personType === JdpiPersonType.NATURAL_PERSON) {
    return value
      .toString()
      .replace(/[^0-9]/g, '')
      .padStart(11, '0'); // Remove non digits}
  }

  throw new JdpiPersonTypeException(personType);
};
