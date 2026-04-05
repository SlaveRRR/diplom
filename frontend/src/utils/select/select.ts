import { IdNamedDescriptionData, MappedData } from '@types';

import { SelectOption } from './types';

const convertIdNamedDataToSelectOption = (data: IdNamedDescriptionData[]) =>
  data.map(({ description, id, name }) => ({
    value: id,
    label: name,
    description,
  }));

export const convertIdNamedObjectToSelectOption = <T>(
  data: MappedData<T, IdNamedDescriptionData[]>,
): MappedData<T, SelectOption[]> =>
  Object.assign(
    {},
    ...Object.keys(data).map((key) => ({
      [key]: convertIdNamedDataToSelectOption(data[key]),
    })),
  );
